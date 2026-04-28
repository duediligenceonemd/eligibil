'use strict';
require('dotenv').config();

const express = require('express');
const session = require('express-session');
const path    = require('path');

const app  = express();
const PORT = process.env.PORT || 3000;

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session middleware (MemoryStore — fine for dev/prototype)
app.use(session({
  secret: process.env.SESSION_SECRET || 'eligibil-dev-secret-2026',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  },
}));

// Static files served from project root
app.use(express.static(__dirname));

// API routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api', require('./routes/api'));

// Catch-all: serve index.html for non-API routes
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Initialise DB and start server
require('./db/database').init();

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
