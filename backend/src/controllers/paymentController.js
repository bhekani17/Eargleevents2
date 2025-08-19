import Quote from '../models/quote.js';
import { sendEmail } from '../utils/emailService.js';

// @desc    Process payment for a quote
// @route   POST /api/payments/process
// @access  Public
export const processPayment = async (req, res) => {
  try {
    const { quoteId, paymentMethod, amount, reference } = req.body;

    // Validate required fields
    if (!quoteId || !paymentMethod || amount === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Quote ID, payment method, and amount are required'
      });
    }

    // Find the quote
    const quote = await Quote.findById(quoteId);
    if (!quote) {
      return res.status(404).json({
        success: false,
        message: 'Quote not found'
      });
    }

    // Verify amount matches quote total
    if (amount !== quote.totalAmount) {
      return res.status(400).json({
        success: false,
        message: 'Payment amount does not match quote total'
      });
    }

    // Process payment (in a real app, integrate with a payment gateway like PayFast, PayPal, etc.)
    // For now, we'll simulate a successful payment
    const payment = {
      method: paymentMethod,
      status: 'completed',
      amount,
      currency: 'ZAR',
      reference: reference || `PAY-${Date.now()}`,
      transactionId: `TXN-${Date.now()}`,
      paidAt: new Date()
    };

    // Update quote with payment information
    quote.payment = payment;
    quote.status = 'confirmed';
    await quote.save();

    // Send payment confirmation email
    await sendPaymentConfirmationEmail(quote, payment);

    res.status(200).json({
      success: true,
      message: 'Payment processed successfully',
      data: {
        quoteId: quote._id,
        paymentStatus: payment.status,
        transactionId: payment.transactionId,
        receiptUrl: payment.receiptUrl
      }
    });
  } catch (error) {
    console.error('Payment processing error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing payment',
      error: error.message
    });
  }
};

// @desc    Get payment details for a quote
// @route   GET /api/payments/quote/:quoteId
// @access  Public
export const getPaymentDetails = async (req, res) => {
  try {
    const { quoteId } = req.params;

    const quote = await Quote.findById(quoteId).select('payment totalAmount status');
    if (!quote) {
      return res.status(404).json({
        success: false,
        message: 'Quote not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        quoteId: quote._id,
        totalAmount: quote.totalAmount,
        status: quote.status,
        payment: quote.payment
      }
    });
  } catch (error) {
    console.error('Error fetching payment details:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching payment details',
      error: error.message
    });
  }
};

// Helper function to send payment confirmation email
const sendPaymentConfirmationEmail = async (quote, payment) => {
  try {
    const subject = `Payment Confirmation - Quote #${quote._id}`;
    
    const paymentMethodMap = {
      'credit_card': 'Credit Card',
      'bank_transfer': 'Bank Transfer',
      'cash': 'Cash',
      'eft': 'Electronic Funds Transfer'
    };

    const html = `
      <h1>Payment Confirmation</h1>
      <p>Dear ${quote.customerName},</p>
      <p>Your payment has been processed successfully. Below are the details:</p>
      
      <h3>Payment Summary</h3>
      <p><strong>Quote ID:</strong> ${quote._id}</p>
      <p><strong>Amount Paid:</strong> R${payment.amount.toFixed(2)}</p>
      <p><strong>Payment Method:</strong> ${paymentMethodMap[payment.method] || payment.method}</p>
      <p><strong>Transaction ID:</strong> ${payment.transactionId}</p>
      <p><strong>Date:</strong> ${new Date(payment.paidAt).toLocaleString()}</p>
      
      <h3>Event Details</h3>
      <p><strong>Event Date:</strong> ${new Date(quote.eventDate).toDateString()}</p>
      <p><strong>Location:</strong> ${quote.location}</p>
      
      <p>Thank you for choosing our services. We look forward to serving you!</p>
      <p>Best regards,<br/>Eagle Events Team</p>
    `;

    await sendEmail({
      to: quote.email,
      subject,
      html
    });

    console.log(`Payment confirmation email sent to ${quote.email}`);
  } catch (error) {
    console.error('Error sending payment confirmation email:', error);
    // Don't fail the request if email sending fails
  }
};
