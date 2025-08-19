import mongoose from "mongoose";

const serviceSchema = new mongoose.Schema({
    name: {
      type: String,
      required: true,
      trim: true
    },
    category: {
      type: String,
      required: true,
      enum: ['All Services', 'Weddings & Funerals', 'Family Events & Birthdays', 'Slaughtering Services', 'Corporate Functions']
    },
    price: {
      type: Number,
      required: true
    },
    priceUnit: {
      type: String,
      default: 'service' // or 'per person', 'per hour', 'per day'
    },
    images: [{
      url: String,
      alt: String
    }],
    features: [String], // e.g., ["Professional Staff", "Full Setup", "Clean-up Service"]
    includedServices: [{
      serviceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Service'
      },
      serviceName: String,
      quantity: Number
    }],
    includedEquipment: [{
      equipmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Equipment'
      },
      equipmentName: String,
      quantity: Number
    }],
    specifications: {
      maxGuests: Number,
      duration: String, // e.g., "Full Day", "8 hours"
      setupTime: String,
      coverage: String // e.g., "Indoor/Outdoor"
    },
    availability: {
      type: Boolean,
      default: true
    },
    isPopular: {
      type: Boolean,
      default: false
    },
    isFeatured: {
      type: Boolean,
      default: false
    }
  }, { timestamps: true });

const Service = mongoose.model('Service', serviceSchema);
export default Service;