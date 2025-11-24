import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import connectDB from './config/database.js';
import webhookRoutes from './routes/webhooks.js';
// Import routes
import jobRoutes from './routes/jobs.js';
import employerRoutes from './routes/employers.js';
import categoryRoutes from './routes/categories.js';
import userRoutes from './routes/users.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/users', userRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/employers', employerRoutes);
app.use('/api/categories', categoryRoutes);

// Basic route
app.get('/', (req, res) => {
  res.json({
    message: 'JobHub Backend API is running!',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      jobs: '/api/jobs',
      employers: '/api/employers',
      categories: '/api/categories'
    }
  });
});

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'production' ? {} : err.message
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    message: 'Route not found',
    path: req.originalUrl,
    method: req.method
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`📝 API Documentation:`);
  console.log(`   - Jobs: http://localhost:${PORT}/api/jobs`);
  console.log(`   - Employers: http://localhost:${PORT}/api/employers`);
  console.log(`   - Categories: http://localhost:${PORT}/api/categories`);
});

export default app;