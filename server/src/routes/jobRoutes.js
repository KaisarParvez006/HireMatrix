const express = require('express');
const router = express.Router();
const Job = require('../models/Jobs');
const { protect, allowRoles } = require('../middleware/authMiddleware');

// GET /api/jobs - get all jobs (role-filtered)
router.get('/', protect, async (req, res) => {
  try {
    const query = {};
    if (req.user.role === 'Recruiter' || req.user.role === 'HR') {
      query.postedBy = req.user._id;
    }
    const jobs = await Job.find(query).populate('postedBy', 'name role').sort({ createdAt: -1 });
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch jobs' });
  }
});

// POST /api/jobs - create a job
router.post('/', protect, allowRoles('Recruiter', 'HR', 'Admin'), async (req, res) => {
  try {
    const { title, company, description, requirements, location, jobType, salary, deadline } = req.body;
    if (!title || !company || !description) {
      return res.status(400).json({ message: 'Title, company and description are required' });
    }
    const job = await Job.create({
      title,
      company,
      description,
      requirements: (requirements || []).filter(Boolean),
      location: location || 'Remote',
      jobType: jobType || 'Full-time',
      salary: salary || '',
      deadline: deadline || undefined,
      postedBy: req.user._id,
    });
    res.status(201).json(job);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create job' });
  }
});

// PUT /api/jobs/:id - update a job
router.put('/:id', protect, allowRoles('Recruiter', 'HR', 'Admin'), async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ message: 'Job not found' });
    if (req.user.role === 'Recruiter' && String(job.postedBy) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Can only update your own jobs' });
    }
    const updated = await Job.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update job' });
  }
});

// DELETE /api/jobs/:id
router.delete('/:id', protect, allowRoles('Recruiter', 'HR', 'Admin'), async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ message: 'Job not found' });
    if (req.user.role === 'Recruiter' && String(job.postedBy) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Can only delete your own jobs' });
    }
    await job.deleteOne();
    res.json({ message: 'Job deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete job' });
  }
});

module.exports = router;
