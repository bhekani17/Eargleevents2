import express from 'express';
import { processPayment, getPaymentDetails } from '../controllers/paymentController.js';

const router = express.Router();

// Process payment for a quote
router.post('/process', processPayment);

// Get payment details for a quote
router.get('/quote/:quoteId', getPaymentDetails);

export default router;
