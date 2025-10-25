const SkuCounter = require('../models/skuCounter');

const ALNUM = /[^A-Z0-9]/g;
function codeify(str, len = 4) {
  if (!str) return '';
  return String(str).toUpperCase().replace(ALNUM, '').slice(0, len);
}

async function nextSeq(prefix) {
  const doc = await SkuCounter.findByIdAndUpdate(
    prefix,
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return doc.seq; 
}

/**
 * Build human SKU like: BRAND-CAT-TITLE-#### (e.g., NIKE-SHOE-PEG4-0007)
 */
async function generateProductSku({ brand, category, title }) {
  const b = codeify(brand, 4) || 'GEN';
  const c = codeify(category, 4) || 'CAT';
  const t = codeify(title, 4) || 'PRD';

  // Prefix defines the sequence namespace (prevents global collisions)
  const prefix = `${b}-${c}-${t}`;
  const n = await nextSeq(prefix);
  const num = String(n).padStart(4, '0');
  return `${b}-${c}-${t}-${num}`;
}

module.exports = { generateProductSku };
