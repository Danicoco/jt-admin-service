const express = require("express");
const auth = require("../../middlewares/ambassadorAuth/authMiddleware");
const { EmailCampaignController } = require("../../http/controller/emailCampaigns");

const router = express.Router();

router.get("/", auth, EmailCampaignController.list);
router.get("/audience-count", auth, EmailCampaignController.audienceCount);
router.post("/preview", auth, EmailCampaignController.preview);
router.post("/test", auth, EmailCampaignController.test);
router.post("/", auth, EmailCampaignController.create);
router.get("/:id", auth, EmailCampaignController.get);
router.patch("/:id", auth, EmailCampaignController.update);
router.post("/:id/send", auth, EmailCampaignController.send);
router.delete("/:id", auth, EmailCampaignController.remove);

module.exports = {
  baseUrl: "/admin/email-campaigns",
  router,
};
