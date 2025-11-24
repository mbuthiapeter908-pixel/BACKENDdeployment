import express from 'express';
import User from '../models/User.js';

const router = express.Router();

// GET /api/users/me - Get current user profile
router.get('/me', async (req, res) => {
  try {
    // In a real app, you'd get user ID from JWT token or session
    // For now, we'll use a query parameter for demo
    const { clerkUserId } = req.query;

    if (!clerkUserId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    const user = await User.findOne({ clerkUserId })
      .populate('applications.jobId')
      .populate('savedJobs.jobId');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user profile',
      error: error.message
    });
  }
});

// PUT /api/users/me - Update user profile
router.put('/me', async (req, res) => {
  try {
    const { clerkUserId, updates } = req.body;

    if (!clerkUserId || !updates) {
      return res.status(400).json({
        success: false,
        message: 'User ID and updates are required'
      });
    }

    const user = await User.findOneAndUpdate(
      { clerkUserId },
      updates,
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: user
    });
  } catch (error) {
    console.error('Update user error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error updating user profile',
      error: error.message
    });
  }
});

// POST /api/users/me/applications - Apply for a job
router.post('/me/applications', async (req, res) => {
  try {
    const { clerkUserId, jobId, coverLetter } = req.body;

    if (!clerkUserId || !jobId) {
      return res.status(400).json({
        success: false,
        message: 'User ID and Job ID are required'
      });
    }

    const user = await User.findOne({ clerkUserId });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if already applied
    const alreadyApplied = user.applications.some(app => 
      app.jobId.toString() === jobId
    );

    if (alreadyApplied) {
      return res.status(400).json({
        success: false,
        message: 'You have already applied for this job'
      });
    }

    // Add application
    user.applications.push({
      jobId,
      coverLetter: coverLetter || '',
      appliedAt: new Date()
    });

    await user.save();

    // Populate the job details for response
    await user.populate('applications.jobId');

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully',
      data: user.applications[user.applications.length - 1]
    });
  } catch (error) {
    console.error('Apply job error:', error);
    res.status(500).json({
      success: false,
      message: 'Error submitting application',
      error: error.message
    });
  }
});

// POST /api/users/me/saved-jobs - Save a job
router.post('/me/saved-jobs', async (req, res) => {
  try {
    const { clerkUserId, jobId } = req.body;

    if (!clerkUserId || !jobId) {
      return res.status(400).json({
        success: false,
        message: 'User ID and Job ID are required'
      });
    }

    const user = await User.findOne({ clerkUserId });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if already saved
    const alreadySaved = user.savedJobs.some(saved => 
      saved.jobId.toString() === jobId
    );

    if (alreadySaved) {
      return res.status(400).json({
        success: false,
        message: 'Job already saved'
      });
    }

    // Save job
    user.savedJobs.push({
      jobId,
      savedAt: new Date()
    });

    await user.save();

    res.json({
      success: true,
      message: 'Job saved successfully',
      data: { jobId }
    });
  } catch (error) {
    console.error('Save job error:', error);
    res.status(500).json({
      success: false,
      message: 'Error saving job',
      error: error.message
    });
  }
});

export default router;