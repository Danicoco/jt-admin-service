const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");
const { db } = require("../utils/mongoDb");
const { Schema } = mongoose;

const DropOffSchema = new Schema(
  {
    _id: { type: String, default: () => uuidv4() },
    customerUserId: { type: String, ref: "User", required: true, index: true },
    user: { type: "Map" },
    courier: { type: "String", required: true },
    trackingNumber: { type: "String", required: true },
    description: { type: "String" },
    deliveryFee: { type: "Number" },
    file: { type: "String" },
    isPaid: { type: "Boolean", default: false },
    status: {
      type: "String",
      default: "pending",
      enum: [
        "pending",
        "shipped",
        "in_transit",
        "delivered",
        "need_attention",
        "cancel",
        "awaiting_payment",
      ],
    },
    paid: { type: "Boolean", default: false },
  },
  {
    timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" },
    collection: "dropoffs",
  }
);

module.exports = db.model("DropOff", DropOffSchema);
