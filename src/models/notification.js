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
  // delivery result from FCM, set when the notification is pushed
  push: {
    status: { type: String, enum: ['sent', 'skipped', 'failed'] },
    targeted: { type: Number, default: 0 },
    success: { type: Number, default: 0 },
    failure: { type: Number, default: 0 },
    error: { type: String },
  },
}, {
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
  collection: 'notifications'
});

module.exports = db.model('Notification', NotificationSchema);
