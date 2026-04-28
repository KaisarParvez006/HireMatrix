const express = require('express');
const router = express.Router();
const Interview = require('../models/Interviews');
const Application = require('../models/Applications');
const { protect, allowRoles } = require('../middleware/authMiddleware');

// POST /api/interviews - schedule an interview
router.post('/', protect, allowRoles('Recruiter', 'HR', 'Admin'), async (req, res) => {
  try {
    const { applicationId, scheduledDate, interviewType, interviewerName, meetLink } = req.body;

    const app = await Application.findById(applicationId);
    if (!app) return res.status(404).json({ message: 'Application not found' });

    // Update application status
    app.status = 'Interview Scheduled';
    await app.save();

    const interview = await Interview.create({
      applicationId,
      scheduledDate: new Date(scheduledDate),
      interviewType: interviewType || 'Technical',
      interviewerName: interviewerName || '',
      meetLink: meetLink || '',
      scheduledBy: req.user._id,
    });

    res.status(201).json(interview);
  } catch (error) {
    res.status(500).json({ message: 'Failed to schedule interview' });
  }
});

// GET /api/interviews
router.get('/', protect, async (req, res) => {
  try {
    let interviews;
    if (req.user.role === 'Applicant') {
      const apps = await Application.find({ applicantId: req.user._id }).select('_id');
      interviews = await Interview.find({ applicationId: { $in: apps.map(a => a._id) } })
        .populate({
          path: 'applicationId',
          populate: { path: 'jobId', select: 'title company' }
        })
        .sort({ scheduledDate: 1 });
    } else {
      interviews = await Interview.find()
        .populate({
          path: 'applicationId',
          populate: [
            { path: 'jobId', select: 'title company' },
            { path: 'applicantId', select: 'name email' }
          ]
        })
        .sort({ scheduledDate: 1 });
    }
    res.json(interviews);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch interviews' });
  }
});

// PATCH /api/interviews/:id - update feedback/result
router.patch('/:id', protect, allowRoles('Recruiter', 'HR', 'HiringManager', 'Admin'), async (req, res) => {
  try {
    const { feedback, result } = req.body;
    const interview = await Interview.findByIdAndUpdate(
      req.params.id,
      { feedback, result },
      { new: true }
    ).populate({
      path: 'applicationId',
      populate: [
        { path: 'jobId', select: 'title company' },
        { path: 'applicantId', select: 'name email' }
      ]
    });
    if (!interview) return res.status(404).json({ message: 'Interview not found' });
    res.json(interview);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update interview' });
  }
});

module.exports = router;
