const express = require("express");
const auth = require("../../middlewares/ambassadorAuth/authMiddleware");
const { requirePermission } = require("../../middlewares/requirePermission");
const { MonitoringController: C } = require("../../http/controller/monitoring");

const router = express.Router();
const view = [auth, requirePermission("Monitoring", "canView")];
const work = [auth, requirePermission("Monitoring", "canUpdate")];
const configure = [auth, requirePermission("Monitoring", "canConfigure")];

router.get("/dashboard", view, C.dashboard);

router.get("/alerts", view, C.listAlerts);
router.get("/alerts/:id", view, C.getAlert);
router.patch("/alerts/:id", work, C.updateAlert);
router.post("/alerts/:id/release", work, C.releaseHold);
router.post("/alerts/:id/reject", work, C.rejectHold);
router.post("/alerts/:id/escalate", work, C.escalate);

router.get("/cases", view, C.listCases);
router.get("/cases/:id", view, C.getCase);
router.patch("/cases/:id", work, C.updateCase);

router.get("/holds", view, C.listHolds);

router.get("/customers/:userId", view, C.customer);
router.post("/customers/:userId/rescan", work, C.rescan);

router.get("/rules", view, C.listRules);
router.patch("/rules/:key", configure, C.updateRule);
router.post("/rules/:key/simulate", configure, C.simulate);

router.get("/settings", view, C.getSettings);
router.patch("/settings", configure, C.updateSettings);

router.get("/audit", view, C.audit);

module.exports = {
  baseUrl: "/admin/monitoring",
  router,
};
