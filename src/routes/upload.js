const express = require('express');
const { v4: uuidv4 } = require('uuid');
const knex = require('../db/knex');
const { upload, processImage } = require('../lib/uploader');
const { requireRole } = require('../middleware/auth');
const { cleanString } = require('../lib/sanitize');

const router = express.Router();

router.post('/upload', requireRole('TALENT'), upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'File required' });
    }

    const storedPath = await processImage(req.file.path);
    const profile = await knex('profiles').where({ user_id: req.session.userId }).first();
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    const countResult = await knex('images')
      .where({ profile_id: profile.id })
      .count({ total: '*' })
      .first();
    const nextSort = Number(countResult?.total || 0) + 1;
    const label = cleanString(req.body.label) || 'Portfolio image';

    await knex('images').insert({
      id: uuidv4(),
      profile_id: profile.id,
      path: storedPath,
      label,
      sort: nextSort
    });

    if (!profile.hero_image_path) {
      await knex('profiles').where({ id: profile.id }).update({ hero_image_path: storedPath });
    }

    return res.json({ ok: true, path: storedPath });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
