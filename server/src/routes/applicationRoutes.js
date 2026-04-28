const express = require('express');
const router = express.Router();
const Application = require('../models/Applications');
const Job = require('../models/Jobs');
const upload = require('../middleware/upload');
const { protect, allowRoles } = require('../middleware/authMiddleware');

const STATUS_TRANSITIONS = {
  Applied: ['Under Review', 'Shortlisted', 'Rejected', 'Not Shortlisted'],
  'Under Review': ['Shortlisted', 'Rejected', 'Interview Scheduled', 'Not Shortlisted'],
  Shortlisted: ['Interview Scheduled', 'Rejected', 'Selected'],
  'Interview Scheduled': ['Selected', 'Rejected'],
  Selected: [],
  Rejected: [],
  'Not Shortlisted': [],
};

// POST /api/applications - apply for a job
router.post('/', protect, allowRoles('Applicant'), upload.single('resume'), async (req, res) => {
  try {
    const { jobId, coverLetter } = req.body;
    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ message: 'Job not found' });
    if (job.deadline && new Date(job.deadline) < new Date()) {
      return res.status(400).json({ message: 'Application deadline has passed' });
    }

    const existing = await Application.findOne({ jobId, applicantId: req.user._id });
    if (existing) {
      return res.status(409).json({ message: `Already applied. Status: ${existing.status}` });
    }

    const app = await Application.create({
      jobId,
      applicantId: req.user._id,
      resume: req.file ? `uploads/${req.file.filename}` : req.user.resume || 'no-resume',
      coverLetter: coverLetter || '',
    });

    res.status(201).json(app);
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: 'Already applied for this job' });
    res.status(500).json({ message: 'Failed to submit application' });
  }
});

// GET /api/applications
router.get('/', protect, async (req, res) => {
  try {
    const query = {};
    if (req.user.role === 'Applicant') {
      query.applicantId = req.user._id;
    } else if (req.user.role === 'Recruiter' || req.user.role === 'HR') {
      const ownJobs = await Job.find({ postedBy: req.user._id }).select('_id');
      query.jobId = { $in: ownJobs.map(j => j._id) };
    }

    if (req.query.jobId && req.user.role !== 'Applicant') {
      query.jobId = req.query.jobId;
    }
    if (req.query.status) query.status = req.query.status;

    const apps = await Application.find(query)
      .populate('jobId', 'title company location jobType')
      .populate('applicantId', 'name email phone skills experience')
      .sort({ createdAt: -1 });

    res.json(apps);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch applications' });
  }
});

// PATCH /api/applications/:id/status
router.patch('/:id/status', protect, allowRoles('Recruiter', 'HR', 'Admin'), async (req, res) => {
  try {
    const { status, notes, statusReason } = req.body;
    const app = await Application.findById(req.params.id).populate('jobId', 'postedBy');
    if (!app) return res.status(404).json({ message: 'Application not found' });

    if (req.user.role === 'Recruiter' && String(app.jobId.postedBy) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Can only manage applications for your own jobs' });
    }

    const validTransitions = STATUS_TRANSITIONS[app.status];
    if (!validTransitions.includes(status) && app.status !== status) {
      return res.status(400).json({ message: `Cannot transition from ${app.status} to ${status}` });
    }

    app.status = status;
    app.notes = notes || app.notes;
    app.statusReason = statusReason || '';
    await app.save();

    const updated = await Application.findById(app._id)
      .populate('jobId', 'title company')
      .populate('applicantId', 'name email');

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update status' });
  }
});

module.exports = router;
