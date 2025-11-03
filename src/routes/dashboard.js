const express = require('express');
const knex = require('../db/knex');
const { requireRole } = require('../middleware/auth');
const { toFeetInches } = require('../lib/stats');

const router = express.Router();

router.get('/dashboard/talent', requireRole('TALENT'), async (req, res, next) => {
  try {
    const profile = await knex('profiles').where({ user_id: req.session.userId }).first();
    if (!profile) {
      return res.redirect('/apply');
    }
    const images = await knex('images').where({ profile_id: profile.id }).orderBy('sort');

    const completeness = {
      basics: Boolean(profile.first_name && profile.last_name && profile.city && profile.bio_curated),
      imagery: images.length >= 2,
      hero: Boolean(profile.hero_image_path || images.length > 0)
    };

    const shareUrl = `${req.protocol}://${req.get('host')}/portfolio/${profile.slug}`;
    return res.render('dashboard/talent', {
      title: 'Talent Dashboard',
      profile,
      images,
      completeness,
      stats: { heightFeet: toFeetInches(profile.height_cm) },
      shareUrl
    });
  } catch (error) {
    return next(error);
  }
});

router.get('/dashboard/agency', requireRole('AGENCY'), async (req, res, next) => {
  try {
    const { sort = 'az', city = '', letter = '' } = req.query;
    let query = knex('profiles')
      .select('profiles.*', 'users.email as owner_email')
      .leftJoin('users', 'profiles.user_id', 'users.id')
      .whereNotNull('profiles.bio_curated');

    if (city) {
      query = query.whereILike('profiles.city', `%${city}%`);
    }

    if (letter) {
      query = query.whereILike('profiles.last_name', `${letter}%`);
    }

    if (sort === 'city') {
      query = query.orderBy(['profiles.city', 'profiles.last_name']);
    } else {
      query = query.orderBy(['profiles.last_name', 'profiles.first_name']);
    }

    const profiles = await query;

    const commissions = await knex('commissions')
      .where({ agency_id: req.session.userId })
      .sum({ total: 'amount_cents' })
      .first();

    return res.render('dashboard/agency', {
      title: 'Agency Dashboard',
      profiles,
      filters: { sort, city, letter },
      commissionsTotal: ((commissions?.total || 0) / 100).toFixed(2)
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
