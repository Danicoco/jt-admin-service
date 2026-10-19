const escapeHtml = (s = "") =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const SOURCE_TEXT = {
  bvn_submission: "submitted a BVN that is on the watchlist",
  watchlist_added: "already had a BVN that was just added to the watchlist",
  watchlist_refresh: "were found with a watchlisted BVN during a watchlist check",
  nibss_flag: "submitted a BVN that NIBSS has watchlisted (reported by Prembly during BVN verification)",
};

const maskBvn = (bvn) => `*******${String(bvn).slice(-4)}`;

/**
 * Compliance alert for accounts flagged by the BVN watchlist.
 * @param {{ matches: Array<{ entry, userId, user, flagged }>, source: string }} p
 */
module.exports = ({ matches, source }) => {
  const rows = matches
    .map(({ entry, userId, user, flagged }) => {
      const name = [user?.firstName, user?.lastName].filter(Boolean).join(" ") || "Unknown";
      return `<tr>
        <td style="padding:8px;border-bottom:1px solid #e6e9ef;">${escapeHtml(name)}<br><span style="color:#777;font-size:12px;">${escapeHtml(user?.email || "")} ${escapeHtml(user?.phoneNumber || "")}</span><br><span style="color:#777;font-size:11px;">ID: ${escapeHtml(userId)}</span></td>
        <td style="padding:8px;border-bottom:1px solid #e6e9ef;">${maskBvn(entry.bvn)}</td>
        <td style="padding:8px;border-bottom:1px solid #e6e9ef;">${escapeHtml(entry.name || "")}${entry.reason ? `<br><span style="color:#777;font-size:12px;">${escapeHtml(entry.reason)}</span>` : ""}</td>
        <td style="padding:8px;border-bottom:1px solid #e6e9ef;">${flagged ? "Deactivated" : '<b style="color:#EB5757;">NOT deactivated – action needed</b>'}</td>
      </tr>`;
    })
    .join("");

  return `<!DOCTYPE html>
<html><body style="margin:0;padding:24px;background:#f5f7fa;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:680px;margin:auto;background:#fff;border-radius:10px;overflow:hidden;">
    <tr><td style="background:#0a2540;color:#fff;padding:22px 24px;font-size:20px;font-weight:bold;">BVN watchlist alert</td></tr>
    <tr><td style="padding:24px;color:#333;font-size:14px;line-height:22px;">
      <p style="margin:0 0 12px;">${matches.length} account${matches.length === 1 ? "" : "s"} ${SOURCE_TEXT[source] || "matched the BVN watchlist"}.
      Flagged accounts are deactivated and can't log in or transact until an admin reviews them.</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:13px;border-collapse:collapse;">
        <tr style="text-align:left;background:#f0f4f8;">
          <th style="padding:8px;">Customer</th><th style="padding:8px;">BVN</th><th style="padding:8px;">Watchlist entry</th><th style="padding:8px;">Account</th>
        </tr>
        ${rows}
      </table>
      <p style="margin:16px 0 0;color:#777;font-size:12px;">Review these customers in the admin dashboard under BVN Watchlist.</p>
    </td></tr>
  </table>
</body></html>`;
};
