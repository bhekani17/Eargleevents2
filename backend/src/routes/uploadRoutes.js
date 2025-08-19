import express from 'express';
import path from 'path';
import fs from 'fs';
import cors from 'cors';
import mongoose from 'mongoose';
import { uploadFile } from '../controllers/uploadController.js';

const router = express.Router();

// Enable CORS for all routes
router.use(cors({
  origin: true, // Reflect the request origin
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Total-Count']
}));

// Handle preflight requests
router.options('*', cors());

// Log all requests to this router
router.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  console.log('Content-Type:', req.get('Content-Type'));
  console.log('Origin:', req.get('Origin'));
  next();
});

// Test route to check if API is accessible
router.get('/test', (req, res) => {
  res.json({ 
    status: 'upload test route working',
    timestamp: new Date().toISOString(),
    headers: req.headers
  });
});

// File upload route
router.post('/', (req, res, next) => {
  console.log('Upload request received. Headers:', JSON.stringify(req.headers, null, 2));
  uploadFile(req, res, next);
});

// Stream a file from MongoDB GridFS by ID
router.get('/files/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid file id' });
    }

    const conn = mongoose.connection;
    if (conn.readyState !== 1) {
      return res.status(503).json({ success: false, message: 'Database not connected' });
    }

    const bucket = new mongoose.mongo.GridFSBucket(conn.db, { bucketName: 'uploads' });

    // Try to find the file first to get metadata/contentType
    const files = await conn.db.collection('uploads.files').find({ _id: new mongoose.Types.ObjectId(id) }).toArray();
    if (!files || files.length === 0) {
      return res.status(404).json({ success: false, message: 'File not found' });
    }
    const file = files[0];

    // Set headers
    if (file.contentType) {
      res.set('Content-Type', file.contentType);
    } else if (file.metadata?.mimetype) {
      res.set('Content-Type', file.metadata.mimetype);
    } else {
      res.set('Content-Type', 'application/octet-stream');
    }
    res.set('Cache-Control', 'public, max-age=31536000, immutable');
    res.set('Content-Disposition', `inline; filename="${file.filename || 'file'}"`);

    const downloadStream = bucket.openDownloadStream(new mongoose.Types.ObjectId(id));
    downloadStream.on('error', (err) => {
      console.error('GridFS download error:', err);
      if (!res.headersSent) {
        res.status(500).json({ success: false, message: 'Error streaming file' });
      } else {
        res.end();
      }
    });
    downloadStream.pipe(res);
  } catch (error) {
    console.error('GET /files/:id error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Test route to check if uploads directory is writable
router.get('/disk-test', (req, res) => {
  const testDir = path.join(process.cwd(), 'uploads');
  const testFilePath = path.join(testDir, 'test.txt');
  
  // Ensure directory exists
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true });
  }
  
  fs.writeFile(testFilePath, 'test', (err) => {
    if (err) {
      console.error('Write test failed:', err);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to write test file',
        error: err.message,
        path: testFilePath,
        cwd: process.cwd(),
        dirExists: fs.existsSync(testDir)
      });
    }
    
    // Test reading the file
    fs.readFile(testFilePath, 'utf8', (readErr, data) => {
      if (readErr) {
        console.error('Read test failed:', readErr);
        return res.status(500).json({
          success: false,
          message: 'Failed to read test file',
          error: readErr.message
        });
      }
      
      // Clean up
      fs.unlink(testFilePath, (unlinkErr) => {
        if (unlinkErr) {
          console.error('Failed to clean up test file:', unlinkErr);
        }
        
        res.json({
          success: true,
          message: 'Disk test successful',
          fileContent: data,
          path: testFilePath,
          cwd: process.cwd()
        });
      });
    });
  });
});

export default router;
