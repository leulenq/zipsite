const express = require('express');
const knex = require('../db/knex');

const router = express.Router();

router.get('/portfolio/:slug', async (req, res, next) => {
  try {
    const profile = await knex('talent_profiles').where({ slug: req.params.slug }).first();
    if (!profile) {
      return res.status(404).render('errors/404', { title: 'Profile Not Found' });
    }
    const media = await knex('media').where({ profile_id: profile.id }).orderBy('sort', 'asc');
    res.render('portfolio/show', {
      title: `${profile.first_name} ${profile.last_name}`,
      profile,
      media
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
