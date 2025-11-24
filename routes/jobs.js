import express from 'express';
import Job from '../models/Job.js';

const router = express.Router();

// GET /api/jobs - Get all jobs with filtering (existing)
router.get('/', async (req, res) => {
  try {
    const { 
      type, 
      category, 
      location, 
      remote, 
      featured,
      page = 1, 
      limit = 10 
    } = req.query;

    const filter = {};
    
    if (type) filter.type = type;
    if (category) filter.category = category;
    if (location) filter.location = { $regex: location, $options: 'i' };
    if (remote) filter.isRemote = remote === 'true';
    if (featured) filter.isFeatured = featured === 'true';

    const skip = (page - 1) * limit;

    const jobs = await Job.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Job.countDocuments(filter);
    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: jobs,
      pagination: {
        current: parseInt(page),
        total: totalPages,
        count: jobs.length,
        totalJobs: total
      }
    });
  } catch (error) {
    console.error('Get jobs error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching jobs',
      error: error.message
    });
  }
});

// GET /api/jobs/search - Search jobs (existing)
router.get('/search', async (req, res) => {
  try {
    const { q, page = 1, limit = 10 } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    const skip = (page - 1) * limit;

    const jobs = await Job.find(
      { $text: { $search: q } },
      { score: { $meta: 'textScore' } }
    )
      .sort({ score: { $meta: 'textScore' } })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Job.countDocuments({ $text: { $search: q } });
    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: jobs,
      pagination: {
        current: parseInt(page),
        total: totalPages,
        count: jobs.length,
        totalJobs: total
      }
    });
  } catch (error) {
    console.error('Search jobs error:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching jobs',
      error: error.message
    });
  }
});

// GET /api/jobs/:id - Get single job (existing)
router.get('/:id', async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    res.json({
      success: true,
      data: job
    });
  } catch (error) {
    console.error('Get job error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid job ID'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error fetching job',
      error: error.message
    });
  }
});

// POST /api/jobs - Create new job
router.post('/', async (req, res) => {
  try {
    const {
      title,
      company,
      location,
      type,
      category,
      salary,
      description,
      requirements,
      isRemote = false,
      isFeatured = false,
      isUrgent = false,
      employerId
    } = req.body;

    // Basic validation
    if (!title || !company || !location || !type || !category || !salary || !description || !employerId) {
      return res.status(400).json({
        success: false,
        message: 'All required fields must be provided'
      });
    }

    if (!requirements || !Array.isArray(requirements) || requirements.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one requirement is required'
      });
    }

    const newJob = new Job({
      title,
      company,
      location,
      type,
      category,
      salary,
      description,
      requirements,
      isRemote,
      isFeatured,
      isUrgent,
      employerId
    });

    const savedJob = await newJob.save();

    res.status(201).json({
      success: true,
      message: 'Job created successfully',
      data: savedJob
    });
  } catch (error) {
    console.error('Create job error:', error);
    
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
      message: 'Error creating job',
      error: error.message
    });
  }
});

// PUT /api/jobs/:id - Update job
router.put('/:id', async (req, res) => {
  try {
    const {
      title,
      company,
      location,
      type,
      category,
      salary,
      description,
      requirements,
      isRemote,
      isFeatured,
      isUrgent
    } = req.body;

    // Find job first
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    // Update fields
    const updateData = {};
    if (title) updateData.title = title;
    if (company) updateData.company = company;
    if (location) updateData.location = location;
    if (type) updateData.type = type;
    if (category) updateData.category = category;
    if (salary) updateData.salary = salary;
    if (description) updateData.description = description;
    if (requirements) updateData.requirements = requirements;
    if (typeof isRemote === 'boolean') updateData.isRemote = isRemote;
    if (typeof isFeatured === 'boolean') updateData.isFeatured = isFeatured;
    if (typeof isUrgent === 'boolean') updateData.isUrgent = isUrgent;

    const updatedJob = await Job.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Job updated successfully',
      data: updatedJob
    });
  } catch (error) {
    console.error('Update job error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid job ID'
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
      message: 'Error updating job',
      error: error.message
    });
  }
});

// DELETE /api/jobs/:id - Delete job
router.delete('/:id', async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    await Job.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Job deleted successfully',
      data: {
        id: req.params.id,
        title: job.title,
        company: job.company
      }
    });
  } catch (error) {
    console.error('Delete job error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid job ID'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error deleting job',
      error: error.message
    });
  }
});

// GET /api/jobs/stats/count - Get job statistics (existing)
router.get('/stats/count', async (req, res) => {
  try {
    const totalJobs = await Job.countDocuments();
    const featuredJobs = await Job.countDocuments({ isFeatured: true });
    const remoteJobs = await Job.countDocuments({ isRemote: true });
    
    const categoryStats = await Job.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    const typeStats = await Job.aggregate([
      {
        $group: {
          _id: '$type',
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
        totalJobs,
        featuredJobs,
        remoteJobs,
        categories: categoryStats,
        types: typeStats
      }
    });
  } catch (error) {
    console.error('Get job stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching job statistics',
      error: error.message
    });
  }
});

export default router;