const { addMessage } = require('./context');

function requireAuth(role) {
  return (req, res, next) => {
    if (!req.session || !req.session.userId) {
      addMessage(req, 'error', 'Please sign in to continue.');
      return res.redirect('/login');
    }
    if (role && req.session.role !== role) {
      return res.status(403).render('errors/403', { title: 'Forbidden' });
    }
    next();
  };
}

module.exports = {
  requireAuth
};
