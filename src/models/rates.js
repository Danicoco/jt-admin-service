const mongoose = require("mongoose");
const { db } = require("../utils/mongoDb");
const { Schema } = mongoose;

const rateSchema = new Schema({
  type: {
    type: String,
    required: true,
    enum: ["giftcard", "sell-giftcard", "shipping", "crypto"],
  },
  name: {
    type: String,
    required: true, // e.g., Gift Card Name, Shipping Type, or Crypto Name
  },
  country: {
    type: String, // Only applicable for gift cards/shipping
    required: false,
  },
  state: {
    type: String, // For shipping
    required: false,
  },
  region: {
    type: String, // For shipping
    required: false,
  },
  category: {
    type: String, // e.g., Electronics for shipping
    required: false,
  },
  subCategory: {
    type: String, // e.g., Electronics for shipping
    required: false,
  },
  product: {
    type: String, // For shipping
    required: false,
  },
  weight: {
    type: Number, // For shipping
    required: false,
  },
  range: {
    min: { type: Number, required: false },
    max: { type: Number, required: false },
  },
  rate: {
    type: Number, // Rate in USD
    required: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  image: {
    type: "String"
  }
}, { timestamps: true });

const Rate = db.model("Rate", rateSchema);
module.exports = Rate;
