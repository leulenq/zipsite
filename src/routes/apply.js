const express = require('express');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const knex = require('../db/knex');
const { applySchema } = require('../lib/validation');
const { normalizeMeasurements, curateBio } = require('../lib/curate');
const { ensureUniqueSlug } = require('../lib/slugify');
const { addMessage } = require('../middleware/context');

const router = express.Router();

router.get('/apply', (req, res) => {
  const defaults = req.currentProfile
    ? {
        first_name: req.currentProfile.first_name,
        last_name: req.currentProfile.last_name,
        city: req.currentProfile.city,
        measurements: req.currentProfile.measurements,
        height_cm: req.currentProfile.height_cm,
        bio: req.currentProfile.bio_raw,
        email: req.currentUser?.email
      }
    : {};

  return res.render('apply/index', {
    title: 'Start your ZipSite profile',
    values: defaults,
    errors: {}
  });
});

router.post('/apply', async (req, res, next) => {
  const parsed = applySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(422).render('apply/index', {
      title: 'Start your ZipSite profile',
      values: req.body,
      errors: parsed.error.flatten().fieldErrors
    });
  }

  const {
    first_name,
    last_name,
    email,
    password,
    city,
    height_cm,
    measurements,
    bio,
    partner_agency_email
  } = parsed.data;

  try {
    let user = await knex('users').where({ email }).first();
    if (user) {
      if (user.role !== 'TALENT') {
        return res.status(422).render('apply/index', {
          title: 'Start your ZipSite profile',
          values: req.body,
          errors: { email: ['That email is already registered as an agency.'] }
        });
      }
      const valid = await bcrypt.compare(password, user.password_hash);
      if (!valid) {
        return res.status(401).render('apply/index', {
          title: 'Start your ZipSite profile',
          values: req.body,
          errors: { password: ['Incorrect password for existing account.'] }
        });
      }
    } else {
      const passwordHash = await bcrypt.hash(password, 10);
      const userId = uuidv4();
      await knex('users').insert({
        id: userId,
        email,
        password_hash: passwordHash,
        role: 'TALENT'
      });
      user = await knex('users').where({ id: userId }).first();
    }

    let partnerAgencyId = null;
    if (partner_agency_email) {
      const agency = await knex('users').where({ email: partner_agency_email, role: 'AGENCY' }).first();
      if (!agency) {
        return res.status(422).render('apply/index', {
          title: 'Start your ZipSite profile',
          values: req.body,
          errors: { partner_agency_email: ['We could not find that agency account.'] }
        });
      }
      partnerAgencyId = agency.id;
    }

    const existingProfile = await knex('profiles').where({ user_id: user.id }).first();
    const curatedBio = curateBio(bio, first_name, last_name);
    const cleanedMeasurements = normalizeMeasurements(measurements);

    if (existingProfile) {
      await knex('profiles')
        .where({ id: existingProfile.id })
        .update({
          first_name,
          last_name,
          city,
          height_cm,
          measurements: cleanedMeasurements,
          bio_raw: bio,
          bio_curated: curatedBio,
          partner_agency_id: partnerAgencyId,
          updated_at: knex.fn.now()
        });
    } else {
      const slug = await ensureUniqueSlug(knex, 'profiles', `${first_name}-${last_name}`);
      await knex('profiles').insert({
        id: uuidv4(),
        user_id: user.id,
        slug,
        first_name,
        last_name,
        city,
        height_cm,
        measurements: cleanedMeasurements,
        bio_raw: bio,
        bio_curated: curatedBio,
        partner_agency_id: partnerAgencyId
      });
    }

    req.session.userId = user.id;
    req.session.role = 'TALENT';

    const profile = await knex('profiles').where({ user_id: user.id }).first();
    addMessage(req, 'success', 'Application saved! Upload media to finish your comp card.');
    return res.redirect(303, `/dashboard/talent?created=${profile.slug}`);
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
