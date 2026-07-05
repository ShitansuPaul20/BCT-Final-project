const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  chat: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chat',
    required: true },
  content: {
    type: String,
    required: true },
  role: {
    type: String,
    enum: ['user', 'ai'],
    required: true },
  mermaidCode: {
    type: String,
    default: null },
  relatedTopics: {
    type: [String],
    default: [] },
});

const messageModel = mongoose.model('Message', messageSchema);

module.exports = messageModel;