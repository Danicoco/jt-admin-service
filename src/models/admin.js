const mongoose = require('mongoose');
const { db } = require('../utils/mongoDb');

const AdminSchema = new mongoose.Schema({
  _id: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  phoneNumber: String,
  role: {
    type: String,
    required: true,
  },
  firstName: { type: String, required: true },
  roleId: { type: String, required: true, ref: 'Role' },
  lastName:  { type: String, required: true },
  password:  { type: String, required: true },
  location:  String,
  isVerified:{ type: Boolean, default: false },
  isActive:  { type: Boolean, default: false },
  photoUrl:    { type: String, default: null },
}, {
  timestamps: true,
});

module.exports = db.model('Admin', AdminSchema);
