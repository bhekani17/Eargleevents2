import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { MongoMemoryServer } from 'mongodb-memory-server';

dotenv.config();

// Enable debug mode for development
if (process.env.NODE_ENV === 'development') {
  mongoose.set('debug', true);
}

let mongoServer;

// For testing or development with in-memory database
export const connectDB = async () => {
  try {
    let mongoUri = process.env.MONGO_URI;
    
    if (!mongoUri) {
      console.warn('MONGO_URI is not set in environment variables');
    }
    
    // Force cloud-only MongoDB Atlas connection
    if (!mongoUri) {
      throw new Error('MONGO_URI is required for cloud database connection');
    }
    
    console.log('🌐 Using MongoDB Atlas cloud database only');
    console.log('Connection string:', mongoUri.replace(/\/.*@/, '//***:***@'));
    
    const options = {
      // Note: useNewUrlParser and useUnifiedTopology are default in modern Mongoose
      serverSelectionTimeoutMS: 10000, // 10 seconds timeout for server selection
      socketTimeoutMS: 45000, // 45 seconds socket timeout
      connectTimeoutMS: 10000, // 10 seconds connection timeout
      retryWrites: true,
      w: 'majority',
      retryReads: true,
      maxPoolSize: 10, // Maximum number of connections in the connection pool
      minPoolSize: 1  // Minimum number of connections in the connection pool
      // Removed unsupported option: serverSelectionTryOnce
    };

    console.log('Attempting to connect to MongoDB...');
    
    try {
      const conn = await mongoose.connect(mongoUri, options);
      console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
      console.log(`📊 Database Name: ${conn.connection.name}`);
      console.log(`🌐 Connection Ready State: ${conn.connection.readyState === 1 ? 'Connected' : 'Disconnected'}`);
      
      // Test the connection with a ping
      await conn.connection.db.admin().ping();
      console.log('✅ MongoDB server is responsive');
      
      return conn;
    } catch (connectError) {
      console.error('❌ MongoDB connection error:', connectError);
      
      // More detailed error handling
      if (connectError.name === 'MongooseServerSelectionError') {
        console.error('Could not connect to any servers in your MongoDB Atlas cluster');
        console.error('Please check your network connection and ensure your IP is whitelisted in Atlas');
      } else if (connectError.name === 'MongooseError') {
        console.error('General Mongoose error occurred');
      }
      
      throw new Error(`Failed to connect to MongoDB: ${connectError.message}`);
    }
    
    // Connection events
    mongoose.connection.on('connected', () => {
      console.log('✅ Mongoose connected to DB');
    });

    mongoose.connection.on('error', (err) => {
      console.error('Mongoose connection error:', err);
      if (err.name === 'MongoNetworkError') {
        console.error('Network error. Please check your internet connection and MongoDB server status.');
      } else if (err.name === 'MongooseServerSelectionError') {
        console.error('Server selection error. This could be due to:');
        console.error('1. Incorrect MongoDB connection string');
        console.error('2. IP not whitelisted in MongoDB Atlas');
        console.error('3. Network connectivity issues');
      }
    });

    mongoose.connection.on('disconnected', () => {
      console.log('Mongoose disconnected');
    });

    // Close the Mongoose connection when the Node process ends
    process.on('SIGINT', async () => {
      console.log('Closing MongoDB connection...');
      await mongoose.connection.close();
      if (mongoServer) {
        await mongoServer.stop();
        console.log('In-memory MongoDB stopped');
      }
      console.log('Mongoose connection closed through app termination');
      process.exit(0);
    });

    return conn;
  } catch (error) {
    console.error('Error connecting to MongoDB:', error.message);
    if (mongoServer) {
      await mongoServer.stop();
    }
    process.exit(1);
  }
};

// For testing
export const closeDatabase = async () => {
  if (mongoServer) {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongoServer.stop();
  }
};

export const clearDatabase = async () => {
  if (mongoServer) {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      const collection = collections[key];
      await collection.deleteMany({});
    }
  }
};
