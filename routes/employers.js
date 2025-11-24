import express from 'express';
import Employer from '../models/Employer.js';
import Job from '../models/Job.js';

const router = express.Router();

// GET /api/employers - Get all employers (existing)
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, verified } = req.query;

    const filter = {};
    if (verified) filter.isVerified = verified === 'true';

    const skip = (page - 1) * limit;

    const employers = await Employer.find(filter)
      .sort({ companyName: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Employer.countDocuments(filter);
    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: employers,
      pagination: {
        current: parseInt(page),
        total: totalPages,
        count: employers.length,
        totalEmployers: total
      }
    });
  } catch (error) {
    console.error('Get employers error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching employers',
      error: error.message
    });
  }
});

// GET /api/employers/:id - Get single employer (existing)
router.get('/:id', async (req, res) => {
  try {
    const employer = await Employer.findById(req.params.id);

    if (!employer) {
      return res.status(404).json({
        success: false,
        message: 'Employer not found'
      });
    }

    res.json({
      success: true,
      data: employer
    });
  } catch (error) {
    console.error('Get employer error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid employer ID'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error fetching employer',
      error: error.message
    });
  }
});

// POST /api/employers - Create new employer
router.post('/', async (req, res) => {
  try {
    const {
      companyName,
      description,
      website,
      industry,
      size,
      location,
      contactEmail,
      userId
    } = req.body;

    // Basic validation
    if (!companyName || !industry || !size || !location || !contactEmail || !userId) {
      return res.status(400).json({
        success: false,
        message: 'All required fields must be provided'
      });
    }

    // Check if employer already exists with same company name or userId
    const existingEmployer = await Employer.findOne({
      $or: [
        { companyName: { $regex: new RegExp(`^${companyName}$`, 'i') } },
        { userId: userId }
      ]
    });

    if (existingEmployer) {
      return res.status(400).json({
        success: false,
        message: 'Employer with this company name or user ID already exists'
      });
    }

    const newEmployer = new Employer({
      companyName,
      description,
      website,
      industry,
      size,
      location,
      contactEmail,
      userId
    });

    const savedEmployer = await newEmployer.save();

    res.status(201).json({
      success: true,
      message: 'Employer created successfully',
      data: savedEmployer
    });
  } catch (error) {
    console.error('Create employer error:', error);
    
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
      message: 'Error creating employer',
      error: error.message
    });
  }
});

// PUT /api/employers/:id - Update employer
router.put('/:id', async (req, res) => {
  try {
    const {
      companyName,
      description,
      website,
      industry,
      size,
      location,
      contactEmail,
      isVerified
    } = req.body;

    // Find employer first
    const employer = await Employer.findById(req.params.id);
    if (!employer) {
      return res.status(404).json({
        success: false,
        message: 'Employer not found'
      });
    }

    // Update fields
    const updateData = {};
    if (companyName) updateData.companyName = companyName;
    if (description) updateData.description = description;
    if (website) updateData.website = website;
    if (industry) updateData.industry = industry;
    if (size) updateData.size = size;
    if (location) updateData.location = location;
    if (contactEmail) updateData.contactEmail = contactEmail;
    if (typeof isVerified === 'boolean') updateData.isVerified = isVerified;

    const updatedEmployer = await Employer.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Employer updated successfully',
      data: updatedEmployer
    });
  } catch (error) {
    console.error('Update employer error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid employer ID'
      });
    }

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
      message: 'Error updating employer',
      error: error.message
    });
  }
});

// DELETE /api/employers/:id - Delete employer
router.delete('/:id', async (req, res) => {
  try {
    const employer = await Employer.findById(req.params.id);
    
    if (!employer) {
      return res.status(404).json({
        success: false,
        message: 'Employer not found'
      });
    }

    // Check if employer has jobs
    const jobCount = await Job.countDocuments({ employerId: employer.userId });
    if (jobCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete employer with active jobs. Please delete all jobs first.'
      });
    }

    await Employer.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Employer deleted successfully',
      data: {
        id: req.params.id,
        companyName: employer.companyName
      }
    });
  } catch (error) {
    console.error('Delete employer error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid employer ID'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error deleting employer',
      error: error.message
    });
  }
});

// GET /api/employers/:id/jobs - Get jobs by employer (existing)
router.get('/:id/jobs', async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const employer = await Employer.findById(req.params.id);
    if (!employer) {
      return res.status(404).json({
        success: false,
        message: 'Employer not found'
      });
    }

    const jobs = await Job.find({ employerId: employer.userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Job.countDocuments({ employerId: employer.userId });
    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: jobs,
      employer: {
        companyName: employer.companyName,
        description: employer.description
      },
      pagination: {
        current: parseInt(page),
        total: totalPages,
        count: jobs.length,
        totalJobs: total
      }
    });
  } catch (error) {
    console.error('Get employer jobs error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid employer ID'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error fetching employer jobs',
      error: error.message
    });
  }
});

// GET /api/employers/stats/count - Get employer statistics (existing)
router.get('/stats/count', async (req, res) => {
  try {
    const totalEmployers = await Employer.countDocuments();
    const verifiedEmployers = await Employer.countDocuments({ isVerified: true });
    
    const industryStats = await Employer.aggregate([
      {
        $group: {
          _id: '$industry',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    const sizeStats = await Employer.aggregate([
      {
        $group: {
          _id: '$size',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    res.json({
      success: true,
      data: {
        totalEmployers,
        verifiedEmployers,
        industries: industryStats,
        sizes: sizeStats
      }
    });
  } catch (error) {
    console.error('Get employer stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching employer statistics',
      error: error.message
    });
  }
});

export default router;