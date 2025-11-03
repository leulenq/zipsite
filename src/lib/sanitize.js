const validator = require('validator');
const sanitizeHtml = require('sanitize-html');

function cleanString(value) {
  if (typeof value !== 'string') return '';
  return validator.escape(value.trim());
}

function cleanHtml(value) {
  if (typeof value !== 'string') return '';
  return sanitizeHtml(value, {
    allowedTags: ['b', 'i', 'em', 'strong', 'p', 'br'],
    allowedAttributes: {}
  });
}

module.exports = {
  cleanString,
  cleanHtml
};
