const path = require('path');
const fs = require('fs');
const multer = require('multer');
const sharp = require('sharp');
const config = require('../config');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = config.uploadsDir;
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const name = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, name);
  }
});

const fileFilter = (req, file, cb) => {
  const allowed = ['.jpg', '.jpeg', '.png', '.webp'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (!allowed.includes(ext)) {
    return cb(new Error('Unsupported file type'));
  }
  cb(null, true);
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 10 * 1024 * 1024 } });

async function processImage(filePath) {
  const output = `${filePath.split('.').slice(0, -1).join('.')}.webp`;
  await sharp(filePath).resize({ width: 2000, withoutEnlargement: true }).webp({ quality: 85 }).toFile(output);
  await fs.promises.unlink(filePath);
  const relative = path.relative(path.join(__dirname, '..', '..'), output).replace(/\\/g, '/');
  return `/${relative}`;
}

module.exports = {
  upload,
  processImage
};
