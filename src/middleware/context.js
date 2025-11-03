const knex = require('../db/knex');

async function attachLocals(req, res, next) {
  res.locals.currentUser = null;
  if (req.session && req.session.userId) {
    try {
      const user = await knex('users').where({ id: req.session.userId }).first();
      if (user) {
        res.locals.currentUser = { id: user.id, role: user.role, email: user.email };
      }
    } catch (error) {
      return next(error);
    }
  }
  res.locals.messages = req.session?.messages || [];
  if (req.session) {
    req.session.messages = [];
  }
  if (req.session && req.session.generatedPassword) {
    res.locals.messages.push({ type: 'info', text: `Temporary password: ${req.session.generatedPassword}` });
    req.session.generatedPassword = null;
  }
  next();
}

function addMessage(req, type, text) {
  if (!req.session) return;
  if (!req.session.messages) {
    req.session.messages = [];
  }
  req.session.messages.push({ type, text });
}

module.exports = {
  attachLocals,
  addMessage
};
