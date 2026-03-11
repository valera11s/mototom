import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadsDir = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const allowedExt = new Set(['.jpeg', '.jpg', '.png', '.gif', '.webp']);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const originalExt = path.extname(file.originalname || '').toLowerCase();
    const safeExt = allowedExt.has(originalExt) ? originalExt : '.jpg';

    const baseName = path.basename(file.originalname || 'image', originalExt);
    const safeBaseName = String(baseName)
      .replace(/[^a-zA-Z0-9а-яА-ЯёЁ._-]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80) || 'image';

    cb(null, `${safeBaseName}-${uniqueSuffix}${safeExt}`);
  },
});

const fileFilter = (_req, file, cb) => {
  const extname = path.extname(file.originalname || '').toLowerCase();
  const mime = String(file.mimetype || '').toLowerCase();
  const mimeAllowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(mime);
  const extAllowed = allowedExt.has(extname);

  if (mimeAllowed && extAllowed) {
    cb(null, true);
    return;
  }

  cb(new Error('Разрешены только изображения (jpeg, jpg, png, gif, webp)'));
};

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter,
});

router.post('/image', upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Файл не загружен' });
    }

    const filePath = `/uploads/${req.file.filename}`;
    return res.json({
      success: true,
      filePath,
      filename: req.file.filename,
      originalName: req.file.originalname,
    });
  } catch (error) {
    console.error('Ошибка загрузки файла:', error);
    return res.status(500).json({ error: 'Ошибка загрузки файла' });
  }
});

router.post('/images', upload.array('images', 10), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'Файлы не загружены' });
    }

    const filePaths = req.files.map((file) => `/uploads/${file.filename}`);
    return res.json({
      success: true,
      filePaths,
      files: req.files.map((file) => ({
        filename: file.filename,
        originalName: file.originalname,
        path: `/uploads/${file.filename}`,
      })),
    });
  } catch (error) {
    console.error('Ошибка загрузки файлов:', error);
    return res.status(500).json({ error: 'Ошибка загрузки файлов' });
  }
});

export default router;
