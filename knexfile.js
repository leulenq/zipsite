require('dotenv').config();

const DEFAULT_SQLITE = {
  client: 'sqlite3',
  connection: {
    filename: process.env.DATABASE_URL?.replace('sqlite://', '') || './dev.sqlite3'
  },
  useNullAsDefault: true,
  migrations: {
    tableName: 'knex_migrations',
    directory: './migrations'
  },
  seeds: {
    directory: './seeds'
  }
};

const DEFAULT_PG = {
  client: 'pg',
  connection: process.env.DATABASE_URL,
  migrations: {
    tableName: 'knex_migrations',
    directory: './migrations'
  },
  seeds: {
    directory: './seeds'
  }
};

const client = process.env.DATABASE_CLIENT || 'sqlite3';

module.exports = client === 'pg' ? DEFAULT_PG : DEFAULT_SQLITE;
