const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");
const { db } = require("../utils/mongoDb");
const { Schema } = mongoose;

const SEVERITIES = ["low", "medium", "high"];

// Admin-editable settings for one rule. Rule logic lives in the wallet
// service; this only stores overrides of its defaults.
const MonitoringRuleSchema = new Schema(
  {
    _id: { type: String }, // rule key, e.g. "pass_through"
    enabled: { type: Boolean, default: true },
    action: { type: String, enum: ["alert", "hold"], default: "alert" },
    severity: { type: String, enum: SEVERITIES },
    params: { type: Schema.Types.Mixed, default: {} },
    // { unverified: {...}, bvn_verified: {...} }
    tierOverrides: { type: Schema.Types.Mixed, default: {} },
    updatedBy: { type: String },
  },
  { timestamps: true, minimize: false, collection: "monitoring_rules" },
);

const MonitoringSettingsSchema = new Schema(
  {
    _id: { type: String, default: "global" },
    holdTimeoutMinutes: { type: Number, default: 120, min: 5, max: 10080 },
    onHoldTimeout: { type: String, enum: ["release", "reject", "keep"], default: "release" },
    reviewSlaHours: { type: Number, default: 24, min: 1, max: 720 },
    notifyEmail: { type: String, default: "jamestown.ng@gmail.com" },
    notifyMinSeverity: { type: String, enum: [...SEVERITIES, "off"], default: "high" },
    updatedBy: { type: String },
  },
  { timestamps: true, collection: "monitoring_settings" },
);

const NoteSchema = new Schema(
  { by: String, text: String, at: { type: Date, default: Date.now } },
  { _id: false },
);

const AlertSchema = new Schema(
  {
    _id: { type: String, default: () => uuidv4() },
    // rule + user + window; stops the same finding alerting twice
    dedupeKey: { type: String, required: true, unique: true },
    ruleKey: { type: String, required: true, index: true },
    ruleName: { type: String },
    severity: { type: String, enum: SEVERITIES, index: true },
    stage: { type: String, enum: ["pre", "post"] },
    action: { type: String, enum: ["alert", "hold"], default: "alert" },
    outcome: { type: String }, // completed | held (pre-transaction alerts)
    tier: { type: String },
    userId: { type: String, required: true, index: true },
    customer: { firstName: String, lastName: String, email: String, phoneNumber: String },
    summary: { type: String },
    data: { type: Schema.Types.Mixed },
    transactionRefs: { type: [String], default: [] },
    // the same finding seen again (e.g. a 4th withdrawal the same day)
    hitCount: { type: Number, default: 1 },
    lastSeenAt: { type: Date },
    hold: {
      txnId: String,
      reference: String,
      kind: { type: String, enum: ["bank_payout", "crypto_send"] },
      amount: Number,
      coin: String,
      state: { type: String, enum: ["held", "released", "rejected", "failed"] },
      resolvedBy: String,
      resolvedAt: Date,
      reason: String,
    },
    status: {
      type: String,
      enum: ["open", "in_review", "dismissed", "escalated", "resolved"],
      default: "open",
      index: true,
    },
    assignee: { type: String, index: true },
    dueAt: { type: Date, index: true },
    resolution: { type: String },
    resolvedBy: { type: String },
    resolvedAt: { type: Date },
    caseId: { type: String, index: true },
    notes: { type: [NoteSchema], default: [] },
  },
  { timestamps: true, collection: "monitoring_alerts" },
);
AlertSchema.index({ status: 1, createdAt: -1 });
AlertSchema.index({ "hold.txnId": 1 }, { sparse: true });

const CaseSchema = new Schema(
  {
    _id: { type: String, default: () => uuidv4() },
    title: { type: String, required: true },
    userId: { type: String, required: true, index: true },
    customer: { firstName: String, lastName: String, email: String, phoneNumber: String },
    alertIds: { type: [String], default: [] },
    status: { type: String, enum: ["open", "closed"], default: "open", index: true },
    outcome: { type: String, enum: ["no_action", "account_restricted", "reported", "other"] },
    assignee: { type: String },
    notes: { type: [NoteSchema], default: [] },
    createdBy: { type: String },
    closedBy: { type: String },
    closedAt: { type: Date },
  },
  { timestamps: true, collection: "monitoring_cases" },
);

// Every admin decision in monitoring, for regulators and internal review.
const AuditLogSchema = new Schema(
  {
    _id: { type: String, default: () => uuidv4() },
    actor: { type: String, required: true },
    action: { type: String, required: true, index: true },
    targetType: { type: String },
    targetId: { type: String, index: true },
    details: { type: Schema.Types.Mixed },
    at: { type: Date, default: Date.now, index: true },
  },
  { versionKey: false, collection: "monitoring_audit_log" },
);

module.exports = {
  SEVERITIES,
  MonitoringRule: db.model("MonitoringRule", MonitoringRuleSchema),
  MonitoringSettings: db.model("MonitoringSettings", MonitoringSettingsSchema),
  Alert: db.model("MonitoringAlert", AlertSchema),
  Case: db.model("MonitoringCase", CaseSchema),
  AuditLog: db.model("MonitoringAuditLog", AuditLogSchema),
};
