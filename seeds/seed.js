const bcrypt = require('bcrypt');
const { DateTime } = require('luxon');

/**
 * @param {import('knex')} knex
 */
exports.seed = async function seed(knex) {
  await knex('commissions').del();
  await knex('subscriptions').del();
  await knex('applications').del();
  await knex('media').del();
  await knex('agencies').del();
  await knex('talent_profiles').del();
  await knex('users').del();

  const passwordHash = await bcrypt.hash('password123', 10);

  const [agencyUserId] = await knex('users')
    .insert({
      email: 'agency@example.com',
      password_hash: passwordHash,
      role: 'AGENCY'
    })
    .returning('id');

  const agencyId = Array.isArray(agencyUserId) ? agencyUserId[0] : agencyUserId;

  await knex('agencies').insert({
    user_id: agencyId,
    name: 'ZipSite Partners',
    partner_code: 'ZIP-AGENCY',
    commission_rate: 0.25
  });

  const [talentUserId] = await knex('users')
    .insert({
      email: 'talent@example.com',
      password_hash: passwordHash,
      role: 'TALENT'
    })
    .returning('id');

  const talentId = Array.isArray(talentUserId) ? talentUserId[0] : talentUserId;

  const [profileId] = await knex('talent_profiles')
    .insert({
      user_id: talentId,
      slug: 'aria-stone',
      first_name: 'Aria',
      last_name: 'Stone',
      city: 'New York, NY',
      height_cm: 178,
      measurements: '32-24-34',
      bio_curated:
        'Aria Stone is a New York-based creative talent represented by ZipSite. With runway poise and a collaborative spirit, she delivers consistent results across editorial and commercial productions.',
      is_pro: false,
      hero_image_path: '/uploads/seed/aria-headshot.webp'
    })
    .returning('id');

  const finalProfileId = Array.isArray(profileId) ? profileId[0] : profileId;

  await knex('media').insert([
    {
      profile_id: finalProfileId,
      kind: 'HEADSHOT',
      path: '/uploads/seed/aria-headshot.webp',
      label: 'Headshot',
      sort: 1
    },
    {
      profile_id: finalProfileId,
      kind: 'FULL',
      path: '/uploads/seed/aria-full.webp',
      label: 'Editorial',
      sort: 2
    },
    {
      profile_id: finalProfileId,
      kind: 'DIGITAL',
      path: '/uploads/seed/aria-digital.webp',
      label: 'Digital',
      sort: 3
    }
  ]);

  await knex('applications').insert({
    profile_id: finalProfileId,
    status: 'CURATED',
    submitted_at: DateTime.now().minus({ days: 2 }).toJSDate()
  });

  return knex('subscriptions').insert({
    profile_id: finalProfileId,
    plan: 'FREE',
    started_at: DateTime.now().minus({ days: 2 }).toJSDate()
  });
};
