const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");
const { db } = require("../utils/mongoDb");
const { Schema } = mongoose;

const MatchSchema = new Schema(
  {
    userId: { type: String, required: true },
    // how we found them: when they submitted their BVN, or when the BVN was added
    source: { type: String, enum: ["bvn_submission", "watchlist_added", "watchlist_refresh", "nibss_flag"] },
    matchedAt: { type: Date, default: Date.now },
    flagged: { type: Boolean, default: false },
  },
  { _id: false },
);

const BvnWatchlistSchema = new Schema(
  {
    _id: { type: String, default: () => uuidv4() },
    bvn: { type: String, required: true, unique: true, match: /^\d{11}$/ },
    name: { type: String, trim: true },
    reason: { type: String, trim: true },
    // nibss: added automatically when Prembly reports the BVN as NIBSS-watchlisted
    source: { type: String, enum: ["manual", "csv", "nibss"], default: "manual" },
    addedBy: { type: String },
    // users on our system whose wallet carries this BVN
    onSystem: { type: Boolean, default: false, index: true },
    matches: { type: [MatchSchema], default: [] },
    lastCheckedAt: { type: Date },
  },
  { timestamps: true, collection: "bvn_watchlist" },
);

const BvnWatchlist = db.model("BvnWatchlist", BvnWatchlistSchema);

module.exports = { BvnWatchlist };
