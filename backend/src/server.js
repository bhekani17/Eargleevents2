// Core Node.js modules
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Third-party dependencies
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';

// Application imports
import { connectDB } from './config/db.js';
import { verifyEmailConfig } from './config/email.js';
import Customer from './models/customer.js';

// Route imports
import adminRoutes from './routes/adminRoutes.js';
import contactRoutes from './routes/contactRoutes.js';
import customerRoutes from './routes/customerRoutes.js';
import equipmentRoutes from './routes/equipmentRoutes.js';
import packagesRoutes from './routes/packagesRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import quoteRoutes from './routes/quoteRoutes.js';
import servicesRoutes from './routes/servicesRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';

// Configure dotenv
dotenv.config();

/**
 * Express application setup
 * @type {import('express').Application}
 */
const app = express();
const PORT = process.env.PORT || 5000;

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Constants
const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const THIRTY_DAYS_MS = 30 * ONE_DAY_MS;
const STARTUP_DELAY_MS = 10_000;

/**
 * Initialize database connection and start scheduled tasks
 */
async function initializeApp() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await connectDB();
    console.log('✅ MongoDB connected successfully');
    
    // Start cleanup job after a delay
    setTimeout(() => {
      cleanupOldQuotations();
      setInterval(cleanupOldQuotations, ONE_DAY_MS);
    }, STARTUP_DELAY_MS);
    
    return true;
  } catch (error) {
    console.error('❌ Failed to initialize application:', error);
    process.exit(1);
  }
}

/**
 * Clean up old quotations that were never approved
 * @returns {Promise<void>}
 */
async function cleanupOldQuotations() {
  try {
    const cutoff = new Date(Date.now() - THIRTY_DAYS_MS);
    const result = await Customer.deleteMany({
      status: 'quotation',
      createdAt: { $lt: cutoff }
    });
    
    if (result?.deletedCount) {
      console.log(`🧹 Cleaned up ${result.deletedCount} old quotations`);
    }
  } catch (error) {
    console.error('Failed to clean up old quotations:', error);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection at:', reason.stack || reason);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Initialize the application
initializeApp();

// Configure CORS
const isDevelopment = process.env.NODE_ENV !== 'production';
const allowedOrigins = isDevelopment
  ? ['http://localhost:3000', 'http://127.0.0.1:3000']
  : (process.env.ALLOWED_ORIGINS?.split(',').map(origin => origin.trim()).filter(Boolean) || []);

const corsOptions = {
  origin: (origin, callback) => {
    if (isDevelopment || !origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    callback(new Error(`CORS: Origin ${origin} not allowed`));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['Content-Range', 'X-Total-Count'],
  credentials: true,
  maxAge: 600,
  optionsSuccessStatus: 204
};

// Apply middleware
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const { method, originalUrl, ip } = req;
  
  res.on('finish', () => {
    const { statusCode } = res;
    const responseTime = Date.now() - start;
    
    console.log(`[${new Date().toISOString()}] ${method} ${originalUrl} ${statusCode} - ${responseTime}ms - ${ip}`);
  });
  
  next();
});

// Health check endpoints
const healthRouter = express.Router();

healthRouter.get('/', (_, res) => {
  res.json({
    status: 'ok',
    message: 'API is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

healthRouter.get('/email', async (_, res) => {
  try {
    const ok = await verifyEmailConfig();
    res.status(ok ? 200 : 500).json({
      success: ok,
      status: ok ? 'ok' : 'error',
      message: ok ? 'Email configuration verified' : 'Email configuration verification failed'
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      status: 'error',
      message: 'Email configuration verification error',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// Configure uploads directory
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// API Router
const apiRouter = express.Router();

// Mount routes
apiRouter.use('/health', healthRouter);
apiRouter.use('/packages', packagesRoutes);
apiRouter.use('/equipment', equipmentRoutes);
apiRouter.use('/services', servicesRoutes);
apiRouter.use('/admin', adminRoutes);
apiRouter.use('/admin/customers', customerRoutes);
apiRouter.use('/upload', uploadRoutes);
apiRouter.use('/quotes', quoteRoutes);
apiRouter.use('/payments', paymentRoutes);
apiRouter.use('/contact', contactRoutes);

// Mount API router
app.use('/api', apiRouter);

// Serve static uploads
app.use('/uploads', express.static(uploadsDir));

// Serve frontend in production
if (process.env.NODE_ENV === 'production') {
  const frontendPath = path.join(__dirname, '../../frontend/build');
  app.use(express.static(frontendPath));
  app.get('*', (_, res) => res.sendFile(path.join(frontendPath, 'index.html')));
}

// 404 Handler
app.use((_, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'The requested resource was not found'
    }
  });
});

// Global error handler
app.use((err, req, res, _) => {
  const errorId = `err_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  const timestamp = new Date().toISOString();
  
  // Log the error
  console.error(`[${timestamp}] [${errorId}] ${err.stack || err}`);
  
  // Send error response
  res.status(err.statusCode || 500).json({
    success: false,
    error: {
      id: errorId,
      code: err.code || 'INTERNAL_SERVER_ERROR',
      message: err.message || 'An unexpected error occurred',
      ...(process.env.NODE_ENV === 'development' && {
        stack: err.stack,
        details: err.details
      })
    }
  });
});
// Start the server
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running in ${process.env.NODE_ENV || 'development'} mode`);
  console.log(`🔗 http://localhost:${PORT}`);
  console.log(`📅 ${new Date().toISOString()}`);
});

// Handle graceful shutdown
const shutdown = (signal) => {
  console.log(`\n${signal} received: closing HTTP server`);
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
  
  // Force close after 5 seconds
  setTimeout(() => {
    console.error('Forcing shutdown...');
    process.exit(1);
  }, 5000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
