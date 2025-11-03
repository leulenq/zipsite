/**
 * @param {import('knex')} knex
 */
exports.up = async function up(knex) {
  await knex.schema.createTable('users', (table) => {
    table.increments('id').primary();
    table.string('email').notNullable().unique();
    table.string('password_hash').notNullable();
    table.enu('role', ['TALENT', 'AGENCY', 'ADMIN']).notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('agencies', (table) => {
    table.increments('id').primary();
    table
      .integer('user_id')
      .unsigned()
      .references('id')
      .inTable('users')
      .onDelete('CASCADE');
    table.string('name').notNullable();
    table.string('partner_code').notNullable().unique();
    table.decimal('commission_rate').defaultTo(0.25);
  });

  await knex.schema.createTable('talent_profiles', (table) => {
    table.increments('id').primary();
    table
      .integer('user_id')
      .unsigned()
      .references('id')
      .inTable('users')
      .onDelete('CASCADE');
    table.string('slug').notNullable().unique();
    table.string('first_name').notNullable();
    table.string('last_name').notNullable();
    table.string('city');
    table.integer('height_cm');
    table.string('measurements');
    table.text('bio_curated');
    table.boolean('is_pro').defaultTo(false);
    table.string('hero_image_path');
    table
      .integer('claimed_agency_id')
      .unsigned()
      .references('id')
      .inTable('agencies');
    table.string('partner_code_claimed');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('media', (table) => {
    table.increments('id').primary();
    table
      .integer('profile_id')
      .unsigned()
      .references('id')
      .inTable('talent_profiles')
      .onDelete('CASCADE');
    table.enu('kind', ['HEADSHOT', 'FULL', 'DIGITAL', 'REEL']).notNullable();
    table.string('path').notNullable();
    table.string('label');
    table.integer('sort').defaultTo(0);
  });

  await knex.schema.createTable('applications', (table) => {
    table.increments('id').primary();
    table
      .integer('profile_id')
      .unsigned()
      .references('id')
      .inTable('talent_profiles')
      .onDelete('CASCADE');
    table.enu('status', ['DRAFT', 'SUBMITTED', 'CURATED', 'PUBLISHED']).defaultTo('DRAFT');
    table.timestamp('submitted_at');
  });

  await knex.schema.createTable('subscriptions', (table) => {
    table.increments('id').primary();
    table
      .integer('profile_id')
      .unsigned()
      .references('id')
      .inTable('talent_profiles')
      .onDelete('CASCADE');
    table.enu('plan', ['FREE', 'PRO']).notNullable();
    table.timestamp('started_at').defaultTo(knex.fn.now());
    table.timestamp('canceled_at');
  });

  await knex.schema.createTable('commissions', (table) => {
    table.increments('id').primary();
    table
      .integer('agency_id')
      .unsigned()
      .references('id')
      .inTable('agencies')
      .onDelete('CASCADE');
    table
      .integer('profile_id')
      .unsigned()
      .references('id')
      .inTable('talent_profiles')
      .onDelete('CASCADE');
    table.integer('amount_cents').notNullable();
    table.enu('source', ['UPGRADE']).notNullable();
    table.timestamp('occurred_at').defaultTo(knex.fn.now());
  });
};

exports.down = async function down(knex) {
  await knex.schema.dropTableIfExists('commissions');
  await knex.schema.dropTableIfExists('subscriptions');
  await knex.schema.dropTableIfExists('applications');
  await knex.schema.dropTableIfExists('media');
  await knex.schema.dropTableIfExists('talent_profiles');
  await knex.schema.dropTableIfExists('agencies');
  await knex.schema.dropTableIfExists('users');
};
