const express = require('express');
const { renderCompCard, fetchProfile } = require('../lib/pdf');
const { requireAuth } = require('../middleware/auth');
const knex = require('../db/knex');

const router = express.Router();

router.get('/pdf/:slug', async (req, res, next) => {
  try {
    const data = await fetchProfile(req.params.slug);
    if (!data) {
      return res.status(404).json({ error: 'Profile not found' });
    }
    const watermark = !data.profile.is_pro;
    const buffer = await renderCompCard(req.params.slug, { watermark });
    if (req.query.download) {
      res.setHeader('Content-Disposition', `attachment; filename="ZipSite-${req.params.slug}-compcard.pdf"`);
    }
    res.contentType('application/pdf');
    res.send(buffer);
  } catch (error) {
    next(error);
  }
});

router.post('/pdf', requireAuth('TALENT'), async (req, res, next) => {
  try {
    const profile = await knex('talent_profiles').where({ user_id: req.session.userId }).first();
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }
    const buffer = await renderCompCard(profile.slug, { watermark: !profile.is_pro });
    res.contentType('application/pdf');
    res.send(buffer);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
