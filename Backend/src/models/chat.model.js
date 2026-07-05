const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true },
  title: { 
    type: String, 
    required: true },
  createdAt: { 
    type: Date, 
    default: Date.now },
  updatedAt: { 
    type: Date, 
    default: Date.now },
},{ timestamps: true });

const chatModel = mongoose.model('Chat', chatSchema);

module.exports = chatModel;
