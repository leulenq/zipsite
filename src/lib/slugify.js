const validator = require('validator');

module.exports = function slugify(str) {
  if (!str) return '';
  const normalized = validator.trim(str.toString()).toLowerCase();
  return normalized
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 60);
};
