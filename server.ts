import express from 'express';
import path from 'path';
import multer from 'multer';
import { createServer as createViteServer } from 'vite';
import { uploadToCloudinary } from './src/utils/cloudinary.js';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware for parsing JSON and URL-encoded data (support base64 uploads)
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Multer memory storage configuration for handling multipart file uploads
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 25 * 1024 * 1024 }, // 25MB file size limit
  });

  // Health check endpoint
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', service: 'Cloudinary Upload API' });
  });

  // Cloudinary File Upload Endpoint
  app.post('/api/upload', upload.single('file'), async (req, res) => {
    try {
      let fileInput: Buffer | string | undefined;

      if (req.file) {
        // Uploaded via multipart/form-data
        fileInput = req.file.buffer;
      } else if (req.body && req.body.file) {
        // Uploaded via JSON body (base64 string or image URL)
        fileInput = req.body.file;
      }

      if (!fileInput) {
        return res.status(400).json({
          success: false,
          error: 'No file provided. Please attach a file via form-data or send a base64/URL string in JSON body under key "file".',
        });
      }

      const folder = (req.body && req.body.folder) || 'website_uploads';
      const public_id = req.body && req.body.public_id;

      // Upload to Cloudinary using Node.js SDK
      const uploadedUrl = await uploadToCloudinary(fileInput, {
        folder,
        public_id,
      });

      return res.json({
        success: true,
        url: uploadedUrl,
        message: 'File uploaded successfully to Cloudinary',
      });
    } catch (error: any) {
      console.error('Cloudinary API upload error:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Failed to upload image to Cloudinary',
      });
    }
  });

  // Vite development middleware vs Static Production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
