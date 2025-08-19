import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Message from '../src/models/message.js';
import Quote from '../src/models/quote.js';
import Customer from '../src/models/customer.js';

dotenv.config();

const createIndexes = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    // Create indexes
    console.log('Creating indexes...');
    
    // Message model indexes
    await Message.createIndexes([
      { isRead: 1 },
      { createdAt: -1 },
      { email: 1 }
    ]);

    // Quote model indexes
    await Quote.createIndexes([
      { status: 1 },
      { customer: 1 },
      { createdAt: -1 }
    ]);

    // Customer model indexes
    await Customer.createIndexes([
      { email: 1 },
      { createdAt: -1 }
    ]);

    console.log('Indexes created successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error creating indexes:', error);
    process.exit(1);
  }
};

createIndexes();
