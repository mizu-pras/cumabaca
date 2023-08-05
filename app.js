const express = require('express');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const methodOverride = require('method-override')
const logger = require('morgan');
const cors = require('cors')

const indexRouter = require('./routes/index');
const getV2Router = require('./routes/get-v2');
const komikRouter = require('./routes/komik');

function errorHandler(err, req, res, next) {
    res.status(500)
    res.status(500).send({ error: err.message ? err.message : err })
}

const app = express();

app.use(logger('dev'));
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(methodOverride());

app.use(express.static("public"))

app.use('/', indexRouter);

app.use('/v2/get', getV2Router);
app.use('/komik', komikRouter)

app.use(errorHandler);

module.exports = app;
