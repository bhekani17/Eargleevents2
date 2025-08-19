import multer from 'multer';
import path from 'path';
import mongoose from 'mongoose';
import { Readable } from 'stream';

// Configure multer to keep files in memory (no disk writes)
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  try {
    const filetypes = /jpe?g|png|webp/;
    const mimetypes = /^image\/(jpe?g|png|webp)$/i;
    
    const extname = path.extname(file.originalname).toLowerCase();
    const mimetype = file.mimetype;
    
    console.log('Checking file:', {
      originalname: file.originalname,
      extname,
      mimetype,
      size: file.size
    });

    if (filetypes.test(extname) && mimetypes.test(mimetype)) {
      return cb(null, true);
    } else {
      const error = new Error(`File type not allowed: ${file.originalname}. Only images (JPEG, PNG, WebP) are allowed.`);
      error.code = 'LIMIT_FILE_TYPE';
      return cb(error, false);
    }
  } catch (error) {
    console.error('Error in file filter:', error);
    return cb(error, false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { 
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 1,
    fields: 5
  }
}).single('image');

// Handle file upload to MongoDB GridFS
const uploadFile = async (req, res, next) => {
  console.log('Starting file upload...');
  console.log('Request headers:', JSON.stringify(req.headers, null, 2));
  console.log('Content-Type:', req.get('Content-Type'));
  
  upload(req, res, async (err) => {
    console.log('Upload callback triggered');
    console.log('Upload error:', err);
    console.log('Uploaded file:', req.file);
    console.log('Request body:', req.body);
    
    // Handle upload errors
    if (err) {
      console.error('Upload error details:', {
        message: err.message,
        code: err.code,
        stack: err.stack,
        name: err.name
      });
      
      let statusCode = 400;
      let message = 'Error uploading file';
      
      if (err.code === 'LIMIT_FILE_SIZE') {
        message = 'File too large. Maximum size is 5MB.';
        statusCode = 413;
      } else if (err.code === 'LIMIT_FILE_TYPE' || 
                err.message.includes('File type not allowed') || 
                err.message.includes('invalid file type')) {
        message = 'Invalid file type. Only images (JPEG, PNG, WebP) are allowed.';
        statusCode = 400;
      } else if (err.message) {
        message = err.message;
      }
      
      return res.status(statusCode).json({ 
        success: false, 
        message,
        code: err.code || 'UPLOAD_ERROR',
        details: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    }
    
    // Check if file was uploaded
    if (!req.file) {
      console.error('No file in request. Files:', req.files);
      return res.status(400).json({ 
        success: false, 
        message: 'No file was uploaded or file upload was aborted.',
        details: {
          files: req.files,
          body: req.body,
          headers: req.headers
        }
      });
    }
    
    try {
      // Ensure Mongo connection is ready
      const conn = mongoose.connection;
      if (conn.readyState !== 1) {
        throw new Error('Database not connected');
      }

      // Create GridFS bucket
      const bucket = new mongoose.mongo.GridFSBucket(conn.db, { bucketName: 'uploads' });

      // Prepare upload stream with metadata
      const filename = req.file.originalname || `img-${Date.now()}`;
      const contentType = req.file.mimetype || 'application/octet-stream';
      const metadata = { fieldname: req.file.fieldname, size: req.file.size };

      const uploadStream = bucket.openUploadStream(filename, { contentType, metadata });
      const id = uploadStream.id;

      // Stream buffer to GridFS
      const readable = Readable.from(req.file.buffer);
      readable.pipe(uploadStream)
        .on('error', (e) => {
          console.error('GridFS upload error:', e);
          return res.status(500).json({ success: false, message: 'Failed to store file', code: 'GRIDFS_UPLOAD_ERROR' });
        })
        .on('finish', () => {
          const protocol = req.secure ? 'https' : 'http';
          const host = req.get('host');
          const baseUrl = process.env.BASE_URL || `${protocol}://${host}`;
          const fileUrl = `${baseUrl}/api/upload/files/${id.toString()}`;

          console.log('File uploaded to GridFS:', {
            id: id.toString(),
            filename,
            size: req.file.size,
            mimetype: contentType,
            url: fileUrl
          });

          return res.status(200).json({
            success: true,
            message: 'File uploaded successfully',
            url: fileUrl,
            id: id.toString(),
            filename,
            originalname: req.file.originalname,
            size: req.file.size,
            mimetype: contentType
          });
        });
    } catch (error) {
      console.error('Error processing upload to GridFS:', {
        message: error.message,
        stack: error.stack,
        file: req.file
      });
      return res.status(500).json({
        success: false,
        message: 'Error processing file upload',
        error: error.message,
        code: 'PROCESSING_ERROR',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  });
};

export { uploadFile };
