import express from 'express';
import Job from '../models/Job.js';

const router = express.Router();

// GET /api/categories - Get all categories with job counts
router.get('/', async (req, res) => {
  try {
    const categories = await Job.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          featuredJobs: {
            $sum: { $cond: [{ $eq: ['$isFeatured', true] }, 1, 0] }
          },
          remoteJobs: {
            $sum: { $cond: [{ $eq: ['$isRemote', true] }, 1, 0] }
          }
        }
      },
      {
        $project: {
          name: '$_id',
          count: 1,
          featuredJobs: 1,
          remoteJobs: 1,
          _id: 0
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching categories',
      error: error.message
    });
  }
});

// GET /api/categories/:name/jobs - Get jobs by category
router.get('/:name/jobs', async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const jobs = await Job.find({ category: req.params.name })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Job.countDocuments({ category: req.params.name });
    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: jobs,
      category: req.params.name,
      pagination: {
        current: parseInt(page),
        total: totalPages,
        count: jobs.length,
        totalJobs: total
      }
    });
  } catch (error) {
    console.error('Get category jobs error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching category jobs',
      error: error.message
    });
  }
});

export default router;