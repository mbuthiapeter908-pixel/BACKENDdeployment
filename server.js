import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import connectDB from './config/database.js';

import webhookRoutes from './routes/webhooks.js';
import jobRoutes from './routes/jobs.js';
import employerRoutes from './routes/employers.js';
import categoryRoutes from './routes/categories.js';
import userRoutes from './routes/users.js';
import applicationRoutes from './routes/applications.js';
import contactRoutes from './routes/contact.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const BACKEND_URL = process.env.BACKEND_URL || 'https://backenddeployment-1-wwzi.onrender.com';

// Connect to MongoDB
connectDB();

// Middleware
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined'));

app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "https://jobhub-works.vercel.app",   // your frontend
      "https://backenddeployment-1-wwzi.onrender.com" // backend (self)
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);


// Routes
app.use('/api/users', userRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/employers', employerRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/contact', contactRoutes);

// Basic route
app.get('/', (req, res) => {
  res.json({
    message: 'JobHub Backend API is running!',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      jobs: '/api/jobs',
      employers: '/api/employers',
      categories: '/api/categories',
    },
  });
});

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    database:
      mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    timestamp: new Date().toISOString(),
  });
});

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Something went wrong!',
    error:
      process.env.NODE_ENV === 'production' ? {} : err.message,
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    message: 'Route not found',
    path: req.originalUrl,
    method: req.method,
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: ${BACKEND_URL}/health`);
  console.log(`📝 API Endpoints:`);
  console.log(`   - Jobs: ${BACKEND_URL}/api/jobs`);
  console.log(`   - Employers: ${BACKEND_URL}/api/employers`);
  console.log(`   - Categories: ${BACKEND_URL}/api/categories`);
});

export default app;
