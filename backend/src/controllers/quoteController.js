import Quote from '../models/quote.js';
import Customer from '../models/customer.js';
import { sendEmail } from '../config/email.js';
import { generateQuotePDF } from '../utils/pdfService.js';
import { customerQuoteTemplate, adminQuoteTemplate } from '../utils/emailTemplates.js';
import asyncHandler from 'express-async-handler';

// @desc    Submit a new quote
// @route   POST /api/quotes
// @access  Public
const isNotifyAdmins = () => {
  const raw = String(process.env.NOTIFY_ADMINS ?? 'true').toLowerCase();
  return ['1', 'true', 'yes', 'on'].includes(raw);
};

export const submitQuote = async (req, res) => {
  try {
    console.log('Received quote submission:', {
      body: req.body,
      headers: req.headers,
      method: req.method,
      url: req.originalUrl
    });

    const {
      customerName,
      email,
      phone,
      eventDate,
      eventType,
      company,
      eventTypeOther,
      services = [],
      guestCount = 1,
      location,
      items = [],
      totalAmount = 0,
      paymentMethod,
      notes = ''
    } = req.body;

    // Basic validation
    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one item is required for a quote'
      });
    }

    // Validate and format event type
    const validEventTypes = ['wedding', 'corporate', 'festival', 'private', 'other'];
    const formattedEventType = validEventTypes.includes(eventType?.toLowerCase?.())
      ? eventType.toLowerCase()
      : 'other';

    // Create new quote with all fields
    const quoteData = {
      customerName,
      company,
      email,
      phone,
      eventDate: new Date(eventDate),
      eventType: formattedEventType,
      eventTypeOther: formattedEventType === 'other' ? (eventTypeOther || '') : undefined,
      services: Array.isArray(services) ? services : [services],
      guestCount: Math.max(1, parseInt(guestCount, 10) || 1),
      location,
      items: items.map(item => ({
        name: item.name,
        quantity: Math.max(1, parseInt(item.quantity, 10) || 1),
        price: parseFloat(item.price) || 0,
        total: (parseFloat(item.price) || 0) * (Math.max(1, parseInt(item.quantity, 10) || 1))
      })),
      totalAmount: parseFloat(totalAmount) || 0,
      paymentMethod,
      notes: String(notes || '').substring(0, 1000),
      status: 'pending',
      paymentStatus: 'pending'
    };

    // Debug: Log the data being saved
    console.log('Attempting to save quote with data:', JSON.stringify(quoteData, null, 2));
    
    // Create quote instance
    const quote = new Quote(quoteData);

    // Save to database
    console.log('Saving quote to database...');
    const savedQuote = await quote.save()
      .then(doc => {
        console.log('Quote saved successfully:', doc._id);
        return doc;
      })
      .catch(err => {
        console.error('Error saving quote to database:', {
          error: err.message,
          code: err.code,
          name: err.name,
          keyPattern: err.keyPattern,
          keyValue: err.keyValue
        });
        throw err; // Re-throw to be caught by the outer catch block
      });

    // Generate PDF once and attach to both emails
    let pdfBuffer = null;
    let pdfFileName = `Quote-${savedQuote.reference || savedQuote._id}.pdf`;
    try {
      pdfBuffer = await generateQuotePDF(savedQuote);
      console.log('Quote PDF generated successfully');
    } catch (pdfErr) {
      console.error('Failed to generate quote PDF:', pdfErr);
    }

    // Send confirmation email (with PDF if available)
    await sendQuoteConfirmationEmail(savedQuote, pdfBuffer, pdfFileName);

    // Send admin notification (with PDF if available) when enabled
    if (isNotifyAdmins()) {
      await sendAdminNotification(savedQuote, pdfBuffer, pdfFileName);
    } else {
      console.log('Admin notifications are disabled via NOTIFY_ADMINS');
    }

    res.status(201).json({
      success: true,
      message: 'Quote submitted successfully',
      data: savedQuote
    });
  } catch (error) {
    console.error('Error submitting quote:', {
      message: error.message,
      name: error.name,
      stack: error.stack,
      code: error.code,
      keyPattern: error.keyPattern,
      keyValue: error.keyValue,
      errors: error.errors
    });

    let statusCode = 500;
    let errorMessage = 'Failed to submit quote';
    let errorDetails = error.message;

    // Handle validation errors
    if (error.name === 'ValidationError') {
      statusCode = 400;
      errorMessage = 'Validation Error';
      errorDetails = Object.values(error.errors).map(err => err.message).join(', ');
    } 
    // Handle duplicate key errors
    else if (error.code === 11000) {
      statusCode = 409;
      errorMessage = 'Duplicate Entry';
      errorDetails = `A quote with this ${Object.keys(error.keyPattern).join(', ')} already exists`;
    }

    res.status(statusCode).json({
      success: false,
      message: errorMessage,
      error: errorDetails,
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
  }
};

// Notify admins on approval/confirmation
async function sendAdminApprovalEmail(quote) {
  const adminEmailsRaw = process.env.ADMIN_EMAILS || process.env.ADMIN_EMAIL || 'admin@eagleevents.com';
  const adminEmail = Array.isArray(adminEmailsRaw)
    ? adminEmailsRaw.join(',')
    : String(adminEmailsRaw)
        .split(',')
        .map(e => e.trim())
        .filter(Boolean)
        .join(',');

  const subject = `✅ Quote Approved #${quote._id}`;
  const eventDate = new Date(quote.eventDate).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  const text = `
QUOTE APPROVED

Quote ID: ${quote._id}
Customer: ${quote.customerName}${quote.company ? ` (${quote.company})` : ''}
Email: ${quote.email}
Phone: ${quote.phone}
Event Date: ${eventDate}
Total: R${Number(quote.totalAmount || 0).toFixed(2)}
Status: ${String(quote.status).toUpperCase()}

View in Admin: ${(process.env.FRONTEND_URL || 'https://eaglesevents.co.za')}/admin/quotes/${quote._id}
  `;

  // Keep HTML simple; reuse customer template data layout for quick readability
  const html = `
    <h2>Quote Approved</h2>
    <p><strong>Quote ID:</strong> ${quote._id}</p>
    <p><strong>Customer:</strong> ${quote.customerName}${quote.company ? ` (${quote.company})` : ''}</p>
    <p><strong>Email:</strong> ${quote.email}</p>
    <p><strong>Phone:</strong> ${quote.phone}</p>
    <p><strong>Event Date:</strong> ${eventDate}</p>
    <p><strong>Total:</strong> R${Number(quote.totalAmount || 0).toFixed(2)}</p>
    <p><strong>Status:</strong> ${String(quote.status).toUpperCase()}</p>
    <p><a href="${(process.env.FRONTEND_URL || 'https://eaglesevents.co.za')}/admin/quotes/${quote._id}">Open in Admin</a></p>
  `;

  // Try to attach the current quote PDF for admin reference
  let pdfBuffer = null;
  let pdfFileName = `Quote-${quote.reference || quote._id}.pdf`;
  try {
    pdfBuffer = await generateQuotePDF(quote);
  } catch (e) {
    console.error('Could not generate PDF for admin approval email:', e);
  }

  await sendEmail({
    to: adminEmail,
    subject,
    text: text.trim(),
    html,
    ...(pdfBuffer ? { attachments: [{ filename: pdfFileName, content: pdfBuffer }] } : {})
  });
}

async function sendQuoteConfirmationEmail(quote, pdfBuffer, pdfFileName) {
  const subject = `Your Quote Request #${quote._id} Has Been Received`;
  const eventDate = new Date(quote.eventDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  // Generate plain text version for email clients that don't support HTML
  const text = `
Dear ${quote.customerName},

Thank you for your quote request. Here are the details:

Quote ID: ${quote._id}
${quote.company ? `Company: ${quote.company}\n` : ''}
Event Type: ${quote.eventType}
${quote.eventType === 'other' && quote.eventTypeOther ? `Other Type: ${quote.eventTypeOther}\n` : ''}
Event Date: ${eventDate}
Guest Count: ${quote.guestCount}
Location: ${quote.location}

Services Requested:
${quote.services.map(service => `- ${service}`).join('\n')}

Selected Items:
${quote.items.map(item => `- ${item.name} (${item.quantity} x R${item.price.toFixed(2)}) = R${(item.quantity * item.price).toFixed(2)}`).join('\n')}

Total Amount: R${quote.totalAmount.toFixed(2)}
Payment Method: ${formatPaymentMethod(quote.paymentMethod)}
Status: ${quote.status.charAt(0).toUpperCase() + quote.status.slice(1)}

${quote.notes ? `\nYour Notes:\n${quote.notes}\n` : ''}
We will review your request and get back to you shortly.

Best regards,
Eagle Events Team

Contact Us:
Phone: +27 71 234 5678
Email: info@eagleevents.com
Website: www.eagleevents.com
  `;

  // Generate HTML version using the template
  const html = customerQuoteTemplate(quote, eventDate);

  try {
    await sendEmail({
      to: quote.email,
      subject,
      text: text.trim(),
      html,
      ...(pdfBuffer ? { attachments: [{ filename: pdfFileName, content: pdfBuffer }] } : {})
    });
    console.log(`Confirmation email sent to ${quote.email}`);
  } catch (error) {
    console.error('Failed to send confirmation email:', error);
    // Don't fail the request if email fails
  }
}

async function sendAdminNotification(quote, pdfBuffer, pdfFileName) {
  // Support multiple admin recipients via comma-separated env var
  // Examples:
  //   ADMIN_EMAILS=admin1@eagle.com,admin2@eagle.com
  //   ADMIN_EMAIL=admin@eagle.com (fallback)
  const adminEmailsRaw = process.env.ADMIN_EMAILS || process.env.ADMIN_EMAIL || 'admin@eagleevents.com';
  const adminEmail = Array.isArray(adminEmailsRaw)
    ? adminEmailsRaw.join(',')
    : String(adminEmailsRaw)
        .split(',')
        .map(e => e.trim())
        .filter(Boolean)
        .join(',');
  const subject = `📋 New Quote Request #${quote._id}`;
  const eventDate = new Date(quote.eventDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  // Generate plain text version for email clients that don't support HTML
  const text = `
NEW QUOTE REQUEST RECEIVED

📋 Quote ID: ${quote._id}
📅 Submitted: ${new Date(quote.createdAt).toLocaleString()}

👤 CUSTOMER DETAILS
Name: ${quote.customerName}
${quote.company ? `Company: ${quote.company}\n` : ''}
Email: ${quote.email}
Phone: ${quote.phone}

🎯 EVENT DETAILS
Type: ${quote.eventType}
${quote.eventType === 'other' && quote.eventTypeOther ? `Other Type: ${quote.eventTypeOther}\n` : ''}
Date: ${eventDate}
Guest Count: ${quote.guestCount}
Location: ${quote.location}

🔧 SERVICES REQUESTED
${quote.services.map(service => `• ${service}`).join('\n')}

🛒 SELECTED ITEMS
${quote.items.map(item => `• ${item.quantity}x ${item.name} @ R${item.price.toFixed(2)} = R${(item.quantity * item.price).toFixed(2)}`).join('\n')}

💰 PAYMENT
Subtotal: R${quote.totalAmount.toFixed(2)}
Payment Method: ${formatPaymentMethod(quote.paymentMethod)}
Status: ${quote.paymentStatus.toUpperCase()}

${quote.notes ? `📝 CUSTOMER NOTES\n${quote.notes}\n` : ''}
🔗 Quick Actions:
- View Quote: ${process.env.FRONTEND_URL || 'https://eagleevents.com'}/admin/quotes/${quote._id}
- Approve: ${process.env.BACKEND_URL || 'https://api.eagleevents.com'}/api/quotes/${quote._id}/status -d '{"status":"approved"}'
- Reject: ${process.env.BACKEND_URL || 'https://api.eagleevents.com'}/api/quotes/${quote._id}/status -d '{"status":"rejected"}'

Please log in to the admin panel to manage this quote.
  `;

  // Generate HTML version using the template
  const html = adminQuoteTemplate(quote, eventDate);

  try {
    await sendEmail({
      to: adminEmail,
      subject,
      text: text.trim(),
      html,
      ...(pdfBuffer ? { attachments: [{ filename: pdfFileName, content: pdfBuffer }] } : {})
    });
    console.log(`Admin notification sent to ${adminEmail} for quote #${quote._id}`);
  } catch (error) {
    console.error('Failed to send admin notification:', error);
    // Don't fail the request if email fails
  }
}

function formatPaymentMethod(method) {
  const methods = {
    card: 'Credit/Debit Card',
    bank_transfer: 'Bank Transfer',
    cash: 'Cash on Delivery',
    mobile: 'Mobile Payment'
  };
  return methods[method] || method;
}

// Helper: send status update email to customer when quote is confirmed/approved
async function sendQuoteStatusUpdateEmail(quote) {
  const subject = `Your Quote #${quote._id} Has Been Confirmed`;
  const eventDate = new Date(quote.eventDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const text = `
Dear ${quote.customerName},

Great news! Your quote has been confirmed.

Quote ID: ${quote._id}
Event Type: ${quote.eventType}${quote.eventType === 'other' && quote.eventTypeOther ? ` (${quote.eventTypeOther})` : ''}
Event Date: ${eventDate}
Guest Count: ${quote.guestCount}
Location: ${quote.location}

Total Amount: R${Number(quote.totalAmount || 0).toFixed(2)}
Current Status: ${String(quote.status).toUpperCase()}

If any details need changes, reply to this email or contact us.

Best regards,
Eagles Events Team
`; 

  // Try attach a PDF of the current quote
  let pdfBuffer = null;
  let pdfFileName = `Quote-${quote.reference || quote._id}.pdf`;
  try {
    pdfBuffer = await generateQuotePDF(quote);
  } catch (e) {
    console.error('Could not generate PDF for status email:', e);
  }

  const html = customerQuoteTemplate(quote, eventDate);

  await sendEmail({
    to: quote.email,
    subject,
    text: text.trim(),
    html,
    ...(pdfBuffer ? { attachments: [{ filename: pdfFileName, content: pdfBuffer }] } : {})
  });
}

/**
 * Create or update customer record from approved quote
 * @param {Object} quote - The approved quote
 */
const createCustomerFromQuote = async (quote) => {
  try {
    if (!quote.email) {
      console.warn('Cannot create customer: no email in quote');
      return;
    }

    // Check if customer already exists
    let customer = await Customer.findOne({ email: quote.email });
    
    if (customer) {
      // Update existing customer with latest info
      customer.name = quote.customerName || customer.name;
      customer.phone = quote.phone || customer.phone;
      customer.status = 'active';
      customer.lastEventDate = quote.eventDate || customer.lastEventDate;
      customer.totalSpent = (customer.totalSpent || 0) + Number(quote.totalAmount || 0);
      customer.totalBookings = (customer.totalBookings || 0) + 1;
      await customer.save();
      console.log(`Updated existing customer: ${customer.email}`);
    } else {
      // Create new customer
      customer = await Customer.create({
        name: quote.customerName || 'Customer',
        email: quote.email,
        phone: quote.phone,
        status: 'active',
        lastEventDate: quote.eventDate,
        totalSpent: Number(quote.totalAmount || 0),
        totalBookings: 1,
        notes: `Created from approved quote ${quote.reference || quote._id}`
      });
      console.log(`Created new customer: ${customer.email}`);
    }
    
    return customer;
  } catch (error) {
    console.error('Error creating/updating customer from quote:', error);
    throw error;
  }
};

/**
 * @desc    Update a quote
 * @route   PUT /api/quotes/:id
 * @access  Private/Admin
 */
export const updateQuote = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Remove fields that shouldn't be updated
    const { _id, createdAt, updatedAt, __v, ...validUpdate } = updateData;

    // If items array is provided, update it properly
    if (validUpdate.items && Array.isArray(validUpdate.items)) {
      validUpdate.items = validUpdate.items.map(item => ({
        name: item.name,
        quantity: Math.max(1, parseInt(item.quantity, 10) || 1),
        price: parseFloat(item.price) || 0,
        total: (parseFloat(item.price) || 0) * (Math.max(1, parseInt(item.quantity, 10) || 1))
      }));
    }

    // Handle status updates
    if (validUpdate.status) {
      validUpdate.status = validUpdate.status.toLowerCase();
      if (!['pending', 'confirmed', 'rejected', 'completed'].includes(validUpdate.status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status. Must be one of: pending, confirmed, rejected, completed'
        });
      }
    }

    // Fetch existing quote to detect status changes
    const existing = await Quote.findById(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Quote not found' });
    }

    // Update the quote
    const quote = await Quote.findByIdAndUpdate(
      id,
      { $set: validUpdate },
      { 
        new: true, 
        runValidators: true,
        context: 'query' // Required for proper validation
      }
    );

    if (!quote) {
      return res.status(404).json({
        success: false,
        message: 'Quote not found'
      });
    }

    // If status transitioned to confirmed/approved, notify customer and create customer record
    try {
      const newStatus = validUpdate.status?.toLowerCase?.();
      const prevStatus = existing.status?.toLowerCase?.();
      if (newStatus && (newStatus === 'confirmed' || newStatus === 'approved') && newStatus !== prevStatus) {
        await sendQuoteStatusUpdateEmail(quote);
        await createCustomerFromQuote(quote);
        if (isNotifyAdmins()) {
          await sendAdminApprovalEmail(quote);
        }
      }
    } catch (notifyErr) {
      console.error('Failed sending status update email or creating customer:', notifyErr);
    }

    // Format the response
    const response = quote.toObject();
    response.id = response._id;
    delete response._id;
    delete response.__v;

    res.status(200).json({
      success: true,
      message: 'Quote updated successfully',
      data: response
    });
  } catch (error) {
    console.error('Error updating quote:', error);
    
    let statusCode = 500;
    let errorMessage = 'Failed to update quote';
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      statusCode = 400;
      errorMessage = 'Validation Error';
      error.message = Object.values(error.errors).map(err => err.message).join(', ');
    }
    // Handle duplicate key errors
    else if (error.code === 11000) {
      statusCode = 409;
      errorMessage = 'Duplicate Entry';
      error.message = `A quote with this ${Object.keys(error.keyPattern).join(', ')} already exists`;
    }
    // Handle cast errors (invalid ID format)
    else if (error.name === 'CastError') {
      statusCode = 400;
      errorMessage = 'Invalid ID format';
    }

    res.status(statusCode).json({
      success: false,
      message: errorMessage,
      error: error.message,
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
  }
};

/**
 * @desc    Update quote status
 * @route   PATCH /api/quotes/:id/status
 * @access  Private/Admin
 */
export const updateQuoteStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['pending', 'approved', 'confirmed', 'rejected', 'completed'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value. Must be one of: pending, approved, confirmed, rejected, completed'
      });
    }

    const quote = await Quote.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    );

    if (!quote) {
      return res.status(404).json({
        success: false,
        message: 'Quote not found'
      });
    }

    // Send notification to customer when confirmed/approved and create customer record
    try {
      const s = String(status).toLowerCase();
      if (s === 'confirmed' || s === 'approved') {
        await sendQuoteStatusUpdateEmail(quote);
        await createCustomerFromQuote(quote);
        if (isNotifyAdmins()) {
          await sendAdminApprovalEmail(quote);
        }
      }
    } catch (notifyErr) {
      console.error('Failed sending status update email or creating customer:', notifyErr);
    }

    res.status(200).json({
      success: true,
      data: quote
    });
  } catch (error) {
    console.error('Error updating quote status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update quote status',
      error: error.message
    });
  }
};

