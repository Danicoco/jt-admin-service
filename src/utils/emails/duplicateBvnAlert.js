const escapeHtml = (s = "") =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const customer = (user, userId) => {
  const name = [user?.firstName, user?.lastName].filter(Boolean).join(" ") || "Unknown";
  return `${escapeHtml(name)}<br><span style="color:#777;font-size:12px;">${escapeHtml(user?.email || "")} ${escapeHtml(user?.phoneNumber || "")}</span><br><span style="color:#777;font-size:11px;">ID: ${escapeHtml(userId)}</span>`;
};

/**
 * Admin alert for accounts deactivated because their BVN is also on another account.
 * @param {{ accounts: Array<{ userId, user, keptUserId, keptUser, bvnLast4, flagged }> }} p
 */
module.exports = ({ accounts }) => {
  const rows = accounts
    .map(
      ({ userId, user, keptUserId, keptUser, bvnLast4, flagged }) => `<tr>
        <td style="padding:8px;border-bottom:1px solid #e6e9ef;">${customer(user, userId)}</td>
        <td style="padding:8px;border-bottom:1px solid #e6e9ef;">*******${escapeHtml(bvnLast4)}</td>
        <td style="padding:8px;border-bottom:1px solid #e6e9ef;">${customer(keptUser, keptUserId)}</td>
        <td style="padding:8px;border-bottom:1px solid #e6e9ef;">${flagged ? "Deactivated" : '<b style="color:#EB5757;">NOT deactivated – action needed</b>'}</td>
      </tr>`,
    )
    .join("");

  return `<!DOCTYPE html>
<html><body style="margin:0;padding:24px;background:#f5f7fa;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:720px;margin:auto;background:#fff;border-radius:10px;overflow:hidden;">
    <tr><td style="background:#0a2540;color:#fff;padding:22px 24px;font-size:20px;font-weight:bold;">Duplicate BVN accounts deactivated</td></tr>
    <tr><td style="padding:24px;color:#333;font-size:14px;line-height:22px;">
      <p style="margin:0 0 12px;">${accounts.length} account${accounts.length === 1 ? " was" : "s were"} deactivated because the same BVN is on another account.
      Each BVN was kept on one account: the one where it is verified, otherwise the oldest active account.</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:13px;border-collapse:collapse;">
        <tr style="text-align:left;background:#f0f4f8;">
          <th style="padding:8px;">Deactivated customer</th><th style="padding:8px;">BVN</th><th style="padding:8px;">Account that kept the BVN</th><th style="padding:8px;">Account</th>
        </tr>
        ${rows}
      </table>
      <p style="margin:16px 0 0;color:#777;font-size:12px;">If the wrong account was kept, reactivate the right one from the customer's profile in the admin dashboard and deactivate the other.</p>
    </td></tr>
  </table>
</body></html>`;
};
