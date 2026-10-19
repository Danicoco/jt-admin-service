/**
 * Branded wrapper for admin email campaigns. Admins only write the body; the
 * header and footer are fixed here. Table layout + inline styles so it renders
 * in Gmail / Outlook.
 *
 * Merge tags usable in content: {{first_name}}, {{last_name}}.
 */

const BRAND = {
  name: "Jamestown",
  primary: "#0a2540",
  accent: "#6EEDC8",
  logoUrl: process.env.EMAIL_LOGO_URL || "",
  siteUrl: process.env.EMAIL_SITE_URL || "https://jamestown.ng",
  supportEmail: process.env.EMAIL_SUPPORT_ADDRESS || "support@jamestown.ng",
};

const escapeHtml = (str = "") =>
  String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/**
 * Strip things that have no place in an email body (scripts, event handlers,
 * javascript: links, embedded frames).
 */
function sanitizeContent(html = "") {
  return String(html)
    .replace(/<\s*(script|iframe|object|embed|form)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, "")
    .replace(/<\s*(script|iframe|object|embed|form|input|button)[^>]*\/?>/gi, "")
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/(href|src)\s*=\s*(["']?)\s*javascript:[^"'>\s]*\2/gi, '$1="#"');
}

function header() {
  const logo = BRAND.logoUrl
    ? `<img src="${escapeHtml(BRAND.logoUrl)}" alt="${BRAND.name}" height="36" style="display:block;margin:0 auto;border:0;height:36px;" />`
    : `<span style="font-size:26px;font-weight:700;letter-spacing:0.5px;color:#ffffff;">${BRAND.name}</span>`;
  return `
          <tr>
            <td align="center" style="background:${BRAND.primary};padding:28px 24px;">
              <a href="${escapeHtml(BRAND.siteUrl)}" style="text-decoration:none;color:#ffffff;">${logo}</a>
            </td>
          </tr>
          <tr><td style="background:${BRAND.accent};height:4px;line-height:4px;font-size:0;">&nbsp;</td></tr>`;
}

function footer() {
  const year = new Date().getFullYear();
  return `
          <tr>
            <td style="padding:24px;border-top:1px solid #e6e9ef;background:#fafbfc;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:18px;color:#777777;text-align:center;">
              <p style="margin:0 0 8px;">Need help? Contact us at
                <a href="mailto:${escapeHtml(BRAND.supportEmail)}" style="color:${BRAND.primary};">${escapeHtml(BRAND.supportEmail)}</a>
              </p>
              <p style="margin:0 0 8px;">You're receiving this email because you have a ${BRAND.name} account and opted in to emails.
                You can turn off marketing emails in the app under Settings &rsaquo; Notifications.</p>
              <p style="margin:0;">&copy; ${year} ${BRAND.name}. All rights reserved.</p>
            </td>
          </tr>`;
}

/**
 * @param {Object} p
 * @param {string} p.subject
 * @param {string} [p.preheader] inbox preview text
 * @param {string} p.content admin-authored HTML body
 */
function campaignTemplate({ subject, preheader = "", content }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background:#f5f7fa;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${escapeHtml(preheader)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f5f7fa;">
    <tr>
      <td align="center" style="padding:24px 12px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background:#ffffff;border-radius:10px;overflow:hidden;">
${header()}
          <tr>
            <td style="padding:32px 28px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:24px;color:#333333;">
              ${sanitizeContent(content)}
            </td>
          </tr>
${footer()}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/** Replace merge tags locally (used for previews and test sends). */
function applyMergeTags(html, { firstName = "", lastName = "" } = {}) {
  return html
    .replace(/\{\{\s*first_name\s*\}\}/g, escapeHtml(firstName))
    .replace(/\{\{\s*last_name\s*\}\}/g, escapeHtml(lastName));
}

module.exports = { campaignTemplate, applyMergeTags, sanitizeContent };
