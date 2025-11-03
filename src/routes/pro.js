const express = require('express');
const knex = require('../db/knex');
const { requireAuth } = require('../middleware/auth');
const config = require('../config');

const router = express.Router();

router.get('/pro/upgrade', requireAuth('TALENT'), async (req, res, next) => {
  try {
    const profile = await knex('talent_profiles').where({ user_id: req.session.userId }).first();
    res.render('dashboard/pro_upgrade', { title: 'Go Pro', profile, price: 9.99, config });
  } catch (error) {
    next(error);
  }
});

router.post('/pro/upgrade', requireAuth('TALENT'), async (req, res, next) => {
  try {
    await knex.transaction(async (trx) => {
      const profile = await trx('talent_profiles').where({ user_id: req.session.userId }).first();
      if (!profile) {
        throw new Error('Profile missing');
      }
      if (!profile.is_pro) {
        await trx('talent_profiles').where({ id: profile.id }).update({ is_pro: true, updated_at: trx.fn.now() });
        await trx('subscriptions').insert({ profile_id: profile.id, plan: 'PRO', started_at: trx.fn.now() });
        await trx('applications').where({ profile_id: profile.id }).update({ status: 'PUBLISHED', submitted_at: trx.fn.now() });

        if (profile.claimed_agency_id) {
          const amount = Math.round(9.99 * 100 * config.commissionRate);
          await trx('commissions').insert({
            agency_id: profile.claimed_agency_id,
            profile_id: profile.id,
            amount_cents: amount,
            source: 'UPGRADE',
            occurred_at: trx.fn.now()
          });
        }
      }
    });

    res.redirect('/dashboard/talent');
  } catch (error) {
    next(error);
  }
});

module.exports = router;
