const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const { db } = require('../utils/mongoDb');
const { Schema } = mongoose;

const PersonSchema = new Schema({
  name:        { type: String, required: true },
  phoneNumber: { type: String, required: true },
  email:       { type: String, required: true },
  dropoffLocation: { type: String },
  pickupLocation:  { type: String }
}, { _id: false });

const PkgSchema = new Schema({
  category:    { type: String, required: true },
  type:        { type: String, enum: ['New','Used'], required: true },
  weight:      { type: Number, required: true, min: 0 },
  quantity:    { type: Number, required: true, min: 1 },
  description: { type: String },
}, { _id: false });

const PaymentSchema = new Schema({
  deliveryFee: { type: Number, required: true, min: 0 },
  isPaid: { type: Boolean, default: false },
}, { _id: false });

const ShipmentSchema = new Schema({
  _id:            { type: String, default: () => uuidv4() },
  customerUserId: { type: String, ref: 'User', required: true, index: true },

  sender:  { type: PersonSchema },
  receiver:{ type: PersonSchema, required: true },

  pkg:     { type: PkgSchema, required: true },
  payment: { type: PaymentSchema, required: true },

  shipmentStatus: {
    type: String,
    enum: ['pending','shipped','in_transit','delivered','need_attention', 'cancel', 'awaiting_payment'],
    default: 'pending',
    index: true
  }
}, {
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
  collection: 'shipments'
});

module.exports = db.model('Shipment', ShipmentSchema);
