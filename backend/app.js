const express = require('express');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const methodOverride = require('method-override');
const logger = require('morgan');
const cors = require('cors');
const path = require('path');

const { connectToDatabase } = require('./config/database');

const komikRouter = require('./routes/komik');
const adminRouter = require('./routes/admin');

const app = express();

// Middleware
app.use(logger('dev'));

// CORS configuration with environment-based multiple origins
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',')
  : ['http://localhost:5173'];

app.use(cors({
  origin: function(origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(methodOverride());
app.use(express.static('public'));

// API Routes
app.use('/komik', komikRouter);
app.use('/admin', adminRouter);

// Serve React static assets in production
if (process.env.NODE_ENV === 'production') {
  // Serve React assets at /assets/ to match Vite build paths
  app.use('/assets', express.static(path.join(__dirname, 'dist-react/assets')));

  // Serve React app for all routes (SPA)
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
    console.error('Error:', err);
    res.status(500).send({ error: err.message ? err.message : err });
});

// Initialize database connection
// This will be called when starting the server in bin/www
module.exports = {
    app,
    connectToDatabase,
};
