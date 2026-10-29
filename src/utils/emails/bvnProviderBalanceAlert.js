const escapeHtml = (s = "") =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/**
 * Admin alert: automatic BVN checks are paused because the identity provider's
 * wallet (Prembly) is out of balance.
 * @param {{ provider: string, pending: number }} p
 */
module.exports = ({ provider, pending }) => {
  const name = escapeHtml(provider.charAt(0).toUpperCase() + provider.slice(1));
  const waiting =
    pending > 0
      ? `${pending} customer${pending === 1 ? " is" : "s are"} waiting for an automatic BVN check.`
      : "Customers who try to verify their BVN in the app are told verification is temporarily unavailable.";

  return `<!DOCTYPE html>
<html><body style="margin:0;padding:24px;background:#f5f7fa;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:720px;margin:auto;background:#fff;border-radius:10px;overflow:hidden;">
    <tr><td style="background:#0a2540;color:#fff;padding:22px 24px;font-size:20px;font-weight:bold;">BVN verification paused: insufficient ${name} balance</td></tr>
    <tr><td style="padding:24px;color:#333;font-size:14px;line-height:22px;">
      <p style="margin:0 0 12px;">${name} rejected a BVN lookup with <b>"Insufficient wallet balance"</b>, so automatic BVN verification has stopped.</p>
      <p style="margin:0 0 12px;">${waiting}</p>
      <p style="margin:0 0 12px;"><b>What to do:</b> top up the ${name} wallet from the ${name} dashboard. Checks resume on the next hourly run; nothing else is needed.</p>
      <p style="margin:16px 0 0;color:#777;font-size:12px;">Customers have not been emailed and these checks don't count toward their attempts. You'll get this reminder at most every 6 hours until the balance is topped up.</p>
    </td></tr>
  </table>
</body></html>`;
};
