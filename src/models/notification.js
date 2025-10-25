const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const { db } = require('../utils/mongoDb');
const { Schema } = mongoose;

const NotificationSchema = new Schema({
  _id: {
    type: String,
    default: () => uuidv4(),
  },
  title: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  message: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    enum: ['order','shipping','system','custom'],
    default: 'custom',
    index: true,
  },
  isRead: {
    type: Boolean,
    default: false,
  },
  device: {
    type: [String],
  },
}, {
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
  collection: 'notifications'
});

module.exports = db.model('Notification', NotificationSchema);
