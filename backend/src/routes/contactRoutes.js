import express from 'express';
import { sendEmail } from '../utils/emailService.js';
import ContactMessage from '../models/contactMessage.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// POST /api/contact
router.post('/', async (req, res) => {
  try {
    const { name, email, phone, message } = req.body || {};

    // Basic validation
    const errors = {};
    if (!name || String(name).trim().length < 2) errors.name = 'Name is required';
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) errors.email = 'Valid email is required';
    if (!message || String(message).trim().length < 10) errors.message = 'Message must be at least 10 characters';

    if (Object.keys(errors).length) {
      return res.status(400).json({ success: false, errors });
    }

    // Persist to DB first
    const meta = {
      ip: req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '',
      userAgent: req.headers['user-agent'],
      referrer: req.headers['referer'] || req.headers['referrer'],
    };
    const saved = await ContactMessage.create({ name, email, phone, message, meta });

    const subject = `New Website Message from ${name}`;
    const html = `
      <h2>New Contact Form Submission</h2>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Phone:</strong> ${phone || 'N/A'}</p>
      <p><strong>Message:</strong></p>
      <p style="white-space:pre-wrap">${message}</p>
      <hr/>
      <p>Sent at: ${new Date().toISOString()}</p>
      <p><strong>Message ID:</strong> ${saved._id}</p>
    `;

    // Attempt to email notification if configured (non-blocking for DB persistence)
    const to = process.env.CONTACT_TO || process.env.EMAIL_TO || process.env.EMAIL_USER;
    if (to) {
      try {
        await sendEmail({ to, subject, html, text: `From: ${name} <${email}>\nPhone: ${phone || 'N/A'}\n\n${message}` });
      } catch (emailErr) {
        console.warn('Email notification failed, but message stored:', emailErr?.message || emailErr);
      }
    } else {
      console.warn('No CONTACT_TO/EMAIL_TO configured; message stored without email notification');
    }

    return res.status(200).json({ success: true, message: 'Message saved successfully', id: saved._id });
  } catch (err) {
    console.error('Contact route error:', err);
    // Handle Mongoose validation errors explicitly
    if (err?.name === 'ValidationError') {
      const errors = Object.fromEntries(
        Object.entries(err.errors || {}).map(([k, v]) => [k, v.message])
      );
      return res.status(400).json({ success: false, message: 'Validation failed', errors });
    }
    return res.status(500).json({ success: false, message: 'Failed to save message' });
  }
});

// Admin-protected routes below
router.use(protect);

// GET /api/contact - List messages with pagination, optional filters
router.get('/', async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 100);
    const skip = (page - 1) * limit;

    const { status, q } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (q) {
      const regex = new RegExp(String(q).trim(), 'i');
      filter.$or = [
        { name: regex },
        { email: regex },
        { phone: regex },
        { message: regex },
      ];
    }

    const [items, total] = await Promise.all([
      ContactMessage.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      ContactMessage.countDocuments(filter),
    ]);

    return res.json({
      success: true,
      page,
      limit,
      total,
      pages: Math.ceil(total / limit) || 1,
      items,
    });
  } catch (err) {
    console.error('List contact messages error:', err);
    return res.status(500).json({ success: false, message: 'Failed to list messages' });
  }
});

// GET /api/contact/:id - Get single message
router.get('/:id', async (req, res) => {
  try {
    const item = await ContactMessage.findById(req.params.id).lean();
    if (!item) return res.status(404).json({ success: false, message: 'Message not found' });
    return res.json({ success: true, item });
  } catch (err) {
    console.error('Get contact message error:', err);
    return res.status(500).json({ success: false, message: 'Failed to get message' });
  }
});

// PATCH /api/contact/:id - Update message (e.g., status)
router.patch('/:id', async (req, res) => {
  try {
    const updates = {};
    if (req.body.status) updates.status = req.body.status;

    const item = await ContactMessage.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    ).lean();

    if (!item) return res.status(404).json({ success: false, message: 'Message not found' });
    return res.json({ success: true, item });
  } catch (err) {
    console.error('Update contact message error:', err);
    if (err?.name === 'ValidationError') {
      const errors = Object.fromEntries(
        Object.entries(err.errors || {}).map(([k, v]) => [k, v.message])
      );
      return res.status(400).json({ success: false, message: 'Validation failed', errors });
    }
    return res.status(500).json({ success: false, message: 'Failed to update message' });
  }
});

// DELETE /api/contact/:id - Delete message
router.delete('/:id', async (req, res) => {
  try {
    const item = await ContactMessage.findByIdAndDelete(req.params.id).lean();
    if (!item) return res.status(404).json({ success: false, message: 'Message not found' });
    return res.json({ success: true, message: 'Message deleted' });
  } catch (err) {
    console.error('Delete contact message error:', err);
    return res.status(500).json({ success: false, message: 'Failed to delete message' });
  }
});

export default router;
