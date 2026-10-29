const { BvnWatchlist } = require("../models/bvnWatchlist");
const { lookupBvns, flagUserForWatchlist, batchUsers } = require("./userService");
const { SendEmail } = require("./zeptomail");
const watchlistAlertTemplate = require("../utils/emails/watchlistAlert");
const duplicateBvnAlertTemplate = require("../utils/emails/duplicateBvnAlert");
const bvnProviderBalanceAlertTemplate = require("../utils/emails/bvnProviderBalanceAlert");
const Admin = require("../models/admin");

const ALERT_EMAIL = process.env.WATCHLIST_ALERT_EMAIL || "jamestown.ng@gmail.com";
const LOOKUP_CHUNK = 1000; // wallet service limit per lookup call

const BVN_RE = /^\d{11}$/;
const normaliseBvn = (v) => String(v ?? "").replace(/\s/g, "");
const last4 = (bvn) => String(bvn).slice(-4);

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

/** { bvn: [{ userId, isBvnVerified }] } for all given BVNs, in chunks. */
async function lookupAll(bvns) {
  const out = {};
  for (const part of chunk(bvns, LOOKUP_CHUNK)) Object.assign(out, await lookupBvns(part));
  return out;
}

/**
 * Flag + deactivate each matched user, record the match on the watchlist
 * entry and send one alert email listing everyone newly flagged.
 * Users already flagged for an entry are skipped, so this is safe to repeat;
 * a match whose flag call failed earlier is retried.
 *
 * @param {Array<{ entry: Object, userId: string }>} hits
 * @param {"bvn_submission"|"watchlist_added"|"watchlist_refresh"} source
 * @returns {Promise<Array>} newly flagged matches
 */
async function processMatches(hits, source) {
  const fresh = hits.filter(
    ({ entry, userId }) => !(entry.matches || []).some((m) => m.userId === userId && m.flagged),
  );
  if (!fresh.length) return [];

  const flagged = [];
  for (const { entry, userId } of fresh) {
    let user = null;
    try {
      user = await flagUserForWatchlist(userId, {
        entryId: entry._id,
        bvnLast4: last4(entry.bvn),
        reason: entry.reason || "BVN on watchlist",
      });
    } catch (e) {
      console.error("watchlist: failed to flag user", userId, e?.response?.data || e.message);
    }

    const retried = await BvnWatchlist.updateOne(
      { _id: entry._id, "matches.userId": userId },
      { $set: { "matches.$.flagged": Boolean(user), onSystem: true, lastCheckedAt: new Date() } },
    );
    if (!retried.matchedCount) {
      await BvnWatchlist.updateOne(
        { _id: entry._id, "matches.userId": { $ne: userId } },
        {
          $push: { matches: { userId, source, matchedAt: new Date(), flagged: Boolean(user) } },
          $set: { onSystem: true, lastCheckedAt: new Date() },
        },
      );
    }
    flagged.push({ entry, userId, user, flagged: Boolean(user) });
  }

  // fill in details for anyone the flag call didn't return
  const missing = flagged.filter((f) => !f.user).map((f) => f.userId);
  if (missing.length) {
    const users = await batchUsers(missing);
    for (const f of flagged) if (!f.user) f.user = users[f.userId] || null;
  }

  SendEmail(
    { email: ALERT_EMAIL, firstName: "Jamestown", lastName: "Compliance" },
    `BVN watchlist alert: ${flagged.length} account${flagged.length === 1 ? "" : "s"} flagged`,
    watchlistAlertTemplate({ matches: flagged, source }),
  ).catch((e) => console.error("watchlist: alert email failed", e));

  return flagged;
}

/** Look up which entries are on our system, update them, flag new matches. */
async function syncEntries(entries, source) {
  if (!entries.length) return [];
  const matches = await lookupAll(entries.map((e) => e.bvn));

  const hits = [];
  for (const entry of entries) {
    const users = matches[entry.bvn] || [];
    await BvnWatchlist.updateOne(
      { _id: entry._id },
      { $set: { onSystem: users.length > 0, lastCheckedAt: new Date() } },
    );
    entry.onSystem = users.length > 0;
    entry.systemUsers = users;
    for (const u of users) hits.push({ entry, userId: u.userId });
  }
  const flagged = await processMatches(hits, source);
  return flagged;
}

/** Called by the wallet service when a user submits a BVN. */
async function screen({ userId, bvn }) {
  const entry = await BvnWatchlist.findOne({ bvn: normaliseBvn(bvn) }).lean();
  if (!entry) return { listed: false };
  await processMatches([{ entry, userId: String(userId) }], "bvn_submission");
  return { listed: true };
}

