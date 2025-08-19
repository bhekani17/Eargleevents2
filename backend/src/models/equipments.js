import mongoose from "mongoose";

const equipmentSchema = new mongoose.Schema({
  // Required Fields
  name: {
    type: String,
    required: [true, 'Equipment name is required'],
    trim: true,
    maxlength: [100, 'Name cannot be more than 100 characters']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: {
      values: [
        'Mobile Toilets', 
        'Mobile Freezers', 
        'Tents & Marquees', 
        'Slaughtering Services'
      ],
      message: 'Please select a valid category'
    }
  },
  pricePerDay: {
    type: Number,
    required: [true, 'Price per day is required'],
    min: [0, 'Price cannot be negative']
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [0, 'Quantity cannot be negative'],
    default: 1
  },
  // Optional text description
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot be more than 1000 characters']
  },
  
  // Equipment Details
  condition: {
    type: String,
    enum: {
      values: ['New', 'Good', 'Fair'],
      message: 'Please select a valid condition'
    },
    default: 'Good'
  },
  isPopular: {
    type: Boolean,
    default: false
  },
  availability: {
    type: Boolean,
    default: true
  },
  
  // Specifications
  specifications: {
    size: {
      type: String,
      trim: true,
      maxlength: [50, 'Size cannot be more than 50 characters']
    },
    capacity: {
      type: String,
      trim: true,
      maxlength: [100, 'Capacity cannot be more than 100 characters']
    },
    powerRequirements: {
      type: String,
      trim: true,
      maxlength: [100, 'Power requirements cannot be more than 100 characters']
    },
    setup: {
      type: String,
      trim: true,
      maxlength: [200, 'Setup information cannot be more than 200 characters']
    }
  },
  
  // Features
  features: [{
    type: String,
    trim: true,
    maxlength: [100, 'Feature cannot be more than 100 characters']
  }],
  
  // Images
  images: [{
    url: {
      type: String,
      trim: true
    },
    alt: {
      type: String,
      trim: true,
      maxlength: [100, 'Alt text cannot be more than 100 characters']
    }
  }]
}, { timestamps: true });

const Equipment = mongoose.model('Equipment', equipmentSchema);
export default Equipment;