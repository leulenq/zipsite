const express = require('express');
const { v4: uuidv4 } = require('uuid');
const knex = require('../db/knex');
const { requireRole } = require('../middleware/auth');
const config = require('../config');
const { addMessage } = require('../middleware/context');

const router = express.Router();

router.get('/pro/upgrade', requireRole('TALENT'), async (req, res, next) => {
  try {
    const profile = await knex('profiles').where({ user_id: req.session.userId }).first();
    if (!profile) {
      addMessage(req, 'error', 'Create your profile before upgrading.');
      return res.redirect('/apply');
    }

    await knex.transaction(async (trx) => {
      const current = await trx('profiles').where({ id: profile.id }).first();
      if (!current.is_pro) {
        await trx('profiles').where({ id: profile.id }).update({ is_pro: true, updated_at: trx.fn.now() });
        if (current.partner_agency_id) {
          const amount = Math.round(9.99 * 100 * config.commissionRate);
          const existingCommission = await trx('commissions')
            .where({ agency_id: current.partner_agency_id, profile_id: profile.id })
            .first();
          if (!existingCommission) {
            await trx('commissions').insert({
              id: uuidv4(),
              agency_id: current.partner_agency_id,
              profile_id: profile.id,
              percent: config.commissionRate,
              amount_cents: amount
            });
          }
        }
      }
    });
    addMessage(req, 'success', 'You are now Pro! Generate a fresh PDF to remove the watermark.');
    return res.redirect('/dashboard/talent');
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
