const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");
const { db } = require("../utils/mongoDb");
const { Schema } = mongoose;

const CategorySchema = new Schema(
  {
    _id: {
      type: String,
      default: () => uuidv4(),
    },
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      default: null,
      trim: true,
    },
    image: {
      type: [String],
      default: [],
    },
    subcategory: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
    collection: "category",
  }
);

module.exports = db.model("Category", CategorySchema);
