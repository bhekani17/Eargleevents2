import express from 'express';
import { 
  submitQuote, 
  getQuotes, 
  getQuoteById,
  updateQuoteStatus,
  updateQuotePaymentStatus,
  deleteQuote,
  updateQuote
} from '../controllers/quoteController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public route for submitting a new quote
router.post('/', submitQuote);

// Protected routes (require authentication and admin role)
router.use(protect);
router.use(authorize('admin'));

// Get all quotes with filtering and pagination
router.get('/', getQuotes);

// Get a single quote by ID
router.route('/:id')
  .get(getQuoteById)
  .put(updateQuote)
  .delete(deleteQuote);

// Update quote status
router.patch('/:id/status', updateQuoteStatus);

// Update payment status
router.patch('/:id/payment-status', updateQuotePaymentStatus);

export default router;
