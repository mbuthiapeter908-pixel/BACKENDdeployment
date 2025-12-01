import express from 'express';
import User from '../models/User.js';
import Job from '../models/Job.js';

const router = express.Router();

// POST /api/applications - Apply for a job
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

    // Find user
    const user = await User.findOne({ clerkUserId });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
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
    const { page = 1, limit = 10 } = req.query;

    const user = await User.findOne({ clerkUserId })
      .populate('applications.jobId')
      .select('applications');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Paginate applications
    const skip = (page - 1) * limit;
    const applications = user.applications
      .sort((a, b) => new Date(b.appliedAt) - new Date(a.appliedAt))
      .slice(skip, skip + parseInt(limit));

    res.json({
      success: true,
      data: applications,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(user.applications.length / limit),
        count: applications.length,
        totalApplications: user.applications.length
      }
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

// GET /api/applications/job/:jobId - Get applications for a job (employer view)
router.get('/job/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    // Verify job exists and get employer info
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    // Find all users who applied to this job
    const users = await User.find({ 
      'applications.jobId': jobId 
    }).populate('applications.jobId');

    const applications = users.flatMap(user => 
      user.applications
        .filter(app => app.jobId._id.toString() === jobId)
        .map(app => ({
          ...app.toObject(),
          user: {
            _id: user._id,
            clerkUserId: user.clerkUserId,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            profileImage: user.profileImage
          }
        }))
    ).sort((a, b) => new Date(b.appliedAt) - new Date(a.appliedAt));

    // Paginate
    const skip = (page - 1) * limit;
    const paginatedApplications = applications.slice(skip, skip + parseInt(limit));

    res.json({
      success: true,
      data: paginatedApplications,
      job: {
        title: job.title,
        company: job.company
      },
      pagination: {
        current: parseInt(page),
        total: Math.ceil(applications.length / limit),
        count: paginatedApplications.length,
        totalApplications: applications.length
      }
    });

  } catch (error) {
    console.error('Get job applications error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching job applications',
      error: error.message
    });
  }
});

// PUT /api/applications/:applicationId/status - Update application status
router.put('/:applicationId/status', async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { status, clerkUserId } = req.body;

    if (!status || !clerkUserId) {
      return res.status(400).json({
        success: false,
        message: 'Status and User ID are required'
      });
    }

    const user = await User.findOne({ 
      'applications._id': applicationId,
      clerkUserId 
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    const application = user.applications.id(applicationId);
    application.status = status;

    await user.save();

    res.json({
      success: true,
      message: 'Application status updated successfully',
      data: application
    });

  } catch (error) {
    console.error('Update application status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating application status',
      error: error.message
    });
  }
});

export default router;