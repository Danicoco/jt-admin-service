const { Schema } = require('mongoose');
const { db } = require('../utils/mongoDb');

const SkuCounterSchema = new Schema({
  _id:   { type: String, required: true }, 
  seq:   { type: Number, default: 0 },
}, { versionKey: false });

module.exports = db.model('SkuCounter', SkuCounterSchema);
