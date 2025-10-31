const mongoose = require("mongoose");
const { db } = require("../utils/mongoDb");
const { Schema } = mongoose;

const PlatformRateSchema = new Schema({
  baseCurrency: {
    type: String,
    required: true,
    default: "USD"
  },
  quoteCurrency: {
    type: String,
    required: true,
    default: "NGN"
  },
  rate: {
    type: Number,
    required: true,
    default: 1500
  },
}, { timestamps: true });

const PlatformRate = db.model("PlatformRate", PlatformRateSchema);
module.exports = PlatformRate;
