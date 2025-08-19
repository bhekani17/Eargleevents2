import express from 'express';
import { registerAdmin, loginAdmin, getAdminProfile, logoutAdmin } from '../controllers/adminAuthController.js';
import { getDashboardStats } from '../controllers/adminDashboardController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Authentication routes
router.post('/auth/signup', registerAdmin);
router.post('/auth/login', loginAdmin);
router.get('/auth/me', protect, getAdminProfile);
router.post('/auth/logout', protect, logoutAdmin);

// Dashboard routes
router.get('/dashboard/stats', protect, admin, getDashboardStats);

export default router;
