const { MonitoringRule, MonitoringSettings, Alert, Case, AuditLog, SEVERITIES } = require("../models/monitoring");
const {
  monitoringCatalog,
  simulateRule,
  customerLedger,
  listHolds,
  releaseHold,
  rejectHold,
  rescanCustomer,
  notifyMonitoringConfigChanged,
  batchUsers,
  setUserStatus,
} = require("./userService");
const { SendEmail } = require("./zeptomail");
const monitoringAlertTemplate = require("../utils/emails/monitoringAlert");

const HOUR = 60 * 60 * 1000;
const SEVERITY_RANK = { low: 1, medium: 2, high: 3 };
const TIERS = ["unverified", "bvn_verified"];

const err = (status, message) => Object.assign(new Error(message), { status });

async function audit(actor, action, targetType, targetId, details) {
  await AuditLog.create({ actor, action, targetType, targetId, details }).catch((e) =>
    console.error("monitoring audit write failed:", e.message),
  );
}

// ------------------------------------------------------------------ settings
async function getSettings() {
  const doc = await MonitoringSettings.findById("global").lean();
  return doc || (await MonitoringSettings.create({ _id: "global" })).toObject();
}

async function updateSettings(body, actor) {
  const allowed = ["holdTimeoutMinutes", "onHoldTimeout", "reviewSlaHours", "notifyEmail", "notifyMinSeverity"];
  const set = Object.fromEntries(Object.entries(body).filter(([k]) => allowed.includes(k)));
  const before = await getSettings();
  const doc = await MonitoringSettings.findOneAndUpdate(
    { _id: "global" },
    { $set: { ...set, updatedBy: actor } },
    { new: true, upsert: true, runValidators: true },
  ).lean();
  await audit(actor, "settings.update", "settings", "global", { before: pick(before, allowed), after: pick(doc, allowed) });
  notifyMonitoringConfigChanged();
  return doc;
}

const pick = (o, keys) => Object.fromEntries(keys.map((k) => [k, o?.[k]]));

// ------------------------------------------------------------------ rules
/** Rule catalog from the wallet service merged with stored admin settings. */
async function listRules() {
  const [{ rules: catalog }, stored] = await Promise.all([monitoringCatalog(), MonitoringRule.find({}).lean()]);
  const byKey = new Map(stored.map((r) => [r._id, r]));
  return catalog.map((c) => {
    const s = byKey.get(c.key) || {};
    return {
      ...c,
      enabled: s.enabled ?? c.defaults.enabled,
      action: c.supportsHold ? s.action || c.defaults.action : "alert",
      severity: s.severity || c.defaults.severity,
      params: { ...c.defaults.params, ...(s.params || {}) },
      tierOverrides: s.tierOverrides || {},
      updatedBy: s.updatedBy || null,
      updatedAt: s.updatedAt || null,
    };
  });
}

function cleanParams(catalogRule, params) {
  const out = {};
  for (const [k, v] of Object.entries(params || {})) {
    if (!(k in catalogRule.defaults.params)) continue;
    if (v === "" || v === null || v === undefined) continue;
    const n = Number(v);
    if (!Number.isFinite(n) || n < 0) throw err(400, `${k} must be a non-negative number`);
    out[k] = n;
  }
  return out;
}

async function updateRule(key, body, actor) {
  const rules = await listRules();
  const current = rules.find((r) => r.key === key);
  if (!current) throw err(404, "Rule not found");

  const set = { updatedBy: actor };
  if (body.enabled !== undefined) set.enabled = Boolean(body.enabled);
  if (body.action !== undefined) {
    if (!["alert", "hold"].includes(body.action)) throw err(400, "action must be alert or hold");
    if (body.action === "hold" && !current.supportsHold) throw err(400, "This rule can only raise alerts");
    set.action = body.action;
  }
  if (body.severity !== undefined) {
    if (!SEVERITIES.includes(body.severity)) throw err(400, "severity must be low, medium or high");
    set.severity = body.severity;
  }
  if (body.params !== undefined) set.params = cleanParams(current, body.params);
  if (body.tierOverrides !== undefined) {
    set.tierOverrides = {};
    for (const tier of TIERS) {
      const p = cleanParams(current, body.tierOverrides?.[tier]);
      if (Object.keys(p).length) set.tierOverrides[tier] = p;
    }
  }

  await MonitoringRule.updateOne({ _id: key }, { $set: set }, { upsert: true });
  const after = (await listRules()).find((r) => r.key === key);
  await audit(actor, "rule.update", "rule", key, {
    before: pick(current, ["enabled", "action", "severity", "params", "tierOverrides"]),
    after: pick(after, ["enabled", "action", "severity", "params", "tierOverrides"]),
  });
  notifyMonitoringConfigChanged();
  return after;
}

