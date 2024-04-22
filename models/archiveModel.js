// archiveModel.js - Archive schema

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const archiveSchema = new Schema({
  title: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  content: { type: String, required: true },
  username: { type: String, required: true }
});

const ArchiveMessage = mongoose.model('ArchiveMessage', archiveSchema, 'archive');

module.exports = ArchiveMessage;