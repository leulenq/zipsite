const express = require('express');
const knex = require('../db/knex');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.post('/agency/claim', requireAuth('AGENCY'), async (req, res, next) => {
  try {
    const { slug } = req.body;
    const agency = await knex('agencies').where({ user_id: req.session.userId }).first();
    if (!agency) {
      return res.status(404).json({ error: 'Agency not found' });
    }
    const profile = await knex('talent_profiles').where({ slug }).first();
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }
    await knex('talent_profiles')
      .where({ id: profile.id })
      .update({
        claimed_agency_id: agency.id,
        partner_code_claimed: agency.partner_code,
        updated_at: knex.fn.now()
      });

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
