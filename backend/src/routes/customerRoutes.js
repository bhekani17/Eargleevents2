import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { 
  createCustomer,
  getCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
  getCustomersWithApprovedQuotes
} from '../controllers/customerController.js';

const router = express.Router();

// All customer routes require admin authentication
router.use(protect);

router.route('/')
  .get(getCustomers)
  .post(createCustomer);

router.get('/approved-quotes', getCustomersWithApprovedQuotes);

router.route('/:id')
  .get(getCustomerById)
  .put(updateCustomer)
  .delete(deleteCustomer);

export default router;