/**
 * Prembly reported the BVN as watchlisted by NIBSS during verification. Put it
 * on our watchlist (so future sign-ups with it are caught too) and flag the
 * user exactly as for one of our own entries.
 */
async function flagNibss({ userId, bvn, message }) {
  const value = normaliseBvn(bvn);
  if (!BVN_RE.test(value)) return { error: "BVN must be 11 digits", status: 400 };
  const reason = `Watchlisted by NIBSS${message ? `: ${message}` : ""}`;
  await BvnWatchlist.updateOne(
    { bvn: value },
    { $setOnInsert: { bvn: value, source: "nibss", reason, addedBy: "NIBSS (via Prembly)" } },
    { upsert: true },
  );
  const entry = await BvnWatchlist.findOne({ bvn: value }).lean();
  const flagged = await processMatches([{ entry, userId: String(userId) }], "nibss_flag");
  return { listed: true, flagged: flagged.length };
}

/**
 * Called by the wallet service after it deactivates accounts that share a BVN
 * with another account: email every active admin the list.
 * @param {Array<{ userId, user, keptUserId, keptUser, bvnLast4, flagged }>} accounts
 */
async function alertDuplicates(accounts) {
  const admins = await Admin.find({ isActive: true }).select("email firstName lastName").lean();
  const subject = `${accounts.length} account${accounts.length === 1 ? "" : "s"} deactivated for a duplicate BVN`;
  const html = duplicateBvnAlertTemplate({ accounts });
  await Promise.all(
    admins.map((admin) =>
      SendEmail(admin, subject, html).catch((e) => console.error("duplicate bvn alert email failed", admin.email, e)),
    ),
  );
  return { notified: admins.length };
}

/**
 * Email every active admin that BVN checks are paused because the identity
 * provider's wallet is out of balance.
 */
async function alertProviderBalance({ provider, pending }) {
  const admins = await Admin.find({ isActive: true }).select("email firstName lastName").lean();
  const subject = "Action needed: BVN verification paused (insufficient Prembly balance)";
  const html = bvnProviderBalanceAlertTemplate({ provider, pending });
  await Promise.all(
    admins.map((admin) =>
      SendEmail(admin, subject, html).catch((e) => console.error("bvn provider balance alert email failed", admin.email, e)),
    ),
  );
  return { notified: admins.length };
}

async function addOne({ bvn, name, reason }, addedBy) {
  const value = normaliseBvn(bvn);
  if (!BVN_RE.test(value)) return { error: "BVN must be 11 digits", status: 400 };
  if (await BvnWatchlist.exists({ bvn: value })) {
    return { error: "This BVN is already on the watchlist", status: 409 };
  }
  const entry = await BvnWatchlist.create({ bvn: value, name, reason, source: "manual", addedBy });
  const flagged = await syncEntries([entry.toObject()], "watchlist_added");
  return { entry: await BvnWatchlist.findById(entry._id).lean(), flagged: flagged.length };
}

/**
 * Parse a CSV of BVNs. Columns: bvn, name, reason (header row optional; with a
 * header, columns can be in any order). Handles quotes, CRLF and a BOM.
 */
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  const src = String(text).replace(/^﻿/, "");
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (quoted) {
      if (c === '"' && src[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && src[i + 1] === "\n") i++;
      row.push(field); rows.push(row); row = []; field = "";
    } else field += c;
  }
  if (field !== "" || row.length) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.some((v) => v.trim() !== ""));
}

function rowsToRecords(rows) {
  if (!rows.length) return [];
  const header = rows[0].map((h) => h.trim().toLowerCase());
  const hasHeader = header.includes("bvn");
  const col = hasHeader
    ? { bvn: header.indexOf("bvn"), name: header.indexOf("name"), reason: header.indexOf("reason") }
    : { bvn: 0, name: 1, reason: 2 };
  return rows.slice(hasHeader ? 1 : 0).map((r, i) => ({
    line: i + (hasHeader ? 2 : 1),
    bvn: normaliseBvn(r[col.bvn]),
    name: col.name >= 0 ? (r[col.name] || "").trim() || undefined : undefined,
    reason: col.reason >= 0 ? (r[col.reason] || "").trim() || undefined : undefined,
  }));
}

const MAX_ROWS = 20000;

