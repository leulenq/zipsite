const path = require('path');
const fs = require('fs');
const express = require('express');
const session = require('express-session');
const KnexSessionStore = require('connect-session-knex')(session);
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const config = require('./config');
const knex = require('./db/knex');
const { attachLocals } = require('./middleware/context');

const authRoutes = require('./routes/auth');
const applyRoutes = require('./routes/apply');
const dashboardRoutes = require('./routes/dashboard');
const portfolioRoutes = require('./routes/portfolio');
const pdfRoutes = require('./routes/pdf');
const uploadRoutes = require('./routes/upload');
const agencyRoutes = require('./routes/agency');
const proRoutes = require('./routes/pro');

const app = express();

fs.mkdirSync(config.uploadsDir, { recursive: true });

app.set('trust proxy', 1);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '..', 'views'));

app.use((req, res, next) => {
  const originalRender = res.render.bind(res);
  res.render = (view, options = {}, callback) => {
    const layout = options.layout === undefined ? 'layout' : options.layout;
    const renderOptions = { ...res.locals, ...options };
    const done = callback || ((err, html) => (err ? next(err) : res.send(html)));

    req.app.render(view, renderOptions, (err, html) => {
      if (err) return done(err);
      if (!layout) return done(null, html);
      return req.app.render(layout, { ...renderOptions, body: html }, done);
    });
  };
  res.renderWithLayout = originalRender;
  next();
});

app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

const sessionStore = new KnexSessionStore({
  knex,
  tablename: 'sessions'
});

app.use(
  session({
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: config.nodeEnv === 'production',
      maxAge: 1000 * 60 * 60 * 24 * 7
    }
  })
);

app.use(attachLocals);

app.use(express.static(path.join(__dirname, '..', 'public')));
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

const authLimiter = rateLimit({ windowMs: 60 * 1000, max: 10, standardHeaders: true, legacyHeaders: false });
app.use(['/login', '/signup'], authLimiter);
app.use('/upload', rateLimit({ windowMs: 60 * 1000, max: 20 }));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

['features', 'how', 'pricing', 'demo', 'press', 'legal'].forEach((page) => {
  app.get(`/${page}`, (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', `${page}.html`));
  });
});

app.use('/', authRoutes);
app.use('/', applyRoutes);
app.use('/', dashboardRoutes);
app.use('/', portfolioRoutes);
app.use('/', pdfRoutes);
app.use('/', uploadRoutes);
app.use('/', agencyRoutes);
app.use('/', proRoutes);

app.use((req, res) => {
  if (req.accepts('html')) {
    return res.status(404).render('errors/404', { title: 'Not found' });
  }
  return res.status(404).json({ error: 'Not found' });
});

app.use((err, req, res, next) => {
  console.error(err);
  if (res.headersSent) {
    return next(err);
  }
  if (req.accepts('html')) {
    return res.status(500).render('errors/500', { title: 'Server error' });
  }
  return res.status(500).json({ error: 'Server error' });
});

module.exports = app;
