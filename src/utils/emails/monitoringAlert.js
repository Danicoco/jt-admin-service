const escapeHtml = (s = "") =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const COLORS = { high: "#EB5757", medium: "#B7791F", low: "#4F4F4F" };
const TIMEOUT_TEXT = { release: "released automatically", reject: "rejected and refunded automatically", keep: "kept until someone reviews it" };

/** Compliance email listing new transaction monitoring alerts. */
module.exports = ({ alerts, holdTimeoutMinutes, onHoldTimeout }) => {
  const rows = alerts
    .map((a) => {
      const name = [a.customer?.firstName, a.customer?.lastName].filter(Boolean).join(" ") || a.userId;
      const held = a.hold
        ? `<br><b style="color:#EB5757;">Payment held</b> – will be ${TIMEOUT_TEXT[onHoldTimeout] || "released"} after ${holdTimeoutMinutes} minutes if not reviewed`
        : "";
      return `<tr>
        <td style="padding:8px;border-bottom:1px solid #e6e9ef;vertical-align:top;"><b style="color:${COLORS[a.severity]};text-transform:uppercase;font-size:11px;">${escapeHtml(a.severity)}</b><br>${escapeHtml(a.ruleName)}</td>
        <td style="padding:8px;border-bottom:1px solid #e6e9ef;vertical-align:top;">${escapeHtml(name)}<br><span style="color:#777;font-size:12px;">${escapeHtml(a.customer?.email || "")}</span></td>
        <td style="padding:8px;border-bottom:1px solid #e6e9ef;vertical-align:top;">${escapeHtml(a.summary)}${held}</td>
      </tr>`;
    })
    .join("");

  return `<!DOCTYPE html>
<html><body style="margin:0;padding:24px;background:#f5f7fa;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:720px;margin:auto;background:#fff;border-radius:10px;overflow:hidden;">
    <tr><td style="background:#0a2540;color:#fff;padding:22px 24px;font-size:20px;font-weight:bold;">Transaction monitoring</td></tr>
    <tr><td style="padding:24px;color:#333;font-size:14px;line-height:22px;">
      <p style="margin:0 0 12px;">${alerts.length} new ${alerts.length === 1 ? "alert needs" : "alerts need"} review.</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:13px;border-collapse:collapse;">
        <tr style="text-align:left;background:#f0f4f8;"><th style="padding:8px;">Alert</th><th style="padding:8px;">Customer</th><th style="padding:8px;">What happened</th></tr>
        ${rows}
      </table>
      <p style="margin:16px 0 0;color:#777;font-size:12px;">Review them in the admin dashboard under Monitoring.</p>
    </td></tr>
  </table>
</body></html>`;
};
