const express = require('express');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const knex = require('../db/knex');
const slugify = require('../lib/slugify');
const { cleanString } = require('../lib/sanitize');
const { addMessage } = require('../middleware/context');

const router = express.Router();

router.get('/apply', (req, res) => {
  res.render('apply/index', { title: 'Apply to ZipSite' });
});

router.post('/apply', async (req, res, next) => {
  const body = req.body;
  const firstName = cleanString(body.first_name || body.firstName);
  const lastName = cleanString(body.last_name || body.lastName);
  const email = cleanString(body.email);
  const city = cleanString(body.city || body.location);
  const measurements = cleanString(body.measurements || body.stats || '');
  const heightCm = Number(body.height_cm || body.heightCm || body.height || 0);
  const bio = cleanString(body.bio);

  const password = crypto.randomBytes(6).toString('hex');

  try {
    const existing = await knex('users').where({ email }).first();
    if (existing) {
      addMessage(req, 'error', 'Email already exists. Please sign in.');
      return res.redirect('/login');
    }

    const slugBase = slugify(`${firstName}-${lastName}`) || slugify(email.split('@')[0]);
    let slug = slugBase;
    let counter = 1;
    while (await knex('talent_profiles').where({ slug }).first()) {
      slug = `${slugBase}-${counter++}`;
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await knex.transaction(async (trx) => {
      const [userId] = await trx('users')
        .insert({ email, password_hash: passwordHash, role: 'TALENT' })
        .returning('id');
      const finalUserId = Array.isArray(userId) ? userId[0] : userId;

      const [profileId] = await trx('talent_profiles')
        .insert({
          user_id: finalUserId,
          slug,
          first_name: firstName,
          last_name: lastName,
          city,
          height_cm: heightCm,
          measurements,
          bio_curated: bio,
          created_at: trx.fn.now(),
          updated_at: trx.fn.now()
        })
        .returning('id');

      const finalProfileId = Array.isArray(profileId) ? profileId[0] : profileId;

      await trx('applications').insert({
        profile_id: finalProfileId,
        status: 'DRAFT'
      });

      req.session.userId = finalUserId;
      req.session.role = 'TALENT';
      req.session.generatedPassword = password;
    });

    addMessage(req, 'success', 'Application saved. Welcome to ZipSite!');
    res.redirect('/dashboard/talent');
  } catch (error) {
    next(error);
  }
});

module.exports = router;
