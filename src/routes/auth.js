const express = require('express');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const knex = require('../db/knex');
const { loginSchema, signupSchema } = require('../lib/validation');
const { addMessage } = require('../middleware/context');
const { ensureUniqueSlug } = require('../lib/slugify');

const router = express.Router();

function redirectForRole(role) {
  if (role === 'TALENT') return '/dashboard/talent';
  if (role === 'AGENCY') return '/dashboard/agency';
  return '/';
}

function safeNext(input) {
  if (!input || typeof input !== 'string') return null;
  if (!input.startsWith('/')) return null;
  if (input.startsWith('//')) return null;
  return input;
}

router.get('/login', (req, res) => {
  if (req.session?.userId) {
    return res.redirect(redirectForRole(req.session.role));
  }
  const nextPath = safeNext(req.query.next);
  return res.render('auth/login', { title: 'Sign in', values: { next: nextPath }, errors: {} });
});

router.post('/login', async (req, res, next) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(422).render('auth/login', {
      title: 'Sign in',
      values: req.body,
      errors: parsed.error.flatten().fieldErrors
    });
  }

  const { email, password } = parsed.data;
  const nextPath = safeNext(req.body.next);
  try {
    const user = await knex('users').where({ email }).first();
    if (!user) {
      return res.status(401).render('auth/login', {
        title: 'Sign in',
        values: req.body,
        errors: { email: ['Invalid credentials'] }
      });
    }
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).render('auth/login', {
        title: 'Sign in',
        values: req.body,
        errors: { email: ['Invalid credentials'] }
      });
    }
    req.session.userId = user.id;
    req.session.role = user.role;
    return res.redirect(nextPath || redirectForRole(user.role));
  } catch (error) {
    return next(error);
  }
});

router.get('/signup', (req, res) => {
  if (req.session?.userId) {
    return res.redirect(redirectForRole(req.session.role));
  }
  const nextPath = safeNext(req.query.next);
  return res.render('auth/signup', { title: 'Create account', values: { next: nextPath }, errors: {} });
});

router.post('/signup', async (req, res, next) => {
  const parsed = signupSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(422).render('auth/signup', {
      title: 'Create account',
      values: req.body,
      errors: parsed.error.flatten().fieldErrors
    });
  }

  const { email, password, role, first_name, last_name } = parsed.data;
  const nextPath = safeNext(req.body.next);
  try {
    const existing = await knex('users').where({ email }).first();
    if (existing) {
      return res.status(422).render('auth/signup', {
        title: 'Create account',
        values: req.body,
        errors: { email: ['That email is already registered'] }
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const userId = uuidv4();
    await knex('users').insert({
      id: userId,
      email,
      password_hash: passwordHash,
      role
    });

    if (role === 'TALENT') {
      const existingProfile = await knex('profiles').where({ user_id: userId }).first();
      if (!existingProfile) {
        const slugBase = `${first_name}-${last_name}`;
        const slug = await ensureUniqueSlug(knex, 'profiles', slugBase);
        await knex('profiles').insert({
          id: uuidv4(),
          user_id: userId,
          slug,
          first_name,
          last_name,
          city: 'New York, NY',
          height_cm: 175,
          measurements: '32-24-35',
          bio_raw: 'New to ZipSite.',
          bio_curated: `${first_name} ${last_name} is getting started with ZipSite.`,
          hero_image_path: null
        });
      }
    }

    req.session.userId = userId;
    req.session.role = role;
    addMessage(req, 'success', 'Welcome to ZipSite!');
    return res.redirect(nextPath || redirectForRole(role));
  } catch (error) {
    return next(error);
  }
});

router.post('/logout', (req, res) => {
  req.session?.destroy(() => {
    res.clearCookie('connect.sid');
    res.redirect('/');
  });
});

module.exports = router;
