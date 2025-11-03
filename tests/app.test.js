const request = require('supertest');
const knex = require('../src/db/knex');
const app = require('../src/app');

beforeAll(async () => {
  await knex.migrate.rollback({}, true);
  await knex.migrate.latest();
  await knex.seed.run();
});

afterAll(async () => {
  await knex.destroy();
});

describe('ZipSite end-to-end', () => {
  test('auth login/logout works', async () => {
    const agent = request.agent(app);
    await agent
      .post('/login')
      .send({ email: 'talent@example.com', password: 'password123' })
      .expect(302);

    await agent.post('/logout').expect(302);
  });

  const email = `newtalent-${Date.now()}@example.com`;
  let talentAgent;
  let profile;

  test('apply, upload, curate, and pdf', async () => {
    talentAgent = request.agent(app);
    await talentAgent
      .post('/apply')
      .send({
        first_name: 'Nova',
        last_name: 'Lane',
        email,
        city: 'Brooklyn, NY',
        height_cm: 175,
        measurements: '32-24-34',
        bio: 'Nova brings editorial energy to every set.'
      })
      .expect(302);

    const user = await knex('users').where({ email }).first();
    profile = await knex('talent_profiles').where({ user_id: user.id }).first();

    await talentAgent
      .post('/curate')
      .send({ measurements: '32-24-34', bio: 'Nova is a collaborative creative.' })
      .expect(200);

    await talentAgent
      .post('/upload')
      .field('kind', 'HEADSHOT')
      .attach('file', 'uploads/seed/aria-headshot.webp')
      .expect(200);

    const pdfResponse = await talentAgent.get(`/pdf/${profile.slug}`);
    expect(pdfResponse.status).toBe(200);
    expect(pdfResponse.headers['content-type']).toContain('application/pdf');
  });

  test('agency claim attaches partner code', async () => {
    const agencyAgent = request.agent(app);
    await agencyAgent
      .post('/login')
      .send({ email: 'agency@example.com', password: 'password123' })
      .expect(302);

    await agencyAgent
      .post('/agency/claim')
      .send({ slug: profile.slug })
      .expect(200);

    const updated = await knex('talent_profiles').where({ id: profile.id }).first();
    expect(updated.partner_code_claimed).toBeDefined();
  });

  test('upgrade flow toggles pro and writes commission', async () => {
    await talentAgent.get('/pro/upgrade').expect(200);
    await talentAgent.post('/pro/upgrade').expect(302);

    const refreshed = await knex('talent_profiles').where({ id: profile.id }).first();
    expect(refreshed.is_pro).toBe(true);

    const commission = await knex('commissions').where({ profile_id: profile.id }).first();
    expect(commission).toBeDefined();
    expect(commission.amount_cents).toBeGreaterThan(0);
  });
});
