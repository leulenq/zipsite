const express = require('express');
const knex = require('../db/knex');
const { requireRole } = require('../middleware/auth');
const { toFeetInches } = require('../lib/stats');
const { talentProfileUpdateSchema } = require('../lib/validation');
const { normalizeMeasurements, curateBio } = require('../lib/curate');
const { addMessage } = require('../middleware/context');

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
      shareUrl,
      isDashboard: true
    });
  } catch (error) {
    return next(error);
  }
});

router.post('/dashboard/talent', requireRole('TALENT'), async (req, res, next) => {
  const parsed = talentProfileUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    try {
      const profile = await knex('profiles').where({ user_id: req.session.userId }).first();
      const images = await knex('images').where({ profile_id: profile.id }).orderBy('sort');
      const completeness = {
        basics: Boolean(profile.first_name && profile.last_name && profile.city && profile.bio_curated),
        imagery: images.length >= 2,
        hero: Boolean(profile.hero_image_path || images.length > 0)
      };
      const shareUrl = `${req.protocol}://${req.get('host')}/portfolio/${profile.slug}`;
      return res.status(422).render('dashboard/talent', {
        title: 'Talent Dashboard',
        profile,
        images,
        completeness,
        stats: { heightFeet: toFeetInches(profile.height_cm) },
        shareUrl,
        isDashboard: true,
        formErrors: fieldErrors,
        values: req.body
      });
    } catch (error) {
      return next(error);
    }
  }

  try {
    const profile = await knex('profiles').where({ user_id: req.session.userId }).first();
    if (!profile) {
      addMessage(req, 'error', 'Profile not found.');
      return res.redirect('/apply');
    }

    const { city, height_cm, measurements, bio } = parsed.data;
    const curatedBio = curateBio(bio, profile.first_name, profile.last_name);
    const cleanedMeasurements = normalizeMeasurements(measurements);

    await knex('profiles')
      .where({ id: profile.id })
      .update({
        city,
        height_cm,
        measurements: cleanedMeasurements,
        bio_raw: bio,
        bio_curated: curatedBio,
        updated_at: knex.fn.now()
      });

    addMessage(req, 'success', 'Profile updated.');
    return res.redirect('/dashboard/talent');
  } catch (error) {
    return next(error);
  }
});

router.get('/dashboard/agency', requireRole('AGENCY'), async (req, res, next) => {
  try {
    const {
      sort = 'az',
      city = '',
      letter = '',
      search = '',
      min_height = '',
      max_height = ''
    } = req.query;
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

    if (search) {
      query = query.andWhere((qb) => {
        qb.whereILike('profiles.first_name', `%${search}%`).orWhereILike('profiles.last_name', `%${search}%`);
      });
    }

    const minHeightNumber = parseInt(min_height, 10);
    const maxHeightNumber = parseInt(max_height, 10);
    if (!Number.isNaN(minHeightNumber)) {
      query = query.where('profiles.height_cm', '>=', minHeightNumber);
    }
    if (!Number.isNaN(maxHeightNumber)) {
      query = query.where('profiles.height_cm', '<=', maxHeightNumber);
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

    const latestCommissions = await knex('commissions')
      .select('commissions.*', 'profiles.first_name', 'profiles.last_name', 'profiles.slug')
      .leftJoin('profiles', 'commissions.profile_id', 'profiles.id')
      .where('commissions.agency_id', req.session.userId)
      .orderBy('commissions.created_at', 'desc')
      .limit(5);

    return res.render('dashboard/agency', {
      title: 'Agency Dashboard',
      profiles,
      filters: { sort, city, letter, search, min_height, max_height },
      commissionsTotal: ((commissions?.total || 0) / 100).toFixed(2),
      latestCommissions,
      isDashboard: true
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
