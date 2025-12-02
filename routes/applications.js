import express from 'express';
import User from '../models/User.js';
import Job from '../models/Job.js';

const router = express.Router();

// POST /api/applications - Apply for a job (WITH AUTO-USER CREATION)
router.post('/', async (req, res) => {
  try {
    const { clerkUserId, jobId, coverLetter, resumeUrl, notes } = req.body;

    // Validation
    if (!clerkUserId || !jobId) {
      return res.status(400).json({
        success: false,
        message: 'User ID and Job ID are required'
      });
    }

    // Check if job exists
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    // Find OR CREATE user
    let user = await User.findOne({ clerkUserId });
    
    if (!user) {
      // Auto-create user if they don't exist
      user = new User({
        clerkUserId: clerkUserId,
        email: req.body.email || `${clerkUserId}@jobhub.app`,
        firstName: req.body.firstName || 'User',
        lastName: req.body.lastName || '',
        userType: 'job_seeker'
      });
      await user.save();
      console.log(`✅ Auto-created user for application: ${clerkUserId}`);
    }

    // Check if already applied
    const existingApplication = user.applications.find(
      app => app.jobId.toString() === jobId
    );

    if (existingApplication) {
      return res.status(400).json({
        success: false,
        message: 'You have already applied for this job'
      });
    }

    // Create application
    user.applications.push({
      jobId,
      coverLetter: coverLetter || '',
      resumeUrl: resumeUrl || '',
      notes: notes || '',
      appliedAt: new Date()
    });

    await user.save();

    // Increment application count on job
    await Job.findByIdAndUpdate(jobId, {
      $inc: { applicationCount: 1 }
    });

    // Populate job details for response
    await user.populate('applications.jobId');

    const newApplication = user.applications[user.applications.length - 1];

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully!',
      data: newApplication
    });

  } catch (error) {
    console.error('Apply job error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid job ID'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error submitting application',
      error: error.message
    });
  }
});

// GET /api/applications/user/:clerkUserId - Get user's applications
router.get('/user/:clerkUserId', async (req, res) => {
  try {
    const { clerkUserId } = req.params;

    // Find user
    const user = await User.findOne({ clerkUserId })
      .populate('applications.jobId');

    if (!user) {
      // Return empty array instead of 404
      return res.json({
        success: true,
        data: [],
        message: 'No applications found'
      });
    }

    res.json({
      success: true,
      data: user.applications.sort((a, b) => new Date(b.appliedAt) - new Date(a.appliedAt))
    });

  } catch (error) {
    console.error('Get applications error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching applications',
      error: error.message
    });
  }
});

export default router;