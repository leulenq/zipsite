const express = require('express');
const knex = require('../db/knex');
const { requireAuth } = require('../middleware/auth');
const { normalizeMeasurements, curateBio } = require('../lib/curate');

const router = express.Router();

router.post('/curate', requireAuth('TALENT'), async (req, res, next) => {
  try {
    const profile = await knex('talent_profiles').where({ user_id: req.session.userId }).first();
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    const measurements = normalizeMeasurements(req.body.measurements || profile.measurements || '');
    const bio = curateBio(req.body.bio || profile.bio_curated || '', profile.first_name, profile.last_name);

    await knex('talent_profiles')
      .where({ id: profile.id })
      .update({
        measurements,
        bio_curated: bio,
        updated_at: knex.fn.now()
      });

    await knex('applications').where({ profile_id: profile.id }).update({ status: 'CURATED', submitted_at: knex.fn.now() });

    res.json({ success: true, measurements, bio });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
