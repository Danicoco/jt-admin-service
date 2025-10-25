const mongoose = require('mongoose');
const { Schema } = mongoose;

const ClicksSchema = new Schema({
  _id:        { type: String, required: true },
  views:      { type: Number, default: 0 },
  lastViewAt: { type: Date,   default: null },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

module.exports = mongoose.model('Clicks', ClicksSchema);
