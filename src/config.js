const path = require('path');
require('dotenv').config();

const COMMISSION_RATE = parseFloat(process.env.COMMISSION_RATE || '0.25');

module.exports = {
  port: process.env.PORT || 3000,
  sessionSecret: process.env.SESSION_SECRET || 'zipsite-secret',
  databaseUrl: process.env.DATABASE_URL || 'sqlite://./dev.sqlite3',
  commissionRate: isNaN(COMMISSION_RATE) ? 0.25 : COMMISSION_RATE,
  uploadsDir: path.join(__dirname, '..', '..', 'uploads'),
  pdfBaseUrl: process.env.PDF_BASE_URL || 'http://localhost:3000'
};
