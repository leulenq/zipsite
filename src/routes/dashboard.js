const express = require('express');
const knex = require('../db/knex');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/dashboard/talent', requireAuth('TALENT'), async (req, res, next) => {
  try {
    const profile = await knex('talent_profiles').where({ user_id: req.session.userId }).first();
    if (!profile) {
      return res.redirect('/apply');
    }
    const media = await knex('media').where({ profile_id: profile.id }).orderBy('sort', 'asc');
    const application = await knex('applications').where({ profile_id: profile.id }).first();
    const subscription = await knex('subscriptions').where({ profile_id: profile.id }).orderBy('started_at', 'desc').first();

    const completeness = {
      basics: Boolean(profile.first_name && profile.last_name && profile.city),
      media: media.length >= 3,
      curated: application?.status === 'CURATED' || application?.status === 'PUBLISHED'
    };

    res.render('dashboard/talent', {
      title: 'Talent Dashboard',
      profile,
      media,
      application,
      subscription,
      completeness,
      request: req
    });
  } catch (error) {
    next(error);
  }
});

router.get('/dashboard/agency', requireAuth('AGENCY'), async (req, res, next) => {
  try {
    const partners = await knex('agencies').where({ user_id: req.session.userId }).first();
    const { sort = 'az', city = '' } = req.query;
    let query = knex('talent_profiles')
      .select('talent_profiles.*', 'applications.status')
      .leftJoin('applications', 'talent_profiles.id', 'applications.profile_id')
      .whereIn('applications.status', ['CURATED', 'PUBLISHED']);

    if (city) {
      query = query.andWhere('talent_profiles.city', 'like', `%${city}%`);
    }

    if (sort === 'city') {
      query = query.orderBy('talent_profiles.city');
    } else {
      query = query.orderBy('talent_profiles.last_name');
    }

    const profiles = await query;

    const commissions = await knex('commissions')
      .where({ agency_id: partners?.id })
      .sum('amount_cents as total')
      .first();

    res.render('dashboard/agency', {
      title: 'Agency Dashboard',
      profiles,
      filters: { sort, city },
      commissionsTotal: (commissions?.total || 0) / 100
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
