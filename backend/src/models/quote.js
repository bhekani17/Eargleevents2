import mongoose from 'mongoose';

const itemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  total: {
    type: Number,
    required: true,
    min: 0
  }
});

const paymentSchema = new mongoose.Schema({
  method: {
    type: String,
    enum: ['cash', 'eft'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'ZAR'
  },
  reference: String,
  transactionId: String,
  receiptUrl: String,
  paidAt: Date
}, { _id: false });

const quoteSchema = new mongoose.Schema({
  customerName: {
    type: String,
    required: [true, 'Customer name is required'],
    trim: true,
    maxlength: [100, 'Name cannot be more than 100 characters']
  },
  company: {
    type: String,
    trim: true,
    maxlength: [150, 'Company name cannot be more than 150 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address']
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true
  },
  eventDate: {
    type: Date,
    required: [true, 'Event date is required'],
    validate: {
      validator: function(value) {
        return value > new Date();
      },
      message: 'Event date must be in the future'
    }
  },
  eventType: {
    type: String,
    required: [true, 'Event type is required'],
    trim: true,
    enum: {
      values: ['wedding', 'corporate', 'festival', 'private', 'other'],
      message: 'Please select a valid event type'
    },
    default: 'other'
  },
  eventTypeOther: {
    type: String,
    trim: true,
    maxlength: [100, 'Other event type cannot be more than 100 characters']
  },
  services: [{
    type: String,
    trim: true
  }],
  guestCount: {
    type: Number,
    min: [1, 'Guest count must be at least 1'],
    default: 1
  },
  location: {
    type: String,
    required: [true, 'Location is required'],
    trim: true
  },
  items: [itemSchema],
  totalAmount: {
    type: Number,
    required: [true, 'Total amount is required'],
    min: [0, 'Total amount cannot be negative']
  },
  status: {
    type: String,
    enum: {
      values: ['pending', 'approved', 'rejected', 'completed'],
      message: 'Status is either: pending, approved, rejected, or completed'
    },
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: {
      values: ['cash', 'eft'],
      message: 'Payment method must be one of: cash or eft'
    },
    required: [true, 'Payment method is required']
  },
  paymentStatus: {
    type: String,
    enum: {
      values: ['pending', 'paid', 'failed', 'refunded', 'partially_paid'],
      message: 'Payment status is invalid'
    },
    default: 'pending'
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Notes cannot be more than 1000 characters']
  },
  reference: {
    type: String,
    unique: true,
    index: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Normalize eventType before enum validation
quoteSchema.pre('validate', function(next) {
  if (this.eventType) {
    const raw = String(this.eventType).toLowerCase().trim();
    const map = new Map([
      ['wedding', 'wedding'],
      ['corporate', 'corporate'],
      ['business', 'corporate'],
      ['office', 'corporate'],
      ['festival', 'festival'],
      ['concert', 'festival'],
      ['show', 'festival'],
      ['private', 'private'],
      ['party', 'private'],
      ['birthday', 'private'],
      ['other', 'other']
    ]);
    this.eventType = map.get(raw) || 'other';
  } else {
    this.eventType = 'other';
  }
  next();
});

// Calculate total amount before saving
quoteSchema.pre('save', function(next) {
  if (this.isModified('items')) {
    this.totalAmount = this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }
  // Generate a human-friendly reference if missing, e.g., QTE-20250812-3F7A2
  if (!this.reference) {
    const pad = (n) => String(n).padStart(2, '0');
    const d = new Date();
    const y = d.getFullYear();
    const m = pad(d.getMonth() + 1);
    const day = pad(d.getDate());
    const rand = Math.random().toString(36).substring(2, 7).toUpperCase();
    this.reference = `QTE-${y}${m}${day}-${rand}`;
  }
  this.updatedAt = Date.now();
  next();
});

export default mongoose.model('Quote', quoteSchema);
