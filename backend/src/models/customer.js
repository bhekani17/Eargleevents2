import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Customer name is required'],
    trim: true,
    maxlength: [100, 'Name cannot be more than 100 characters']
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
    trim: true,
    index: true
  },
  address: {
    type: String,
    trim: true,
    maxlength: [200, 'Address cannot be more than 200 characters']
  },
  company: {
    type: String,
    trim: true,
    maxlength: [100, 'Company cannot be more than 100 characters']
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Notes cannot be more than 1000 characters']
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'pending', 'quotation', 'confirmed', 'booked'],
    default: 'active',
    index: true
  },
  bookingDate: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

customerSchema.index({ email: 1 }, { unique: true, sparse: true });
// Index to accelerate scheduled cleanup of old quotations
customerSchema.index({ status: 1, createdAt: 1 });

export default mongoose.model('Customer', customerSchema);