async function addFromCsv(text, addedBy) {
  const records = rowsToRecords(parseCsv(text));
  if (!records.length) return { error: "The CSV has no rows", status: 400 };
  if (records.length > MAX_ROWS) {
    return { error: `At most ${MAX_ROWS} rows per upload`, status: 400 };
  }

  const invalid = [];
  const seen = new Set();
  const candidates = [];
  let duplicatesInFile = 0;
  for (const r of records) {
    if (!BVN_RE.test(r.bvn)) invalid.push({ line: r.line, value: r.bvn, error: "BVN must be 11 digits" });
    else if (seen.has(r.bvn)) duplicatesInFile++;
    else { seen.add(r.bvn); candidates.push(r); }
  }

  const existing = new Set(
    (await BvnWatchlist.find({ bvn: { $in: candidates.map((c) => c.bvn) } }).select("bvn").lean()).map((d) => d.bvn),
  );
  const toInsert = candidates
    .filter((c) => !existing.has(c.bvn))
    .map(({ bvn, name, reason }) => ({ bvn, name, reason, source: "csv", addedBy }));

  let inserted = [];
  if (toInsert.length) {
    try {
      inserted = await BvnWatchlist.insertMany(toInsert, { ordered: false });
    } catch (e) {
      // a concurrent upload may have added some of the same BVNs
      inserted = e.insertedDocs || [];
      if (!e.writeErrors) throw e;
    }
  }

  const flagged = await syncEntries(inserted.map((d) => (d.toObject ? d.toObject() : d)), "watchlist_added");

  return {
    summary: {
      rows: records.length,
      added: inserted.length,
      alreadyListed: existing.size,
      duplicatesInFile,
      invalid: invalid.length,
      onSystem: new Set(flagged.map((f) => f.entry.bvn)).size,
      flaggedAccounts: flagged.length,
    },
    invalid: invalid.slice(0, 200),
  };
}

const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Paginated list. The current page is re-checked against the wallet service
 * so "on our system" is live, and any new matches are flagged.
 */
async function list({ page = 1, limit = 20, search, onSystem }) {
  page = Math.max(parseInt(page, 10) || 1, 1);
  limit = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);

  const filter = {};
  if (search) {
    const re = new RegExp(escapeRegex(String(search).trim()), "i");
    filter.$or = [{ bvn: re }, { name: re }, { reason: re }];
  }
  if (onSystem === "true" || onSystem === "1") filter.onSystem = true;
  if (onSystem === "false" || onSystem === "0") filter.onSystem = false;

  const [entries, total] = await Promise.all([
    BvnWatchlist.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    BvnWatchlist.countDocuments(filter),
  ]);

  let liveError = null;
  try {
    await syncEntries(entries, "watchlist_refresh");
  } catch (e) {
    // fall back to the stored onSystem value
    liveError = "Live check unavailable; showing last known status";
    console.error("watchlist: live check failed", e?.response?.data || e.message);
  }

  // attach the people behind each match
  const fresh = await BvnWatchlist.find({ _id: { $in: entries.map((e) => e._id) } }).lean();
  const byId = new Map(fresh.map((f) => [f._id, f]));
  const userIds = [
    ...new Set([
      ...fresh.flatMap((f) => f.matches.map((m) => m.userId)),
      ...entries.flatMap((e) => (e.systemUsers || []).map((u) => u.userId)),
    ]),
  ];
  const users = await batchUsers(userIds);

  const rows = entries.map((e) => {
    const f = byId.get(e._id) || e;
    const ids = new Set([...(e.systemUsers || []).map((u) => u.userId), ...f.matches.map((m) => m.userId)]);
    return {
      ...f,
      onSystem: e.onSystem ?? f.onSystem,
      users: [...ids].map((id) => {
        const m = f.matches.find((x) => x.userId === id);
        const u = users[id] || {};
        return {
          userId: id,
          firstName: u.firstName,
          lastName: u.lastName,
          email: u.email,
          phoneNumber: u.phoneNumber,
          flagged: Boolean(m?.flagged),
          matchedAt: m?.matchedAt || null,
        };
      }),
    };
  });

  return { page, limit, total, entries: rows, ...(liveError && { warning: liveError }) };
}

async function summary() {
  const [total, onSystem, flaggedAgg] = await Promise.all([
    BvnWatchlist.countDocuments({}),
    BvnWatchlist.countDocuments({ onSystem: true }),
    BvnWatchlist.aggregate([
      { $unwind: "$matches" },
      { $match: { "matches.flagged": true } },
      { $group: { _id: null, count: { $sum: 1 } } },
    ]),
  ]);
  return { total, onSystem, notOnSystem: total - onSystem, flaggedAccounts: flaggedAgg[0]?.count || 0 };
}

async function remove(id) {
  const out = await BvnWatchlist.deleteOne({ _id: id });
  return out.deletedCount > 0;
}

module.exports = { screen, flagNibss, alertDuplicates, alertProviderBalance, addOne, addFromCsv, list, summary, remove, parseCsv, rowsToRecords };
