const { jsonS, jsonFailed } = require("../../../utils");
const { EmailCampaign, AUDIENCES } = require("../../../models/emailCampaign");
const { countEmailRecipients } = require("../../../services/userService");
const {
  renderPreview,
  sendTest,
  startCampaign,
} = require("../../../services/emailCampaignService");

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function readBody(body) {
  const subject = String(body.subject || "").trim();
  const content = String(body.content || "").trim();
  const preheader = String(body.preheader || "").trim();
  const audience = AUDIENCES.includes(body.audience) ? body.audience : "all";
  return { subject, content, preheader, audience };
}

function validate({ subject, content }) {
  if (!subject) return "Subject is required";
  if (subject.length > 150) return "Subject must be 150 characters or less";
  // content from the editor can be markup with no text, e.g. "<p><br></p>"
  if (!content.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, "").trim()) {
    return "Email content is required";
  }
  return null;
}

const adminId = (req) => req.user?.email || req.user?.id;

const Controller = {
  list: async (req, res) => {
    try {
      const page = Math.max(parseInt(req.query.page || "1", 10), 1);
      const limit = Math.min(Math.max(parseInt(req.query.limit || "20", 10), 1), 100);
      const filter = req.query.status ? { status: req.query.status } : {};

      const [campaigns, total] = await Promise.all([
        EmailCampaign.find(filter)
          .sort({ createdAt: -1 })
          .skip((page - 1) * limit)
          .limit(limit)
          .select("-content")
          .lean(),
        EmailCampaign.countDocuments(filter),
      ]);
      return jsonS(res, 200, "Campaigns fetched", { page, limit, total, campaigns });
    } catch (e) {
      console.error("emailCampaign.list error:", e);
      return jsonFailed(res, {}, "Failed to fetch campaigns", 500);
    }
  },

  get: async (req, res) => {
    try {
      const campaign = await EmailCampaign.findById(req.params.id).lean();
      if (!campaign) return jsonFailed(res, {}, "Campaign not found", 404);
      return jsonS(res, 200, "Campaign fetched", campaign);
    } catch (e) {
      console.error("emailCampaign.get error:", e);
      return jsonFailed(res, {}, "Failed to fetch campaign", 500);
    }
  },

  audienceCount: async (req, res) => {
    try {
      const audience = AUDIENCES.includes(req.query.audience) ? req.query.audience : "all";
      const out = await countEmailRecipients(audience);
      return jsonS(res, 200, "OK", { audience, count: out?.count || 0 });
    } catch (e) {
      console.error("emailCampaign.audienceCount error:", e);
      return jsonFailed(res, {}, "Failed to count recipients", 500);
    }
  },

  preview: async (req, res) => {
    const body = readBody(req.body);
    return jsonS(res, 200, "OK", {
      html: renderPreview({ ...body, subject: body.subject || "Preview" }),
    });
  },

  test: async (req, res) => {
    const body = readBody(req.body);
    const email = String(req.body.email || "").trim();
    const error = validate(body) || (!EMAIL_RE.test(email) && "A valid test email is required");
    if (error) return jsonFailed(res, {}, error, 400);
    try {
      await sendTest(body, email);
      return jsonS(res, 200, `Test email sent to ${email}`);
    } catch (e) {
      console.error("emailCampaign.test error:", e);
      return jsonFailed(res, {}, "Failed to send test email", 502);
    }
  },

  // create a draft, or create and send straight away with { send: true }
  create: async (req, res) => {
    const body = readBody(req.body);
    const error = validate(body);
    if (error) return jsonFailed(res, {}, error, 400);
    try {
      let campaign = await EmailCampaign.create({ ...body, createdBy: adminId(req) });
      if (req.body.send === true) {
        campaign = await startCampaign(campaign._id, adminId(req));
      }
      return jsonS(res, 201, req.body.send ? "Campaign is sending" : "Draft saved", campaign);
    } catch (e) {
      console.error("emailCampaign.create error:", e);
      return jsonFailed(res, {}, "Failed to create campaign", 500);
    }
  },

  update: async (req, res) => {
    const body = readBody(req.body);
    const error = validate(body);
    if (error) return jsonFailed(res, {}, error, 400);
    try {
      const campaign = await EmailCampaign.findOneAndUpdate(
        { _id: req.params.id, status: "draft" },
        { $set: body },
        { new: true },
      );
      if (!campaign) return jsonFailed(res, {}, "Only drafts can be edited", 400);
      return jsonS(res, 200, "Draft updated", campaign);
    } catch (e) {
      console.error("emailCampaign.update error:", e);
      return jsonFailed(res, {}, "Failed to update campaign", 500);
    }
  },

  send: async (req, res) => {
    try {
      const campaign = await startCampaign(req.params.id, adminId(req));
      if (!campaign) return jsonFailed(res, {}, "Campaign not found or already sent", 400);
      return jsonS(res, 200, "Campaign is sending", campaign);
    } catch (e) {
      console.error("emailCampaign.send error:", e);
      return jsonFailed(res, {}, "Failed to send campaign", 500);
    }
  },

  remove: async (req, res) => {
    try {
      const out = await EmailCampaign.deleteOne({ _id: req.params.id, status: "draft" });
      if (!out.deletedCount) return jsonFailed(res, {}, "Only drafts can be deleted", 400);
      return jsonS(res, 200, "Draft deleted");
    } catch (e) {
      console.error("emailCampaign.remove error:", e);
      return jsonFailed(res, {}, "Failed to delete campaign", 500);
    }
  },
};

module.exports = Controller;
