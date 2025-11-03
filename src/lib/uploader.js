const path = require('path');
const fs = require('fs');
const multer = require('multer');
const sharp = require('sharp');
const config = require('../config');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    fs.mkdirSync(config.uploadsDir, { recursive: true });
    cb(null, config.uploadsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const name = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, name);
  }
});

const allowedExtensions = new Set(['.jpg', '.jpeg', '.png', '.webp']);

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (!allowedExtensions.has(ext)) {
    return cb(new Error('Unsupported file type'));
  }
  return cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: config.maxUploadBytes }
});

async function processImage(filePath) {
  const targetPath = `${filePath.split('.').slice(0, -1).join('.')}.webp`;
  await sharp(filePath)
    .resize({ width: 2000, withoutEnlargement: true })
    .webp({ quality: 85 })
    .toFile(targetPath);
  await fs.promises.unlink(filePath);
  const relative = path
    .relative(path.join(__dirname, '..', '..'), targetPath)
    .replace(/\\/g, '/');
  return `/${relative}`;
}

module.exports = {
  upload,
  processImage
};
