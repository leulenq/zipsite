const express = require('express');
const { renderCompCard, loadProfile, toFeetInches } = require('../lib/pdf');

const router = express.Router();

router.get('/pdf/view/:slug', async (req, res, next) => {
  try {
    const data = await loadProfile(req.params.slug);
    if (!data) {
      return res.status(404).render('errors/404', { title: 'Profile not found' });
    }
    const { profile, images } = data;
    const hero = profile.hero_image_path || (images[0] ? images[0].path : null);
    const gallery = hero ? images.filter((img) => img.path !== hero) : images;
    return res.render('pdf/compcard', {
      layout: null,
      profile,
      images: gallery,
      hero,
      heightFeet: toFeetInches(profile.height_cm),
      watermark: !profile.is_pro
    });
  } catch (error) {
    return next(error);
  }
});

router.get('/pdf/:slug', async (req, res, next) => {
  try {
    const data = await loadProfile(req.params.slug);
    if (!data) {
      return res.status(404).json({ error: 'Profile not found' });
    }
    const buffer = await renderCompCard(req.params.slug);
    if (req.query.download) {
      res.setHeader('Content-Disposition', `attachment; filename="ZipSite-${req.params.slug}-compcard.pdf"`);
    } else {
      res.setHeader('Content-Disposition', 'inline');
    }
    res.contentType('application/pdf');
    return res.send(buffer);
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
