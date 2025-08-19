import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Resolve __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Absolute path to uploads directory (one level up from src)
const uploadDir = path.resolve(__dirname, '../../uploads');

// Ensure uploads directory exists
function ensureUploadsDir() {
  try {
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true, mode: 0o777 });
      console.log(`Created uploads directory at: ${uploadDir}`);
    }
  } catch (err) {
    console.error('Failed to initialize uploads directory:', err);
  }
}
ensureUploadsDir();

// Helper to generate a filename
function uniqueFilename(originalName = 'file') {
  const ext = path.extname(originalName) || '.dat';
  const base = 'img-' + Date.now() + '-' + Math.round(Math.random() * 1e9);
  return `${base}${ext}`;
}

// Upload a file object and return a URL
// Accepts either:
// - Multer file: { originalname, buffer?, path?, mimetype }
// - Generic: { originalname, buffer }
export async function uploadFile(file) {
  try {
    if (!file) {
      return { url: '', filename: '', path: '' };
    }

    // If the file is already saved to disk (multer diskStorage), just build URL
    if (file.path && fs.existsSync(file.path)) {
      const filename = path.basename(file.path);
      const urlPath = `/uploads/${filename}`;
      return { url: urlPath, filename, path: file.path };
    }

    // Otherwise, persist buffer to our uploads directory
    if (file.buffer) {
      const filename = uniqueFilename(file.originalname);
      const absPath = path.join(uploadDir, filename);
      await fs.promises.writeFile(absPath, file.buffer);
      const urlPath = `/uploads/${filename}`;
      return { url: urlPath, filename, path: absPath };
    }

    // As a fallback, return empty result to avoid crashes
    return { url: '', filename: '', path: '' };
  } catch (err) {
    console.error('uploadFile error:', err);
    throw err;
  }
}

// Delete a previously uploaded file by URL or absolute path
export async function deleteFile(target) {
  try {
    if (!target) return;

    // If a URL like /uploads/filename, convert to absolute path
    let absPath = target;
    if (!path.isAbsolute(target)) {
      const filename = target.split('/').pop();
      absPath = path.join(uploadDir, filename);
    }

    if (fs.existsSync(absPath)) {
      await fs.promises.unlink(absPath);
      console.log('Deleted file:', absPath);
    }
  } catch (err) {
    // Log and swallow to avoid failing requests just because cleanup failed
    console.warn('deleteFile warning:', err?.message || err);
  }
}
