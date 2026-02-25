const express = require('express');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const methodOverride = require('method-override');
const logger = require('morgan');
const cors = require('cors');
const path = require('path');

const { connectToDatabase } = require('./config/database');

const indexRouter = require('./routes/index');
const komikRouter = require('./routes/komik');

const app = express();

// Middleware
app.use(logger('dev'));
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(methodOverride());
app.use(express.static('public'));

// Routes
app.use('/', indexRouter);
app.use('/komik', komikRouter);

// Serve React static assets in production
if (process.env.NODE_ENV === 'production') {
  app.use('/react/assets', express.static(path.join(__dirname, 'dist-react/assets')));

  // Serve React app for migrated routes (Phase 2+)
  // For now, we only serve the root path with React
  app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist-react/index.html'));
  });

  // Fallback for React routes (serves index.html for SPA routing)
  app.get('/about', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist-react/index.html'));
  });
  app.get('/cached', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist-react/index.html'));
  });
  app.get('/secret', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist-react/index.html'));
  });
  app.get('/websites', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist-react/index.html'));
  });
}

// Error handler
app.use((err, req, res, next) => {
    res.status(500).send({ error: err.message ? err.message : err });
});

// Initialize database connection
// This will be called when starting the server in bin/www
module.exports = {
    app,
    connectToDatabase,
};
