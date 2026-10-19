const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");
const { db } = require("../utils/mongoDb");
const { Schema } = mongoose;

const AUDIENCES = ["all", "verified", "unverified", "phone_verified"];

const EmailCampaignSchema = new Schema(
  {
    _id: { type: String, default: () => uuidv4() },
    subject: { type: String, required: true, trim: true },
    preheader: { type: String, trim: true, default: "" },
    content: { type: String, required: true },
    audience: { type: String, enum: AUDIENCES, default: "all" },
    status: {
      type: String,
      enum: ["draft", "sending", "sent", "partially_sent", "failed"],
      default: "draft",
      index: true,
    },
    stats: {
      total: { type: Number, default: 0 },
      sent: { type: Number, default: 0 },
      failed: { type: Number, default: 0 },
    },
    lastError: { type: String },
    createdBy: { type: String },
    sentBy: { type: String },
    startedAt: { type: Date },
    sentAt: { type: Date },
  },
  {
    timestamps: true,
    collection: "email_campaigns",
  },
);

const EmailCampaign = db.model("EmailCampaign", EmailCampaignSchema);

module.exports = { EmailCampaign, AUDIENCES };