async function simulate(key, body) {
  const rules = await listRules();
  const current = rules.find((r) => r.key === key);
  if (!current) throw err(404, "Rule not found");
  return simulateRule({
    ruleKey: key,
    params: body.params ? cleanParams(current, body.params) : current.params,
    tierOverrides: body.tierOverrides || current.tierOverrides,
    days: body.days || 30,
  });
}

/** Config consumed by the wallet service's engine. */
async function engineConfig() {
  const [stored, settings] = await Promise.all([MonitoringRule.find({}).lean(), getSettings()]);
  return {
    rules: stored.map((r) => ({
      key: r._id,
      enabled: r.enabled,
      action: r.action,
      severity: r.severity,
      params: r.params || {},
      tierOverrides: r.tierOverrides || {},
    })),
    settings: { holdTimeoutMinutes: settings.holdTimeoutMinutes, onHoldTimeout: settings.onHoldTimeout },
  };
}

// ------------------------------------------------------------------ alerts
/**
 * Store alerts sent by the wallet service. Each is de-duplicated on
 * rule + user + window; returns only newly created alerts.
 */
async function ingestAlerts(alerts = []) {
  if (!alerts.length) return [];
  const [settings, catalog, users] = await Promise.all([
    getSettings(),
    monitoringCatalog().catch(() => ({ rules: [] })),
    batchUsers([...new Set(alerts.map((a) => a.userId))]),
  ]);
  const names = new Map(catalog.rules.map((r) => [r.key, r.name]));

  const created = [];
  for (const a of alerts) {
    const u = users[a.userId] || {};
    const dedupeKey = `${a.ruleKey}:${a.userId}:${a.windowKey}`;
    const doc = {
      dedupeKey,
      ruleKey: a.ruleKey,
      ruleName: names.get(a.ruleKey) || a.ruleKey,
      severity: SEVERITIES.includes(a.severity) ? a.severity : "medium",
      stage: a.stage,
      action: a.action === "hold" ? "hold" : "alert",
      outcome: a.outcome,
      tier: a.tier,
      userId: a.userId,
      customer: { firstName: u.firstName, lastName: u.lastName, email: u.email, phoneNumber: u.phoneNumber },
      ...(a.hold && { hold: { ...a.hold, state: "held" } }),
      dueAt: new Date(Date.now() + settings.reviewSlaHours * HOUR),
    };
    // a repeat of the same finding refreshes the existing alert instead of
    // creating another one
    const res = await Alert.updateOne(
      { dedupeKey },
      {
        $setOnInsert: doc,
        $set: { summary: a.summary, data: a.data, lastSeenAt: new Date() },
        $addToSet: { transactionRefs: { $each: a.transactionRefs || [] } },
        $inc: { hitCount: 1 },
      },
      { upsert: true },
    );
    if (res.upsertedCount) {
      created.push({ ...doc, summary: a.summary, _id: res.upsertedId });
    }
  }

  // email compliance about new alerts at or above the configured severity
  const min = SEVERITY_RANK[settings.notifyMinSeverity];
  const notify = min ? created.filter((a) => SEVERITY_RANK[a.severity] >= min) : [];
  if (notify.length && settings.notifyEmail) {
    SendEmail(
      { email: settings.notifyEmail, firstName: "Jamestown", lastName: "Compliance" },
      `Transaction monitoring: ${notify.length} new ${notify.length === 1 ? "alert" : "alerts"}${notify.some((a) => a.action === "hold") ? " (payment held)" : ""}`,
      monitoringAlertTemplate({ alerts: notify, holdTimeoutMinutes: settings.holdTimeoutMinutes, onHoldTimeout: settings.onHoldTimeout }),
    ).catch((e) => console.error("monitoring alert email failed:", e));
  }
  return created;
}

