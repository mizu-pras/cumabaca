const express = require('express');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const methodOverride = require('method-override');
const logger = require('morgan');
const cors = require('cors');

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

// Error handler
app.use((err, req, res, next) => {
    res.status(500).send({ error: err.message ? err.message : err });
});

module.exports = app;
