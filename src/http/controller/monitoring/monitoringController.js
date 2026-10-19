const { jsonS, jsonFailed } = require("../../../utils");
const svc = require("../../../services/monitoringService");

const actor = (req) => req.user?.email || req.user?.id;

// wrap a handler: (req) => data, with consistent error handling
const handle = (message, fn) => async (req, res) => {
  try {
    return jsonS(res, 200, message, await fn(req));
  } catch (e) {
    if (e.status && e.status < 500) return jsonFailed(res, {}, e.message, e.status);
    console.error(`monitoring: ${message} failed:`, e?.response?.data || e);
    return jsonFailed(res, {}, e.status === 502 ? e.message : "Something went wrong", e.status || 500);
  }
};

const Controller = {
  dashboard: handle("Monitoring dashboard", () => svc.dashboard()),

  listAlerts: handle("Alerts fetched", (req) => svc.listAlerts(req.query)),
  getAlert: handle("Alert fetched", (req) => svc.getAlert(req.params.id)),
  updateAlert: handle("Alert updated", (req) => svc.updateAlert(req.params.id, req.body, actor(req))),
  releaseHold: handle("Hold processed", (req) => svc.actOnHold(req.params.id, "release", actor(req))),
  rejectHold: handle("Hold processed", (req) => svc.actOnHold(req.params.id, "reject", actor(req), req.body.reason)),
  escalate: handle("Alert escalated", (req) => svc.escalate(req.params.id, req.body, actor(req))),

  listCases: handle("Cases fetched", (req) => svc.listCases(req.query)),
  getCase: handle("Case fetched", (req) => svc.getCase(req.params.id)),
  updateCase: handle("Case updated", (req) => svc.updateCase(req.params.id, req.body, actor(req))),

  listHolds: handle("Holds fetched", (req) => svc.listHoldsForAdmin(req.query)),

  listRules: handle("Rules fetched", () => svc.listRules()),
  updateRule: handle("Rule updated", (req) => svc.updateRule(req.params.key, req.body, actor(req))),
  simulate: handle("Simulation complete", (req) => svc.simulate(req.params.key, req.body)),

  getSettings: handle("Settings fetched", () => svc.getSettings()),
  updateSettings: handle("Settings updated", (req) => svc.updateSettings(req.body, actor(req))),

  audit: handle("Audit log fetched", (req) => svc.listAudit(req.query)),

  customer: handle("Customer monitoring", (req) => svc.customerOverview(req.params.userId, req.query.days)),
  rescan: handle("Customer rescanned", (req) => svc.rescan(req.params.userId, actor(req))),

  // ---- internal (wallet service)
  engineConfig: handle("OK", () => svc.engineConfig()),
  ingestAlerts: handle("OK", async (req) => ({ created: (await svc.ingestAlerts(req.body.alerts)).length })),
  holdUpdate: handle("OK", async (req) => {
    await svc.applyHoldUpdate(req.body);
    return {};
  }),
};

module.exports = Controller;