const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

async function listAlerts(q) {
  const page = Math.max(parseInt(q.page || "1", 10), 1);
  const limit = Math.min(Math.max(parseInt(q.limit || "20", 10), 1), 100);
  const filter = {};
  if (q.status === "active") filter.status = { $in: ["open", "in_review"] };
  else if (q.status && q.status !== "all") filter.status = q.status;
  if (q.severity) filter.severity = q.severity;
  if (q.ruleKey) filter.ruleKey = q.ruleKey;
  if (q.userId) filter.userId = q.userId;
  if (q.assignee) filter.assignee = q.assignee;
  if (q.held === "true") filter["hold.state"] = "held";
  if (q.overdue === "true") {
    filter.dueAt = { $lt: new Date() };
    filter.status = { $in: ["open", "in_review"] };
  }
  if (q.search) {
    const re = new RegExp(escapeRegex(q.search.trim()), "i");
    filter.$or = [{ "customer.firstName": re }, { "customer.lastName": re }, { "customer.email": re }, { summary: re }, { transactionRefs: re }];
  }
  const [alerts, total] = await Promise.all([
    Alert.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    Alert.countDocuments(filter),
  ]);
  return { page, limit, total, alerts };
}

async function getAlert(id) {
  const alert = await Alert.findById(id).lean();
  if (!alert) throw err(404, "Alert not found");
  const [related, caseDoc] = await Promise.all([
    Alert.find({ userId: alert.userId, _id: { $ne: id } }).sort({ createdAt: -1 }).limit(10).select("ruleName severity status summary createdAt").lean(),
    alert.caseId ? Case.findById(alert.caseId).select("title status").lean() : null,
  ]);
  return { ...alert, related, case: caseDoc };
}

const ACTIVE = ["open", "in_review"];

async function updateAlert(id, body, actor) {
  const alert = await Alert.findById(id);
  if (!alert) throw err(404, "Alert not found");
  const changes = {};

  if (body.assignee !== undefined) {
    alert.assignee = body.assignee === "me" ? actor : body.assignee || null;
    changes.assignee = alert.assignee;
  }
  if (body.status !== undefined) {
    if (!["open", "in_review", "dismissed", "resolved"].includes(body.status)) throw err(400, "Invalid status");
    if (["dismissed", "resolved"].includes(body.status)) {
      if (!body.resolution?.trim()) throw err(400, "Give a reason when dismissing or resolving an alert");
      if (alert.hold?.state === "held") throw err(400, "Release or reject the held payment first");
      alert.resolution = body.resolution.trim();
      alert.resolvedBy = actor;
      alert.resolvedAt = new Date();
    }
    alert.status = body.status;
    changes.status = body.status;
  }
  if (body.note?.trim()) {
    alert.notes.push({ by: actor, text: body.note.trim() });
    changes.note = body.note.trim();
  }
  await alert.save();
  await audit(actor, "alert.update", "alert", id, changes);
  return alert.toObject();
}

/** Release or reject the payment held by an alert. */
async function actOnHold(id, decision, actor, reason) {
  const alert = await Alert.findById(id).lean();
  if (!alert) throw err(404, "Alert not found");
  if (!alert.hold?.txnId) throw err(400, "This alert has no held payment");
  if (alert.hold.state !== "held") throw err(409, `Payment already ${alert.hold.state}`);
  if (decision === "reject" && !reason?.trim()) throw err(400, "Give a reason for rejecting");

  let result;
  try {
    result = decision === "release" ? await releaseHold(alert.hold.txnId, actor) : await rejectHold(alert.hold.txnId, actor, reason);
  } catch (e) {
    const status = e.response?.status;
    throw err(status && status < 500 ? status : 502, e.response?.data?.message || "Could not reach the wallet service");
  }
  await applyHoldUpdate({ txnId: alert.hold.txnId, state: result.state, by: actor, reason });
  await audit(actor, `hold.${decision}`, "alert", id, { txnId: alert.hold.txnId, state: result.state, reason, message: result.message });
  return { ...result, alert: await Alert.findById(id).lean() };
}

