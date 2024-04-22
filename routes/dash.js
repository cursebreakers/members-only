// dash.js - Dashboard router

const express = require('express');
const expressAsyncHandler = require('express-async-handler');
const router = express.Router();
const passport = require('passport');
const User = require('../models/userModel')
const Message = require('../models/messageModel')
const ArchiveMessage = require('../models/archiveModel');


const isAuthenticated = function(req, res, next) {
  // Passport.js adds isAuthenticated() to the request object
  if (req.isAuthenticated()) {
      return next(); // User is authenticated, proceed to next middleware
  }
  // User is not authenticated, redirect to login page
  res.redirect('/auth');
}

// GET Dashboard
router.get('/', isAuthenticated, expressAsyncHandler(async (req, res, next) => {
  try {
      console.log('Request @dashboard from:', req.ip);
      console.log('Fetching dashboard content...');

      const userData = await User.findById(req.user.id);

      const messages = await Message.find({});
      

      console.log('Content fetched!', userData, messages);
      console.log('Rendering Dashboard...');
      res.render('dash', { title: 'Dashboard', userData, user: req.user, messages });
    } catch (error) {
      // Handle errors appropriately
      console.error('Error fetching dashboard content:', error);
      next(error); // Pass the error to the error handling middleware
  }
}));


// GET new message form
router.get('/messages', isAuthenticated, function(req, res, next) {
  console.log('Request @messages from:', req.ip);
  console.log('Drafting new message...')
  res.render('new', { title: "New Message"});
});

// POST new message
router.post('/messages', isAuthenticated, async function(req, res, next) {
  console.log('POST Request @messages from:', req.ip);

  const { title, content } = req.body;
  const username = req.user.username;

  try {
    const newMessage = new Message({
      title,
      content,
      username
    });

    await newMessage.save();

    console.log('Message posted successfully');

    const userId = req.user.id;
    await User.findByIdAndUpdate(userId, { $inc: { messageCount: 1 } });

    const user = await User.findById(userId);
    if (
      user.messageCount >= 12 &&
      user.membershipStatus.includes('user') &&
      !user.membershipStatus.includes('member') &&
      !user.membershipStatus.includes('admin')
    ) {
      await User.findByIdAndUpdate(userId, { $set: { membershipStatus: ['member'] } }); // Replace status with 'member'
      console.log('User promoted to member:', userId);
    }

    res.redirect('/dashboard');
  } catch (error) {
    console.error('Error posting message:', error);
    res.redirect('/dashboard');
  }
});


// POST to delete a message
router.post('/messages/delete', isAuthenticated, async function(req, res, next) {
  try {
    const messageId = req.body.messageId;
    const userId = req.user.id;


    // Check if the user is an admin
    const userData = await User.findById(userId);
    if (!userData || !userData.membershipStatus.includes('admin')) {
      // User is not an admin, handle unauthorized access (e.g., redirect or error response)
      return res.status(403).send('Unauthorized access');
    }

    console.log('Deleting message', messageId, " by admin ", userId);

    // Delete the message based on messageId and userId
    const messageToDelete = await Message.findById(messageId);

    if (!messageToDelete) {
      // Message not found or not authorized to delete this message
      return res.status(404).send('Message not found');
    }

    // Move the message to the archive collection
    const archivedMessage = new ArchiveMessage({
      title: messageToDelete.title,
      timestamp: messageToDelete.timestamp,
      content: messageToDelete.content,
      username: messageToDelete.username,
    });
    await archivedMessage.save();

    // Now that the message is archived, delete it from the original collection
    await Message.findByIdAndDelete(messageId);
    console.log('Message archived and deleted successfully:', archivedMessage);
    // Redirect or send a success response, depending on your application flow
    res.redirect('/dashboard');
  } catch (error) {
    console.error('Error deleting message:', error);
    // Handle the error appropriately, such as rendering an error page or redirecting with a flash message
    res.redirect('/dashboard');
  }
});

// GET clear message confirmation
router.get(`/messages/delete-all`, isAuthenticated, async function(req, res, next) {
  try {
    const userId = req.user.id;
    const userData = await User.findById(userId);
    if (!userData || !userData.membershipStatus.includes('admin')) {
      return res.status(403).send('Unauthorized access');
    }

    console.log('Deleting all messages. By admin:', userId);
    res.render('clear', { title: "Delete all"})

  } catch (error) {
    console.error('Error deleting messages:', error);
    // Handle the error appropriately, such as rendering an error page or redirecting with a flash message
    res.redirect('/dashboard');
  }

});

// POST delete all request
router.post(`/messages/delete-all`, isAuthenticated, async function(req, res, next) {
  try {

    const userId = req.user.id;
    const userData = await User.findById(userId);
    if (!userData || !userData.membershipStatus.includes('admin')) {
      return res.status(403).send('Unauthorized access');
    }

    const messagesToArchive = await Message.find({}); 

    if (messagesToArchive.length > 0) {
      await ArchiveMessage.insertMany(messagesToArchive); 
      await Message.deleteMany({}); 
      console.log('All messages moved to archive by admin:', userId);
    }
   
    console.log('Deletion confirmed by admin:', userId);
    res.redirect('/dashboard');

    } catch (error) {
    console.error('Error deleting messages:', error);
    res.redirect('/dashboard');
  }
});


module.exports = router;
