const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");
const { db } = require("../utils/mongoDb");
const { Schema } = mongoose;

const BannerSchema = new Schema(
  {
    _id: {
      type: String,
      default: () => uuidv4(),
    },
    title: {
      type: String,
      required: true,
      index: true
    },
    description: {
      type: String,
      default: null,
      trim: true,
    },
    isActive: {
      type: Boolean,
    },
    color: {
      type: String,
    },
    position: {
      type: String,
    },
    section: {
      type: String,
    },
    actionUrl: {
        type: String
    }
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
    collection: "banners",
  }
);

module.exports = db.model("Banner", BannerSchema);