/** Record a hold outcome on every alert pointing at that transaction. */
async function applyHoldUpdate({ txnId, state, by, reason }) {
  const set = { "hold.state": state, "hold.resolvedBy": by, "hold.resolvedAt": new Date(), "hold.reason": reason || null };
  await Alert.updateMany({ "hold.txnId": txnId }, { $set: set });
  if (by === "auto") {
    const alerts = await Alert.find({ "hold.txnId": txnId }).select("_id").lean();
    for (const a of alerts) await audit("auto", `hold.auto_${state}`, "alert", a._id, { txnId, reason });
  }
}

// ------------------------------------------------------------------ cases
async function escalate(alertId, body, actor) {
  const alert = await Alert.findById(alertId);
  if (!alert) throw err(404, "Alert not found");

  let c = body.caseId
    ? await Case.findById(body.caseId)
    : await Case.findOne({ userId: alert.userId, status: "open" }).sort({ createdAt: -1 });
  if (!c) {
    c = await Case.create({
      title: body.title?.trim() || `${alert.customer?.firstName || ""} ${alert.customer?.lastName || ""}: ${alert.ruleName}`.trim(),
      userId: alert.userId,
      customer: alert.customer,
      createdBy: actor,
      assignee: actor,
    });
    await audit(actor, "case.create", "case", c._id, { fromAlert: alertId });
  }
  if (!c.alertIds.includes(alertId)) c.alertIds.push(alertId);
  if (body.note?.trim()) c.notes.push({ by: actor, text: body.note.trim() });
  await c.save();

  alert.status = "escalated";
  alert.caseId = c._id;
  await alert.save();
  await audit(actor, "alert.escalate", "alert", alertId, { caseId: c._id });
  return c.toObject();
}

