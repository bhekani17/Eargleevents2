import express from 'express';
import { 
  getAllPackages, 
  getFeaturedPackages,
  getPackageById,
  createPackage, 
  updatePackage, 
  deletePackage,
  toggleActiveStatus,
  togglePopularStatus
} from '../controllers/packagesController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes (no authentication required - for customer frontend)
router.get('/', getAllPackages);                 // GET /api/packages
router.get('/featured', getFeaturedPackages);    // GET /api/packages/featured
router.get('/:id', getPackageById);              // GET /api/packages/:id


// Protected routes (authentication required - admin only)
router.post('/', protect, createPackage);      // POST /api/package
router.put('/:id', protect, updatePackage);    // PUT /api/packages/:id  
router.delete('/:id', protect, deletePackage); // DELETE /api/packages/:id
router.patch('/:id/toggle-active', protect, toggleActiveStatus);   // PATCH /api/packages/:id/toggle-active
router.patch('/:id/toggle-popular', protect, togglePopularStatus); // PATCH /api/packages/:id/toggle-popular

export default router;