// messageModel.js - Message schema

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const messageSchema = new Schema({
  title: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  content: { type: String, required: true },
  username: { type: String, required: true }
});

const Message = mongoose.model('Message', messageSchema, 'messages');

module.exports = Message;