async function listCases(q) {
  const page = Math.max(parseInt(q.page || "1", 10), 1);
  const limit = Math.min(Math.max(parseInt(q.limit || "20", 10), 1), 100);
  const filter = {};
  if (q.status && q.status !== "all") filter.status = q.status;
  if (q.userId) filter.userId = q.userId;
  const [cases, total] = await Promise.all([
    Case.find(filter).sort({ updatedAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    Case.countDocuments(filter),
  ]);
  return { page, limit, total, cases };
}

async function getCase(id) {
  const c = await Case.findById(id).lean();
  if (!c) throw err(404, "Case not found");
  const [alerts, log] = await Promise.all([
    Alert.find({ _id: { $in: c.alertIds } }).sort({ createdAt: -1 }).lean(),
    AuditLog.find({ $or: [{ targetId: id }, { targetId: { $in: c.alertIds } }] }).sort({ at: -1 }).limit(100).lean(),
  ]);
  return { ...c, alerts, timeline: log };
}

const OUTCOMES = ["no_action", "account_restricted", "reported", "other"];

async function updateCase(id, body, actor) {
  const c = await Case.findById(id);
  if (!c) throw err(404, "Case not found");
  const changes = {};
  if (body.note?.trim()) {
    c.notes.push({ by: actor, text: body.note.trim() });
    changes.note = body.note.trim();
  }
  if (body.assignee !== undefined) {
    c.assignee = body.assignee === "me" ? actor : body.assignee || null;
    changes.assignee = c.assignee;
  }
  if (body.restrictAccount === true) {
    const out = await setUserStatus(c.userId, false);
    if (!out) throw err(502, "Could not deactivate the account");
    changes.accountRestricted = true;
    c.notes.push({ by: actor, text: "Customer account deactivated" });
  }
  if (body.status === "closed") {
    if (!OUTCOMES.includes(body.outcome)) throw err(400, `outcome must be one of ${OUTCOMES.join(", ")}`);
    c.status = "closed";
    c.outcome = body.outcome;
    c.closedBy = actor;
    c.closedAt = new Date();
    changes.closed = body.outcome;
    // close the case's alerts too
    await Alert.updateMany(
      { _id: { $in: c.alertIds }, status: { $in: [...ACTIVE, "escalated"] }, "hold.state": { $ne: "held" } },
      { $set: { status: "resolved", resolution: `Case closed: ${body.outcome}`, resolvedBy: actor, resolvedAt: new Date() } },
    );
  } else if (body.status === "open" && c.status === "closed") {
    c.status = "open";
    c.closedAt = null;
    changes.reopened = true;
  }
  await c.save();
  await audit(actor, "case.update", "case", id, changes);
  return getCase(id);
}

// ------------------------------------------------------------------ dashboard & audit
async function dashboard() {
  const now = new Date();
  const weekAgo = new Date(now - 7 * 24 * HOUR);
  const [bySeverity, overdue, byDay, byRule, openCases, holds, reviewTimes] = await Promise.all([
    Alert.aggregate([{ $match: { status: { $in: ACTIVE } } }, { $group: { _id: "$severity", count: { $sum: 1 } } }]),
    Alert.countDocuments({ status: { $in: ACTIVE }, dueAt: { $lt: now } }),
    Alert.aggregate([
      { $match: { createdAt: { $gte: weekAgo } } },
      { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
    Alert.aggregate([
      { $match: { createdAt: { $gte: weekAgo } } },
      { $group: { _id: "$ruleKey", name: { $first: "$ruleName" }, count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]),
    Case.countDocuments({ status: "open" }),
    listHolds({ state: "held", limit: 1 }).catch(() => null),
    Alert.aggregate([
      { $match: { resolvedAt: { $gte: weekAgo } } },
      { $group: { _id: null, avgMs: { $avg: { $subtract: ["$resolvedAt", "$createdAt"] } } } },
    ]),
  ]);
  const sev = Object.fromEntries(bySeverity.map((s) => [s._id, s.count]));
  return {
    openAlerts: { high: sev.high || 0, medium: sev.medium || 0, low: sev.low || 0, total: bySeverity.reduce((s, x) => s + x.count, 0) },
    overdueAlerts: overdue,
    openCases,
    held: holds?.summary || null,
    avgReviewHours: reviewTimes[0] ? Number((reviewTimes[0].avgMs / HOUR).toFixed(1)) : null,
    alertsLast7Days: byDay.map((d) => ({ date: d._id, count: d.count })),
    topRules: byRule.map((r) => ({ ruleKey: r._id, name: r.name, count: r.count })),
  };
}

async function listAudit(q) {
  const page = Math.max(parseInt(q.page || "1", 10), 1);
  const limit = Math.min(Math.max(parseInt(q.limit || "50", 10), 1), 200);
  const filter = {};
  if (q.actor) filter.actor = q.actor;
  if (q.action) filter.action = new RegExp(`^${escapeRegex(q.action)}`);
  if (q.targetId) filter.targetId = q.targetId;
  const [entries, total] = await Promise.all([
    AuditLog.find(filter).sort({ at: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    AuditLog.countDocuments(filter),
  ]);
  return { page, limit, total, entries };
}

async function customerOverview(userId, days) {
  const [alerts, cases, ledger] = await Promise.all([
    Alert.find({ userId }).sort({ createdAt: -1 }).limit(50).lean(),
    Case.find({ userId }).sort({ updatedAt: -1 }).limit(20).lean(),
    customerLedger(userId, days).catch(() => null),
  ]);
  return { alerts, cases, ledger };
}

async function rescan(userId, actor) {
  const out = await rescanCustomer(userId, 30);
  await audit(actor, "customer.rescan", "customer", userId, out);
  return out;
}

module.exports = {
  getSettings,
  updateSettings,
  listRules,
  updateRule,
  simulate,
  engineConfig,
  ingestAlerts,
  listAlerts,
  getAlert,
  updateAlert,
  actOnHold,
  applyHoldUpdate,
  escalate,
  listCases,
  getCase,
  updateCase,
  dashboard,
  listAudit,
  customerOverview,
  rescan,
  listHoldsForAdmin: listHolds,
};
