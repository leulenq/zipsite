const path = require('path');
const ejs = require('ejs');
const puppeteer = require('puppeteer');
const knex = require('../db/knex');
const config = require('../config');
const { toFeetInches } = require('./stats');

async function fetchProfile(slug) {
  const profile = await knex('talent_profiles').where({ slug }).first();
  if (!profile) return null;
  const media = await knex('media').where({ profile_id: profile.id }).orderBy('sort', 'asc');
  const application = await knex('applications').where({ profile_id: profile.id }).first();
  const subscription = await knex('subscriptions').where({ profile_id: profile.id }).orderBy('started_at', 'desc').first();
  return { profile, media, application, subscription };
}

async function renderCompCard(slug, { watermark }) {
  const result = await fetchProfile(slug);
  if (!result) {
    throw new Error('Profile not found');
  }

  const { profile, media } = result;
  const heroPath = profile.hero_image_path || (media[0] ? media[0].path : null);
  const gallery = heroPath ? media.filter((item) => item.path !== heroPath) : media;
  const templatePath = path.join(__dirname, '..', '..', 'views', 'pdf', 'compcard.ejs');
  const html = await ejs.renderFile(templatePath, {
    profile: Object.assign({}, profile, { hero_image_path: heroPath }),
    media: gallery,
    watermark,
    heightFeet: toFeetInches(profile.height_cm),
    pdfBaseUrl: config.pdfBaseUrl
  });

  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    headless: 'new'
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const buffer = await page.pdf({
      width: '5.5in',
      height: '8.5in',
      printBackground: true,
      margin: { top: '0.25in', bottom: '0.25in', left: '0.25in', right: '0.25in' }
    });
    return buffer;
  } finally {
    await browser.close();
  }
}

module.exports = {
  renderCompCard,
  fetchProfile
};
