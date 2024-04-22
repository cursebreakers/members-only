// auth.js - Authentication controller

// Require packahes and middlewate
const asyncHandler = require('express-async-handler');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

// Require mongodb schema
const User = require('../models/userModel');


// Configure passport
passport.use(new LocalStrategy(async function(username, password, done) {
    try {
        const user = await User.findOne({ $or: [{ email: username }, { username: username }] });
        if (!user) {
            return done(null, false, { message: 'Incorrect username or email.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return done(null, false, { message: 'Incorrect password.' });
        }

        return done(null, user);
    } catch (error) {
        return done(error);
    }
}));


passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(async function(id, done) {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (error) {
        done(error);
    }
});


// Login POST
exports.auth_in = asyncHandler(async (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
        if (err) {
            return next(err);
        }
        if (!user) {
            req.flash('error', 'Incorrect username or password.'); // Store generic error message in flash
            return res.render('auth', { title: "Log in", errors: req.flash('error')}); // Redirect back to login page
        }
        req.logIn(user, async function(err) {
            if (err) {
                return next(err);
            }
            // Redirect to the dashboard upon successful login
            return res.redirect('/dashboard');
        });
    })(req, res, next);
});


// Signup POST
exports.post_signup = asyncHandler(async (req, res, next) => {
    const { firstName, lastName, username, email, password, confirmPassword } = req.body;

    const errors = [];

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      errors.push('Invalid email format.');
    }
  
    // Check if username or email already exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      errors.push('Email or username is already taken.');
    }
  
    // Validate password integrity
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
    if (!passwordRegex.test(password)) {
      errors.push('Password must be at least 8 characters long and contain both letters and numbers.');
    }

    if (password !== confirmPassword) {
        errors.push('Passwords do not match.');
    }
  
    // If there are validation errors, render the signup page with error messages
    if (errors.length > 0) {
      return res.render('onboarding', { errors });
    }
  
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
  
    // Create a new user
    const newUser = new User({
      name: { first: firstName, last: lastName },
      username,
      email,
      password: hashedPassword,
      membershipStatus: ['user']
    });
  
    // Save the new user to the database
    await newUser.save();

    req.logIn(newUser, async function(err) {
        if (err) {
            return next(err);
        }
        // Redirect to the dashboard upon successful signup and login
        res.redirect('/dashboard');
    });
});


// GET user logout
exports.auth_out = asyncHandler(async (req, res, next) => {
    req.logout(function(err) {
        if (err) {
            return next(err);
        }
        console.log('User logged out. Redirecting...');
        res.render('out', { title: "Later!"});
    });
});


module.exports = {
    passport: exports.passport,
    post_signup: exports.post_signup,
    auth_out: exports.auth_out,
    auth_in: exports.auth_in
}