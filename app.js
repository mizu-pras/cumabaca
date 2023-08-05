const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const methodOverride = require('method-override')
const logger = require('morgan');
const cors = require('cors')

const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const getRouter = require('./routes/get');
const getV2Router = require('./routes/get-v2');

function clientErrorHandler(err, req, res, next) {
    if (req.xhr) {
        res.status(500).send({ error: 'Something failed!' })
    } else {
        next(err)
    }
}

function errorHandler(err, req, res, next) {
    res.status(500)
    res.status(500).send({ error: err })
}

const app = express();

app.use(logger('dev'));
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(methodOverride());
app.use(clientErrorHandler);
app.use(errorHandler);

app.use(express.static("public"))

app.use('/', indexRouter);
app.use('/users', usersRouter);

app.use('/get', getRouter);
app.use('/v2/get', getV2Router);

module.exports = app;
