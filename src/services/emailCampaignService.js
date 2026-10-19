const { SendMailClient } = require("zeptomail");
const { EmailCampaign } = require("../models/emailCampaign");
const { listEmailRecipients } = require("./userService");
const { campaignTemplate, applyMergeTags } = require("../utils/emails/campaignTemplate");

const client = new SendMailClient({
  url: process.env.ZEP_URL,
  token: process.env.ZEP_TOKEN,
});

const FROM = {
  address: process.env.EMAIL_CAMPAIGN_FROM || "noreply@jamestown.ng",
  name: "Jamestown",
};
const BATCH_SIZE = 500; // ZeptoMail batch limit per request
const PAGE_SIZE = 1000;

// ZeptoMail batch merge tags use {{name}} placeholders filled from merge_info
const toRecipient = (u) => ({
  email_address: {
    address: u.email,
    name: `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.email,
  },
  merge_info: { first_name: u.firstName || "", last_name: u.lastName || "" },
});

function render(campaign) {
  return campaignTemplate({
    subject: campaign.subject,
    preheader: campaign.preheader,
    content: campaign.content,
  });
}

function renderPreview(campaign, sample = { firstName: "Ada", lastName: "Obi" }) {
  return applyMergeTags(render(campaign), sample);
}

async function sendTest(campaign, email) {
  await client.sendMail({
    from: FROM,
    to: [{ email_address: { address: email, name: email } }],
    subject: `[TEST] ${campaign.subject}`,
    htmlbody: applyMergeTags(render(campaign), { firstName: "there" }),
  });
}

/**
 * Send a campaign to its audience. Runs in the background; progress is written
 * to the campaign document so the admin UI can poll it.
 */
async function deliverCampaign(campaignId) {
  const campaign = await EmailCampaign.findById(campaignId);
  if (!campaign) return;

  const htmlbody = render(campaign);
  let after = null;
  let sent = 0;
  let failed = 0;
  let lastError;

  try {
    do {
      const page = await listEmailRecipients({
        audience: campaign.audience,
        limit: PAGE_SIZE,
        ...(after && { after }),
      });
      after = page.next;

      for (let i = 0; i < page.recipients.length; i += BATCH_SIZE) {
        const batch = page.recipients.slice(i, i + BATCH_SIZE);
        try {
          await client.sendBatchMail({
            from: FROM,
            to: batch.map(toRecipient),
            subject: campaign.subject,
            htmlbody,
          });
          sent += batch.length;
        } catch (e) {
          failed += batch.length;
          lastError = e?.error?.message || e?.message || JSON.stringify(e);
          console.error("email campaign batch error:", lastError);
        }
        await EmailCampaign.updateOne(
          { _id: campaignId },
          { $set: { "stats.sent": sent, "stats.failed": failed, "stats.total": sent + failed } },
        );
      }
    } while (after);
  } catch (e) {
    lastError = e?.message || String(e);
    console.error("email campaign delivery error:", lastError);
  }

  const status = failed === 0 && !lastError ? "sent" : sent > 0 ? "partially_sent" : "failed";
  await EmailCampaign.updateOne(
    { _id: campaignId },
    {
      $set: {
        status,
        sentAt: new Date(),
        "stats.sent": sent,
        "stats.failed": failed,
        "stats.total": sent + failed,
        ...(lastError && { lastError }),
      },
    },
  );
}

/**
 * Mark a draft as sending (atomically, so a double click can't send twice) and
 * kick off delivery.
 */
async function startCampaign(campaignId, sentBy) {
  const campaign = await EmailCampaign.findOneAndUpdate(
    { _id: campaignId, status: "draft" },
    {
      $set: {
        status: "sending",
        sentBy,
        startedAt: new Date(),
        stats: { total: 0, sent: 0, failed: 0 },
      },
      $unset: { lastError: "" },
    },
    { new: true },
  );
  if (!campaign) return null;

  deliverCampaign(campaignId).catch((e) =>
    console.error("email campaign crashed:", e),
  );
  return campaign;
}

module.exports = { renderPreview, sendTest, startCampaign };
