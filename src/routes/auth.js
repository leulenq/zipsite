const express = require('express');
const bcrypt = require('bcrypt');
const knex = require('../db/knex');
const slugify = require('../lib/slugify');
const { cleanString } = require('../lib/sanitize');
const { addMessage } = require('../middleware/context');

const router = express.Router();

router.get('/login', (req, res) => {
  res.render('auth/login', { title: 'Sign In' });
});

router.post('/login', async (req, res, next) => {
  const email = cleanString(req.body.email);
  const password = req.body.password;
  try {
    const user = await knex('users').where({ email }).first();
    if (!user) {
      addMessage(req, 'error', 'Invalid credentials.');
      return res.redirect('/login');
    }
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      addMessage(req, 'error', 'Invalid credentials.');
      return res.redirect('/login');
    }
    req.session.userId = user.id;
    req.session.role = user.role;
    if (user.role === 'TALENT') {
      return res.redirect('/dashboard/talent');
    }
    if (user.role === 'AGENCY') {
      return res.redirect('/dashboard/agency');
    }
    res.redirect('/');
  } catch (error) {
    next(error);
  }
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
});

router.get('/register/talent', (req, res) => {
  res.render('auth/register', { title: 'Join as Talent', role: 'TALENT' });
});

router.get('/register/agency', (req, res) => {
  res.render('auth/register', { title: 'Join as Agency', role: 'AGENCY' });
});

router.post('/register', async (req, res, next) => {
  const { email, password, role, first_name, last_name } = req.body;
  const cleanEmail = cleanString(email);
  try {
    const existing = await knex('users').where({ email: cleanEmail }).first();
    if (existing) {
      addMessage(req, 'error', 'Email already registered.');
      return res.redirect(`/register/${role.toLowerCase()}`);
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const [userId] = await knex('users')
      .insert({ email: cleanEmail, password_hash: passwordHash, role })
      .returning('id');
    const finalUserId = Array.isArray(userId) ? userId[0] : userId;

    if (role === 'TALENT') {
      const slug = slugify(`${first_name}-${last_name}`);
      await knex('talent_profiles').insert({
        user_id: finalUserId,
        slug,
        first_name: cleanString(first_name),
        last_name: cleanString(last_name),
        created_at: knex.fn.now(),
        updated_at: knex.fn.now()
      });
      req.session.userId = finalUserId;
      req.session.role = 'TALENT';
      return res.redirect('/dashboard/talent');
    }

    if (role === 'AGENCY') {
      await knex('agencies').insert({
        user_id: finalUserId,
        name: cleanString(req.body.name),
        partner_code: cleanString(req.body.partner_code || slugify(first_name || 'agency')).toUpperCase(),
        commission_rate: req.body.commission_rate || 0.25
      });
      req.session.userId = finalUserId;
      req.session.role = 'AGENCY';
      return res.redirect('/dashboard/agency');
    }

    res.redirect('/');
  } catch (error) {
    next(error);
  }
});

module.exports = router;
