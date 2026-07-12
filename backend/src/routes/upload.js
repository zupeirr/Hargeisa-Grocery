const { Router } = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const prisma = require('../lib/prisma');

const router = Router();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `img-${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (jpg, png, webp, gif, avif)'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB per file
});

// POST /api/upload  — accepts up to 10 images at once
router.post('/', upload.array('images', 10), (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: 'No files uploaded' });
  }

  const baseUrl = process.env.BASE_URL || 'https://hargeisa-grocery-2.onrender.com';
  
  const urls = req.files.map((f) => `${baseUrl}/uploads/${f.filename}`);
  res.json({ urls });
});

// POST /api/upload/migrate-image-urls
// One-shot migration: rewrites any stored http:// image URLs to https://.
// Safe to run multiple times (idempotent — skips rows that already use https).
router.post('/migrate-image-urls', async (req, res) => {
  const OLD = 'http://hargeisa-grocery-2.onrender.com';
  const NEW = 'https://hargeisa-grocery-2.onrender.com';
  const fix = (url) => (typeof url === 'string' ? url.replace(OLD, NEW) : url);

  let productUpdated = 0;
  let productSkipped = 0;
  let categoryUpdated = 0;
  let categorySkipped = 0;

  try {
    // ── Products ──────────────────────────────────────────────────────────────
    const products = await prisma.product.findMany({
      select: { id: true, image: true, images: true },
    });

    for (const p of products) {
      const updateData = {};

      // Single `image` field
      if (p.image && p.image.startsWith(OLD)) {
        updateData.image = fix(p.image);
      }

      // JSON-encoded `images` array
      if (p.images) {
        try {
          const arr = JSON.parse(p.images);
          if (Array.isArray(arr) && arr.some((u) => typeof u === 'string' && u.startsWith(OLD))) {
            updateData.images = JSON.stringify(arr.map(fix));
          }
        } catch (_) {
          // malformed JSON — skip silently
        }
      }

      if (Object.keys(updateData).length > 0) {
        await prisma.product.update({ where: { id: p.id }, data: updateData });
        productUpdated++;
      } else {
        productSkipped++;
      }
    }

    // ── Categories ────────────────────────────────────────────────────────────
    const categories = await prisma.category.findMany({
      select: { id: true, image: true },
    });

    for (const c of categories) {
      if (c.image && c.image.startsWith(OLD)) {
        await prisma.category.update({
          where: { id: c.id },
          data: { image: fix(c.image) },
        });
        categoryUpdated++;
      } else {
        categorySkipped++;
      }
    }

    res.json({
      success: true,
      message: 'Image URL migration complete',
      products: { updated: productUpdated, skipped: productSkipped },
      categories: { updated: categoryUpdated, skipped: categorySkipped },
    });
  } catch (err) {
    console.error('[migrate-image-urls]', err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/upload — removes a file by filename
router.delete('/', (req, res) => {
  const { filename } = req.body;
  if (!filename) return res.status(400).json({ error: 'Filename required' });

  // Security: only allow simple filenames (no path traversal)
  const safeFilename = path.basename(filename);
  const filePath = path.join(uploadsDir, safeFilename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found' });
  }

  fs.unlink(filePath, (err) => {
    if (err) return res.status(500).json({ error: 'Failed to delete file' });
    res.json({ success: true });
  });
});

// Error handler for multer
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: err.message });
  }
  if (err) {
    return res.status(400).json({ error: err.message });
  }
  next();
});

module.exports = router;
