/**
 * User risk scoring.
 *
 * Combines profile facts (user service) with wallet activity (wallet service)
 * into a 0-100 score and a level. Each rule adds points and a human-readable
 * reason so admins can see *why* a user is flagged. An admin override on the
 * user always wins over the computed level.
 */

const DAY_MS = 24 * 60 * 60 * 1000;

const LEVELS = [
  { level: "high", min: 60 },
  { level: "medium", min: 30 },
  { level: "low", min: 0 },
];

const RULES = [
  {
    points: 100,
    reason: "BVN is on the watchlist",
    test: ({ profile }) => Boolean(profile.watchlistFlag?.flagged),
  },
  {
    points: 20,
    reason: "Account is deactivated",
    test: ({ profile }) => profile.isActive === false,
  },
  {
    points: 15,
    reason: "Phone number not verified",
    test: ({ profile }) => !profile.isPhoneVerified,
  },
  {
    points: 10,
    reason: "Email not verified",
    test: ({ profile }) => !profile.isVerified,
  },
  {
    points: 10,
    reason: "BVN not verified",
    test: ({ signals }) => !signals.isBvnVerified,
  },
  {
    points: 15,
    reason: "Account is less than 7 days old",
    test: ({ ageDays }) => ageDays !== null && ageDays < 7,
  },
  {
    points: 5,
    reason: "Account is less than 30 days old",
    test: ({ ageDays }) => ageDays !== null && ageDays >= 7 && ageDays < 30,
  },
  {
    points: 15,
    reason: "New account (<7 days) has withdrawn ₦100,000 or more",
    test: ({ ageDays, signals }) =>
      ageDays !== null && ageDays < 7 && signals.payoutAmount >= 100000,
  },
  {
    points: 20,
    reason: "5 or more withdrawals in the last 24 hours",
    test: ({ signals }) => signals.payoutCount24h >= 5,
  },
  {
    points: 10,
    reason: "3-4 withdrawals in the last 24 hours",
    test: ({ signals }) => signals.payoutCount24h >= 3 && signals.payoutCount24h < 5,
  },
  {
    points: 20,
    reason: "Withdrew ₦500,000 or more in the last 24 hours",
    test: ({ signals }) => signals.payoutAmount24h >= 500000,
  },
  {
    points: 10,
    reason: "Withdrew ₦200,000 - ₦499,999 in the last 24 hours",
    test: ({ signals }) =>
      signals.payoutAmount24h >= 200000 && signals.payoutAmount24h < 500000,
  },
  {
    points: 10,
    reason: "3 or more failed transactions",
    test: ({ signals }) => signals.failedCount >= 3,
  },
  {
    points: 15,
    reason: "2 or more declined gift card trades",
    test: ({ signals }) => signals.giftCardDeclined >= 2,
  },
  {
    points: 5,
    reason: "1 declined gift card trade",
    test: ({ signals }) => signals.giftCardDeclined === 1,
  },
  {
    points: 10,
    reason: "5 or more crypto sends in the last 7 days",
    test: ({ signals }) => signals.cryptoSendCount7d >= 5,
  },
  {
    points: 10,
    reason: "20 or more referred users",
    test: ({ profile }) => (profile.referralsCount || 0) >= 20,
  },
];

const EMPTY_SIGNALS = {
  isBvnVerified: false,
  payoutAmount: 0,
  payoutCount24h: 0,
  payoutAmount24h: 0,
  failedCount: 0,
  giftCardDeclined: 0,
  cryptoSendCount7d: 0,
};

function levelFor(score) {
  return LEVELS.find((l) => score >= l.min).level;
}

/**
 * @param {Object} profile user profile from the user service
 * @param {Object} [signals] wallet signals for this user (missing = no activity)
 * @returns {{ level, computedLevel, score, reasons, override }}
 */
function assessRisk(profile, signals) {
  const s = { ...EMPTY_SIGNALS, ...(signals || {}) };
  const created = profile?.createdAt ? new Date(profile.createdAt).getTime() : null;
  const ageDays = created ? (Date.now() - created) / DAY_MS : null;

  const ctx = { profile: profile || {}, signals: s, ageDays };
  const hits = RULES.filter((r) => r.test(ctx));
  const score = Math.min(
    100,
    hits.reduce((sum, r) => sum + r.points, 0),
  );
  const computedLevel = levelFor(score);
  const override = profile?.riskOverride || null;

  return {
    level: override?.level || computedLevel,
    computedLevel,
    score,
    reasons: hits.map((r) => ({ reason: r.reason, points: r.points })),
    override,
  };
}

module.exports = { assessRisk, RISK_LEVELS: ["low", "medium", "high"] };
