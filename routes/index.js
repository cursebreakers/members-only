// index.js - Index router

const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const markdownIt = require('markdown-it')();

const authControl = require('../controllers/auth')
const User = require('../models/userModel')

const isAuthenticated = function(req, res, next) {
  // Passport.js adds isAuthenticated() to the request object
  if (req.isAuthenticated()) {
    return next(); // User is authenticated, proceed to next middleware
  }
  // User is not authenticated, redirect to login page or handle as needed
  res.redirect('/auth');
}


/* GET home/about page. */
router.get('/', function(req, res, next) {
  console.log('Request @root from:', req.ip);

  const readmePath = path.join(__dirname, '../README.md');
  fs.readFile(readmePath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading README.md:', err);
      return res.status(500).send('Error reading README.md');
    }
    
    const htmlContent = markdownIt.render(data);
    res.render('index', { title: 'Members Only', readmeContent: htmlContent });
  });
});

// GET sign-up form
router.get('/auth/new', function(req, res, next) {
  console.log('Request @onboarding from:', req.ip);
  res.render('onboarding', { title: 'Sign up:' });
});

// POST checks & sign-up, redir to dashboard
router.post('/auth/new', authControl.post_signup);

// GET login form
router.get('/auth', function(req, res, next) {
  console.log('Request @auth from:', req.ip);
  res.render('auth', { title: 'Log in:' });
});

// POST checks & login, redir to dashboard
router.post('/auth', authControl.auth_in);

// GET logout
router.get('/auth/out', authControl.auth_out);

// GET Puzzle page
router.get('/puzzle', isAuthenticated, function(req, res, next) {
  console.log('Request @puzzle from:', req.ip);
  res.render('puzzle', { title: 'Puzzle' });

});

// POST puzzle answer
router.post('/puzzle', isAuthenticated, async function(req, res, next) {
  console.log('Answer @puzzle from:', req.ip);

  const { puzzleInput } = req.body;
  const userId = req.user.id;

  // Check if user is admin
  if (req.user.membershipStatus.includes('admin')) {
    console.log('User is already an admin');
    return res.redirect('/dashboard');
  }

  // Check if user is a member
  if (!req.user.membershipStatus.includes('member')) {
    console.log('User is not a member yet');
    return res.render('puzzle', { error: 'Become a member by making 12 new posts to escalate your privelleges.' });
  }

  // Check if user answered correctly
  if (puzzleInput.toLowerCase() === 'admin') {
    // Update user's membership status in MongoDB to 'admin'
    try {
      await User.findByIdAndUpdate(userId, { $set: { membershipStatus: ['admin'] } });
      console.log('User promoted to admin:', userId);
      // Redirect to dashboard
      return res.redirect('/dashboard');
    } catch (error) {
      console.error('Error updating user status:', error);
      // Handle the error appropriately
      return res.redirect('/dashboard');
    }
  } else {
    console.log('Incorrect puzzle answer');
    // Render the puzzle page with an error message
    return res.render('puzzle', { error: 'Incorrect answer. Try again.' });
  }
});

module.exports = router;

