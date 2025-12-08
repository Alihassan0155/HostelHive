import express from 'express';
import authRoutes from './auth.js';
import userRoutes from './users.js';
import hostelRoutes from './hostels.js';
import issueRoutes from './issues.js';
import ratingRoutes from './ratings.js';
import notificationRoutes from './notifications.js';

const router = express.Router();

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'HostelHelp API is running',
    timestamp: new Date().toISOString(),
  });
});

// API routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/hostels', hostelRoutes);
router.use('/issues', issueRoutes);
router.use('/ratings', ratingRoutes);
router.use('/notifications', notificationRoutes);

export default router;

