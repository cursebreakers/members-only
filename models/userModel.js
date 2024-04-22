 // userModel.js - User schema

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
  name: {
    type: {
      first: { type: String, required: true },
      last: { type: String, required: true }
    },
    required: true
  },
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  membershipStatus: {
    type: [String],
    enum: ['user', 'member', 'admin'],
    default: ['user']
  },
  messageCount: {
    type: Number,
    default: 0
  }
});

const User = mongoose.model('User', userSchema, 'users');

module.exports = User;