/**
 * @desc    Update quote payment status
 * @route   PATCH /api/quotes/:id/payment-status
 * @access  Private/Admin
 */
export const updateQuotePaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentStatus } = req.body;

    if (!['pending', 'paid', 'failed'].includes(paymentStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment status. Must be one of: pending, paid, failed'
      });
    }

    const quote = await Quote.findByIdAndUpdate(
      id,
      { paymentStatus },
      { new: true, runValidators: true }
    );

    if (!quote) {
      return res.status(404).json({
        success: false,
        message: 'Quote not found'
      });
    }

    res.status(200).json({
      success: true,
      data: quote
    });
  } catch (error) {
    console.error('Error updating payment status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update payment status',
      error: error.message
    });
  }
};

/**
 * @desc    Delete a quote
 * @route   DELETE /api/quotes/:id
 * @access  Private/Admin
 */
export const deleteQuote = async (req, res) => {
  try {
    const { id } = req.params;
    
    const quote = await Quote.findByIdAndDelete(id);
    
    if (!quote) {
      return res.status(404).json({
        success: false,
        message: 'Quote not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error('Error deleting quote:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete quote',
      error: error.message
    });
  }
};

/**
 * @desc    Get all quotes with filtering and pagination
 * @route   GET /api/quotes
 * @access  Private/Admin
 */
export const getQuotes = async (req, res) => {
  try {
    // Extract query parameters
    const { 
      status, 
      paymentStatus, 
      startDate, 
      endDate, 
      sortBy = 'createdAt', 
      sortOrder = 'desc',
      page = 1,
      limit = 10,
      search
    } = req.query;

    // Build query
    const query = {};

    // Filter by status
    if (status) {
      query.status = status;
    }

    // Filter by payment status
    if (paymentStatus) {
      query.paymentStatus = paymentStatus;
    }

    // Filter by date range
    if (startDate || endDate) {
      query.eventDate = {};
      if (startDate) {
        query.eventDate.$gte = new Date(startDate);
      }
      if (endDate) {
        query.eventDate.$lte = new Date(endDate);
      }
    }

    // Search by customer name, email, or phone
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { customerName: searchRegex },
        { email: searchRegex },
        { phone: searchRegex }
      ];
    }

    // Calculate skip for pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query with pagination and sorting
    const [quotes, total] = await Promise.all([
      Quote.find(query)
        .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Quote.countDocuments(query)
    ]);

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      success: true,
      count: quotes.length,
      total,
      totalPages,
      currentPage: parseInt(page),
      data: quotes
    });
  } catch (error) {
    console.error('Error fetching quotes:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch quotes',
      error: error.message
    });
  }
};

/**
 * @desc    Get a single quote by ID
 * @route   GET /api/quotes/:id
 * @access  Private/Admin
 */
export const getQuoteById = async (req, res) => {
  try {
    const quote = await Quote.findById(req.params.id).lean();
    
    if (!quote) {
      return res.status(404).json({
        success: false,
        message: 'Quote not found'
      });
    }

    res.status(200).json({
      success: true,
      data: quote
    });
  } catch (error) {
    console.error('Error fetching quote:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch quote',
      error: error.message
    });
  }
};
