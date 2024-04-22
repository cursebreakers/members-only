// app.js

// Require packages
const createError = require('http-errors');
const crypto = require('crypto');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const asyncHandler = require('express-async-handler');
const flash = require('connect-flash');
const passport = require('passport');
const session = require('express-session');
const LocalStrategy = require('passport-local').Strategy;
const MongoDBStore = require('connect-mongodb-session')(session);

const bcrypt = require('bcryptjs');

require('dotenv').config();

// Require routers 
const indexRouter = require('./routes/index');
const dashRouter = require('./routes/dash');
// Require controllers
const { connectDB } = require('./controllers/mongo');

// Initialize network components
const store = new MongoDBStore({
  uri: process.env.MONGODB_URI,
  collection: 'sessions'
});

store.on('error', function(error) {
  console.error('Session store error:', error);
});

async function networkChecks() {
  await connectDB();
  // Any other setup calls to API's, DB's or networks etc...
  console.log('Network checks: OK')
}

console.log('Waiting for network...')
networkChecks()

// Initialize Express application
const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// Initialize Passport.js
const secretKey = crypto.randomBytes(32).toString('hex');

app.use(session({
  secret: secretKey,
  resave: false,
  saveUninitialized: false,
  store: store
}));

app.use(passport.initialize());
app.use(passport.session());

app.use(flash());
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/dashboard', dashRouter);


console.log('App running @ http://localhost:6969')

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
