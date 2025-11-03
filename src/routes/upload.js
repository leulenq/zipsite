const express = require('express');
const knex = require('../db/knex');
const { upload, processImage } = require('../lib/uploader');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.post('/upload', requireAuth('TALENT'), upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'File required' });
    }
    const storedPath = await processImage(req.file.path);
    const profile = await knex('talent_profiles').where({ user_id: req.session.userId }).first();
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }
    const count = await knex('media').where({ profile_id: profile.id }).count({ total: '*' }).first();
    const kind = req.body.kind || 'HEADSHOT';
    await knex('media').insert({
      profile_id: profile.id,
      kind,
      path: storedPath,
      label: req.body.label || kind,
      sort: Number(count?.total || 0) + 1
    });

    if (kind === 'HEADSHOT') {
      await knex('talent_profiles').where({ id: profile.id }).update({ hero_image_path: storedPath });
    }

    res.json({ success: true, path: storedPath });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
