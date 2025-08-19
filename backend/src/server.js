import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import dotenv from 'dotenv';
import packagesRoutes from './routes/packagesRoutes.js';
import equipmentRoutes from './routes/equipmentRoutes.js';
import servicesRoutes from './routes/servicesRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import customerRoutes from './routes/customerRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import quoteRoutes from './routes/quoteRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import contactRoutes from './routes/contactRoutes.js';
import { connectDB } from './config/db.js';
import Customer from './models/customer.js';
import { verifyEmailConfig } from './config/email.js';

// Configure dotenv
dotenv.config();

// Create Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Connect to MongoDB
console.log('🔄 Connecting to MongoDB...');
connectDB().catch(err => {
  console.error('❌ Failed to connect to MongoDB:', err);
  process.exit(1); // Exit if we can't connect to the database
});

// Scheduled cleanup: delete quotations older than 30 days that were never approved
const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const THIRTY_DAYS_MS = 30 * ONE_DAY_MS;

async function cleanupOldQuotations() {
  try {
    const cutoff = new Date(Date.now() - THIRTY_DAYS_MS);
    const result = await Customer.deleteMany({
      status: 'quotation',
      createdAt: { $lt: cutoff }
    });
    if (result?.deletedCount) {
      console.log(`🧹 Cleanup: deleted ${result.deletedCount} old quotations (created before ${cutoff.toISOString()}).`);
    } else {
      console.log(`🧹 Cleanup: no old quotations to delete (cutoff ${cutoff.toISOString()}).`);
    }
  } catch (err) {
    console.error('🧹 Cleanup error:', err);
  }
}

// Run cleanup once on startup (after a small delay to ensure DB connection is ready), then every 24 hours
setTimeout(() => {
  cleanupOldQuotations();
  setInterval(cleanupOldQuotations, ONE_DAY_MS);
}, 10_000);

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err);
  // Close server & exit process
  server.close(() => process.exit(1));
});

// Enable CORS with specific options
const isDevelopment = process.env.NODE_ENV !== 'production';
const allowedOrigins = isDevelopment 
  ? [
      'http://localhost:3000',
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://localhost:5000', 
      'http://127.0.0.1:5000'
    ]
  : (process.env.ALLOWED_ORIGINS || '').split(',').map(origin => origin.trim()).filter(Boolean);

console.log('CORS allowed origins:', allowedOrigins);

const corsOptions = {
  origin: function (origin, callback) {
    // In development, allow all origins
    if (isDevelopment) {
      return callback(null, true);
    }
    
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      console.warn('No origin header in request');
      return callback(null, true);
    }
    
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = `The CORS policy for this site does not allow access from the specified origin: ${origin}`;
      console.warn(msg);
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['Content-Range', 'X-Total-Count'],
  credentials: true,
  maxAge: 600, // 10 minutes
  optionsSuccessStatus: 200 // Some legacy browsers choke on 204
};

// Add CORS pre-flight for all routes
app.options('*', cors(corsOptions));

// Log CORS errors
app.use((err, req, res, next) => {
  if (err) {
    console.error('CORS Error:', err.message);
    if (err.message.includes('CORS')) {
      return res.status(403).json({
        success: false,
        message: 'CORS Error: ' + err.message,
        allowedOrigins: allowedOrigins,
        requestOrigin: req.headers.origin
      });
    }
  }
  next(err);
});

// Apply middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'API is running',
    timestamp: new Date().toISOString()
  });
});

// Email configuration health check
app.get('/api/health/email', async (req, res) => {
  try {
    const ok = await verifyEmailConfig();
    return res.status(ok ? 200 : 500).json({
      success: ok,
      status: ok ? 'ok' : 'error',
      message: ok ? 'Email configuration verified' : 'Email configuration verification failed'
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      status: 'error',
      message: 'Email configuration verification error',
      error: err.message
    });
  }
});

// Serve static files from uploads directory
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));
console.log('Serving static files from:', uploadsDir);

// Mount routes with /api prefix
const apiRouter = express.Router();

// Log all API requests
apiRouter.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  console.log('  Headers:', req.headers);
  next();
});

// Mount routes under the API router
apiRouter.use('/packages', packagesRoutes);
apiRouter.use('/equipment', equipmentRoutes);
apiRouter.use('/services', servicesRoutes);
apiRouter.use('/admin', adminRoutes);
apiRouter.use('/admin/customers', customerRoutes);
apiRouter.use('/upload', uploadRoutes);
apiRouter.use('/quotes', quoteRoutes);
app.use('/api/payments', paymentRoutes);
apiRouter.use('/contact', contactRoutes);

// Test route
apiRouter.get('/test', (req, res) => {
  res.json({
    status: 'API is working',
    timestamp: new Date().toISOString(),
    node_env: process.env.NODE_ENV || 'development',
    upload_dir: uploadsDir
  });
});

// Mount all API routes under /api
app.use('/api', apiRouter);

console.log('API routes mounted at /api/*');
console.log('Available routes:');
console.log('  GET    /api/test');
console.log('  POST   /api/upload');
console.log('  GET    /api/upload/test');
console.log('  GET    /api/upload/disk-test');
console.log('  GET    /api/health');
console.log('  GET    /api/health/email');
console.log('  POST   /api/contact');

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../../frontend/build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../../frontend/build', 'index.html'));
  });
}

// 404 Handler
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Not Found - ${req.originalUrl}`
  });
});

// Global error handler
app.use((err, req, res, next) => {
  const timestamp = new Date().toISOString();
  const errorId = `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  console.error(`[${timestamp}] [${errorId}] Error:`, err.stack || err);
  console.error('Error details:', {
    method: req.method,
    url: req.originalUrl,
    headers: req.headers,
    body: req.body,
    params: req.params,
    query: req.query
  });
  
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  
  res.status(statusCode).json({
    success: false,
    error: {
      id: errorId,
      message,
      timestamp,
      ...(process.env.NODE_ENV === 'development' && { 
        stack: err.stack,
        details: err.details || {}
      })
    }
  });
});




app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});


