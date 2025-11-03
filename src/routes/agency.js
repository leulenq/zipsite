const express = require('express');
const knex = require('../db/knex');
const { requireRole } = require('../middleware/auth');
const { partnerClaimSchema } = require('../lib/validation');
const { addMessage } = require('../middleware/context');

const router = express.Router();

router.post('/agency/claim', requireRole('AGENCY'), async (req, res, next) => {
  const parsed = partnerClaimSchema.safeParse(req.body);
  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors;
    if (req.accepts('json') && !(req.headers.accept || '').includes('text/html')) {
      return res.status(422).json({ errors });
    }
    const message = Object.values(errors)[0]?.[0] || 'Invalid request';
    addMessage(req, 'error', message);
    return res.redirect('/dashboard/agency');
  }

  try {
    const profile = await knex('profiles').where({ slug: parsed.data.slug }).first();
    if (!profile) {
      if (req.accepts('json') && !(req.headers.accept || '').includes('text/html')) {
        return res.status(404).json({ error: 'Profile not found' });
      }
      addMessage(req, 'error', 'Profile not found');
      return res.redirect('/dashboard/agency');
    }

    if (profile.partner_agency_id && profile.partner_agency_id !== req.session.userId) {
      if (req.accepts('json') && !(req.headers.accept || '').includes('text/html')) {
        return res.status(409).json({ error: 'Profile already claimed by another agency' });
      }
      addMessage(req, 'error', 'Profile already claimed by another agency');
      return res.redirect('/dashboard/agency');
    }

    await knex('profiles')
      .where({ id: profile.id })
      .update({ partner_agency_id: req.session.userId, updated_at: knex.fn.now() });

    if (req.accepts('json') && !(req.headers.accept || '').includes('text/html')) {
      return res.json({ ok: true });
    }
    addMessage(req, 'success', 'Profile claimed for commissions.');
    return res.redirect('/dashboard/agency');
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
