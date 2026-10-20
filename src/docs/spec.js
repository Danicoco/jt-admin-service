const { route, ok, fail, described, buildSpec } = require("./builder");

// ---------------------------------------------------------------- samples
const ADMIN_ID = "c2a9e1f4-7b3d-4e6a-8f1c-5d0b2a9e7c31";
const USER_ID = "3f6c2a8e-1b7d-4c55-9e2a-6f1d0b9c7a41";
const ROLE_ID = "r-6d4b2a10";
const PRODUCT_ID = "prd_6a1f0c2e";
const DATE = "2026-10-15T09:30:00.000Z";

const PERMISSIONS = [
  { module: "Dashboard", permissions: { canView: true } },
  { module: "Customer", permissions: { canCreate: false, canView: true, canUpdate: true, canDelete: false } },
  { module: "Trade", permissions: { canCreate: false, canView: true, canUpdate: true, canDelete: false, canTreat: true } },
  { module: "Notification", permissions: { canCreate: true, canView: true, canUpdate: false, canDelete: false } },
];

const ADMIN = {
  _id: ADMIN_ID,
  email: "ops@jamestown.ng",
  phoneNumber: "08031234567",
  role: "Manager",
  roleId: ROLE_ID,
  firstName: "Tolu",
  lastName: "Bello",
  location: "Lagos",
  isVerified: true,
  isActive: true,
  photoUrl: null,
  createdAt: DATE,
  updatedAt: DATE,
};

const ROLE = { _id: ROLE_ID, title: "Manager", permissions: PERMISSIONS, numberOfUserAssigned: 3, created_at: DATE, updated_at: DATE };

const RISK = {
  level: "medium",
  computedLevel: "medium",
  score: 40,
  reasons: [
    { reason: "Phone number not verified", points: 15 },
    { reason: "BVN not verified", points: 10 },
    { reason: "Account is less than 7 days old", points: 15 },
  ],
  override: null,
};

const ACTIVITY = {
  hasWallet: true,
  fiatBalance: 25000,
  isBvnVerified: false,
  txCount: 6,
  failedCount: 0,
  depositCount: 2,
  depositAmount: 60000,
  payoutCount: 1,
  payoutAmount: 20000,
  payoutCount24h: 1,
  payoutAmount24h: 20000,
  payoutCount7d: 1,
  cryptoSendCount7d: 0,
  firstTxAt: "2026-10-12T08:00:00.000Z",
  lastTxAt: DATE,
  giftCardCount: 0,
  giftCardDeclined: 0,
};

const CUSTOMER = {
  _id: USER_ID,
  firstName: "Ada",
  lastName: "Obi",
  email: "ada.obi@example.com",
  phoneNumber: "08012345678",
  isVerified: true,
  isPhoneVerified: false,
  isActive: true,
  createdAt: "2026-10-12T08:00:00.000Z",
  referredBy: null,
  riskOverride: null,
  referralsCount: 0,
  location: "Lagos, Lagos",
};

const TRANSACTION = {
  _id: "66f1c0a2b4d5e6f708192a3b",
  reference: "PP2026101509301234",
  sender: USER_ID,
  receiver: "0123456789",
  type: "NGN",
  amount: 20000,
  status: "pending",
  isComplete: false,
  paymentMode: "payout",
  trxType: "debit",
  beneficiary: "GTBank",
  idempotencyKey: "int_9f2c4e6a8b0d1f3e5a7c9b1d3f5e7a90",
  metadata: { beneficiary: "ADA OBI", transactionType: "transfer", description: "0123456789" },
  user: { id: USER_ID, email: "ada.obi@example.com", firstName: "Ada", lastName: "Obi", phoneNumber: "08012345678" },
  createdAt: DATE,
  updatedAt: DATE,
};

const CRYPTO_TX = {
  ...TRANSACTION,
  reference: "a1b2c3d4e5f60718293a4b5c",
  sender: "Platform",
  receiver: USER_ID,
  type: "CRYPTO",
  coin: "btc",
  amount: 76000,
  status: "completed",
  isComplete: true,
  paymentMode: "wallet",
  crytoType: "buy",
  beneficiary: "BTC 0.00074",
  metadata: { transactionType: "buy", description: "btc", coinQty: 0.00074, priceUsd: 67500, rate: 1520, ngnWorth: 76000 },
};

const GIFTCARD_REQUEST = {
  _id: "66f1c3d4e5f60718293a4b5c",
  country: "USA",
  reference: "c4e1a9b27f3d4e8a9b0c1d2e",
  amount: 100,
  totalAmount: 200,
  totalAmountInNaira: 290000,
  quantity: 2,
  category: "E code",
  receiptType: "Amazon",
  rate: 1450,
  imageURL: "https://res.cloudinary.com/jamestown/image/upload/giftcards/card.jpg",
  user: { id: USER_ID, email: "ada.obi@example.com", firstName: "Ada", lastName: "Obi" },
  status: "pending",
  note: "Codes in the image",
  createdAt: DATE,
};

const PRODUCT = {
  _id: PRODUCT_ID,
  title: "Leather Tote Bag",
  sku: "JT-BAG-0001",
  category_id: "cat_bags",
  category: "Bags",
  subcategory: "Totes",
  price: 45000,
  gender: "Unisex",
  brand: "Jamestown",
  description: "Full-grain leather tote with inner zip pocket.",
  imageUrls: ["https://res.cloudinary.com/jamestown/image/upload/tote.jpg"],
  variants: [{ name: "Colour", value: "Brown", qty: 12 }],
  stock: 12,
  isDeleted: false,
  deletedAt: null,
  created_at: DATE,
  updated_at: DATE,
};

const CATEGORY = {
  _id: "cat_bags",
  name: "Bags",
  description: "Bags and totes",
  subcategory: ["Totes", "Backpacks"],
  imageUrls: ["https://res.cloudinary.com/jamestown/image/upload/categories/bags.jpg"],
};

const BANNER = {
  _id: "b1e2c3d4-0000-4a5b-9c8d-7e6f5a4b3c2d",
  title: "Sell gift cards at top rates",
  description: "Best Amazon rates this weekend",
  isActive: true,
  color: "#0a2540",
  position: "top",
  section: "home",
  actionUrl: "jamestown://giftcards/sell",
  created_at: DATE,
  updated_at: DATE,
};

const RATE = {
  _id: "66f2a0b1c2d3e4f506172839",
  type: "sell-giftcard",
  name: "Amazon",
  country: "USA",
  category: "E code",
  range: { min: 25, max: 500 },
  rate: 1450,
  isActive: true,
  image: "https://res.cloudinary.com/jamestown/image/upload/rates/amazon.png",
};

const SHIPPING_RATE = {
  _id: "66f2a0b1c2d3e4f50617283a",
  type: "shipping",
  name: "Express",
  country: "United Kingdom",
  category: "Electronics",
  product: "Laptop",
  range: { min: 0, max: 5 },
  rateType: "flat",
  rate: 8500,
  isActive: true,
};

const SHIPMENT = {
  _id: "shp_2d9a",
  customerUserId: USER_ID,
  receiver: { name: "Chidi Okafor", phoneNumber: "08098765432", email: "chidi@example.com", pickupLocation: "Ikeja City Mall, Lagos" },
  pkg: { category: "Electronics", type: "Box", weight: 2.5, quantity: 1, description: "Laptop" },
  payment: { deliveryFee: 8500, isPaid: false },
  shipmentStatus: "awaiting_payment",
  createdAt: DATE,
  updatedAt: DATE,
};

const DROPOFF = {
  _id: "drp_7c31",
  customerUserId: USER_ID,
  user: { firstName: "Ada", lastName: "Obi", email: "ada.obi@example.com" },
  pickup: { address: "Jamestown hub, Yaba" },
  courier: "DHL",
  trackingNumber: "1Z999AA10123456784",
  description: "2 parcels",
  deliveryFee: 6000,
  file: "https://res.cloudinary.com/jamestown/image/upload/drop-off/receipt.jpg",
  isPaid: false,
  status: "pending",
  paid: false,
  createdAt: DATE,
  updatedAt: DATE,
};

const ORDER = {
  _id: "ord_5b7e2c",
  userId: USER_ID,
  items: [{ productId: PRODUCT_ID, quantity: 2, unitPrice: 45000, subtotal: 90000 }],
  total: 90000,
  status: "confirmed",
  checkoutRef: "CHK-20261015-7F3A",
  createdAt: DATE,
  updatedAt: DATE,
};

const CAMPAIGN = {
  _id: "e7c1a2b3-4d5e-4f60-8a9b-0c1d2e3f4a5b",
  subject: "Trade gift cards at better rates this weekend",
  preheader: "Amazon and Apple rates are up",
  content: "<p>Hi {{first_name}},</p><p>Rates are up this weekend…</p>",
  audience: "verified",
  status: "draft",
  stats: { total: 0, sent: 0, failed: 0 },
  createdBy: "ops@jamestown.ng",
  createdAt: DATE,
  updatedAt: DATE,
};

const NOTIFICATION = {
  _id: "n-5c2e9a1b",
  title: "Weekend rates",
  message: "Gift card rates are up until Sunday.",
  category: "custom",
  isRead: false,
  device: ["android", "ios"],
  push: { status: "sent", targeted: 4210, success: 4180, failure: 30 },
  createdAt: DATE,
  updatedAt: DATE,
};

const ALERT = {
  _id: "e3c7d559-8651-42f9-97e6-e5a782abbd11",
  dedupeKey: "large_payout:3f6c2a8e-1b7d-4c55-9e2a-6f1d0b9c7a41:intent:int_9f2c",
  ruleKey: "large_payout",
  ruleName: "Large bank withdrawal",
  severity: "medium",
  stage: "pre",
  action: "hold",
  outcome: "held",
  tier: "unverified",
  userId: USER_ID,
  customer: { firstName: "Ada", lastName: "Obi", email: "ada.obi@example.com", phoneNumber: "08012345678" },
  summary: "Bank withdrawal of ₦450,000 (threshold ₦300,000)",
  data: { amountNgn: 450000, params: { minAmount: 300000 } },
  transactionRefs: ["HOLD_3f7e725902fde39c3cf0"],
  hitCount: 1,
  hold: { txnId: "66f1c0a2b4d5e6f708192a3b", reference: "HOLD_3f7e725902fde39c3cf0", kind: "bank_payout", amount: 450000, state: "held" },
  status: "open",
  assignee: null,
  dueAt: "2026-10-16T09:30:00.000Z",
  notes: [],
  createdAt: DATE,
  updatedAt: DATE,
};
const CASE = {
  _id: "c1a2b3c4-d5e6-4f70-8a9b-0c1d2e3f4a5b",
  title: "Bola Ade: Money in, straight back out",
  userId: USER_ID,
  customer: { firstName: "Bola", lastName: "Ade", email: "bola@example.com" },
  alertIds: [ALERT._id],
  status: "open",
  assignee: "compliance@jamestown.ng",
  notes: [{ by: "compliance@jamestown.ng", text: "Looks like a mule account", at: DATE }],
  createdBy: "compliance@jamestown.ng",
  createdAt: DATE,
  updatedAt: DATE,
};
const RULE = {
  key: "large_payout",
  name: "Large bank withdrawal",
  description: "A single bank withdrawal at or above the threshold.",
  summaryTemplate: "Withdrawal of ₦{minAmount} or more",
  stage: "pre",
  channels: ["bank_payout"],
  supportsHold: true,
  defaults: { enabled: true, action: "alert", severity: "medium", params: { minAmount: 500000 } },
  paramInfo: { minAmount: "Withdrawal amount at or above (₦)" },
  enabled: true,
  action: "hold",
  severity: "medium",
  params: { minAmount: 300000 },
  tierOverrides: { bvn_verified: { minAmount: 900000 } },
  updatedBy: "compliance@jamestown.ng",
  updatedAt: DATE,
};
const MON_SETTINGS = {
  _id: "global",
  holdTimeoutMinutes: 120,
  onHoldTimeout: "release",
  reviewSlaHours: 24,
  notifyEmail: "jamestown.ng@gmail.com",
  notifyMinSeverity: "high",
};
const NO_PERMISSION = fail("You don't have permission to do this (Monitoring: canConfigure)", null);
const MON = "Transaction monitoring";

const NO_TOKEN = { auth: false, message: "Missing or malformed Authorization header" };
const NOT_ADMIN = { auth: false, message: "Forbidden: admin role required" };
const FORBIDDEN_INTERNAL = { error: "Forbidden" };

const PAGE = { page: 1, limit: 20 };

// ---------------------------------------------------------------- routes
const routes = [
  // ---------------------------------------------------------- Auth
  route("post", "/admin/login", {
    tag: "Auth",
    auth: "none",
    summary: "Admin login",
    description:
      "Returns a JWT valid for 90 days plus the admin's role permissions. Inactive or unverified admins can't log in, " +
      "and every admin request re-checks the account, so a deactivated admin's existing token stops working within 30 seconds.",
    body: { email: "ops@jamestown.ng", password: "Adm1n!pass" },
    required: ["email", "password"],
    responses: {
      200: ok("success", {
        email: "ops@jamestown.ng",
        is_user: true,
        role: "admin",
        token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImMyYTll…",
        token_type: "jwt",
        permissions: PERMISSIONS,
        expiresIn: 7776000,
      }),
      400: fail("Invalid username or password", null),
      403: described("Correct password, but the admin is inactive or unverified", fail("Your admin account is inactive. Contact an administrator.", null)),
      404: fail("Admin not found", null),
    },
  }),
  route("post", "/admin/signup", {
    tag: "Auth",
    auth: "none",
    summary: "Create an admin account",
    body: {
      firstName: "Tolu",
      lastName: "Bello",
      email: "ops@jamestown.ng",
      phoneNumber: "08031234567",
      password: "Adm1n!pass",
      role: "admin",
      roleId: ROLE_ID,
    },
    required: ["firstName", "lastName", "email", "phoneNumber", "password", "role", "roleId"],
    responses: {
      200: ok("success", {}),
      400: fail("An account already exists with this email"),
    },
  }),
  route("post", "/admin/verify/phone", {
    tag: "Auth",
    auth: "none",
    summary: "Verify the admin's phone (Twilio OTP) and log in",
    body: { phoneNumber: "+2348031234567", otp: "482913" },
    required: ["phoneNumber", "otp"],
    responses: {
      200: ok("success", { email: "ops@jamestown.ng", is_user: true, role: "admin", token: "eyJhbGciOi…", token_type: "jwt", expiresIn: 7776000 }),
      400: fail("Invalid 6-digit code", null),
      404: fail("User not found", null),
    },
  }),
  route("post", "/admin/resend-otp", {
    tag: "Auth",
    auth: "none",
    summary: "Resend the phone OTP",
    body: { phoneNumber: "+2348031234567" },
    required: ["phoneNumber"],
    responses: { 200: ok("success", {}), 400: fail("Unable to verify phone number", null) },
  }),
  route("post", "/admin/forgot-password", {
    tag: "Auth",
    auth: "none",
    summary: "Email a password-reset OTP",
    body: { email: "ops@jamestown.ng" },
    required: ["email"],
    responses: { 200: ok("Your password rest otp has been sent to your mail."), 404: fail("Admin not found") },
  }),
  route("post", "/admin/verify-otp", {
    tag: "Auth",
    auth: "none",
    summary: "Verify the password-reset OTP",
    body: { email: "ops@jamestown.ng", otp: "551203" },
    required: ["email", "otp"],
    responses: { 200: ok("OTP verified successfully."), 400: fail("Invalid OTP. Please try again.") },
  }),
  route("patch", "/admin/reset-password", {
    tag: "Auth",
    auth: "none",
    summary: "Set a new password (after /admin/verify-otp)",
    body: { email: "ops@jamestown.ng", newPassword: "N3w!Admin2026" },
    required: ["email", "newPassword"],
    responses: {
      200: ok("Password reset successfully."),
      403: fail("You cannot verify your password without verifying your OTP."),
    },
  }),

  // ---------------------------------------------------------- Admins, roles & settings
  route("get", "/admin", {
    tag: "Admins & roles",
    auth: "none",
    summary: "List admins",
    responses: { 200: ok("Admins fetched", { admins: [{ ...ADMIN, roleId: ROLE }] }) },
  }),
  route("get", "/admin/roles", {
    tag: "Admins & roles",
    summary: "List roles",
    responses: { 200: ok("Role fetched", { roles: [ROLE] }), 401: NO_TOKEN, 403: NOT_ADMIN },
  }),
  route("get", "/admin/roles/permissions", {
    tag: "Admins & roles",
    summary: "Permission modules available when building a role",
    responses: {
      200: ok("Permissions fetched", {
        permissionFeatures: [
          { module: "Dashboard", permissions: { canView: false } },
          { module: "Trade", permissions: { canCreate: false, canView: false, canUpdate: false, canDelete: false, canTreat: false } },
        ],
      }),
    },
  }),
  route("post", "/admin/roles", {
    tag: "Admins & roles",
    summary: "Create a role",
    body: { title: "Support", permissions: PERMISSIONS.slice(0, 2) },
    required: ["title"],
    responses: { 200: ok("Role created", [{ ...ROLE, title: "Support" }]), 400: fail("Role already exists") },
  }),
  route("patch", "/admin/roles/:id", {
    tag: "Admins & roles",
    summary: "Update a role",
    params: { id: ROLE_ID },
    body: { title: "Manager", permissions: PERMISSIONS },
    responses: { 200: ok("Role updated", { acknowledged: true, modifiedCount: 1 }), 404: fail("Role does not exists") },
  }),
  route("delete", "/admin/roles/:id", {
    tag: "Admins & roles",
    summary: "Delete a role (only if unassigned)",
    params: { id: ROLE_ID },
    responses: { 200: ok("Role delete", { acknowledged: true, deletedCount: 1 }), 500: fail("Role currently assigned") },
  }),
  route("get", "/admin/settings", {
    tag: "Admins & roles",
    summary: "The logged-in admin's profile",
    responses: { 200: ok("Settings fetched", ADMIN), 404: fail("Admin not found") },
  }),
  route("patch", "/admin/settings", {
    tag: "Admins & roles",
    summary: "Update the admin's profile (multipart, optional avatar)",
    form: { firstName: "Tolu", lastName: "Bello", phoneNumber: "08031234567", location: "Lagos", cardImage: "<file>" },
    responses: { 200: ok("Settings updated", ADMIN) },
  }),
  route("delete", "/admin/settings", {
    tag: "Admins & roles",
    summary: "Delete the admin's own account",
    responses: { 200: ok("Account deleted", {}) },
  }),
  route("patch", "/admin/settings/change-password", {
    tag: "Admins & roles",
    summary: "Change password",
    description: "At least 8 characters, with a number and a special character.",
    body: { currentPassword: "Adm1n!pass", newPassword: "N3w!Admin2026", confirmNewPassword: "N3w!Admin2026" },
    required: ["currentPassword", "newPassword", "confirmNewPassword"],
    responses: {
      200: ok("Password changed successfully", {}),
      400: fail("Current password is incorrect"),
    },
  }),

  // ---------------------------------------------------------- Dashboard
  route("get", "/admin/dashboard/summary", {
    tag: "Dashboard",
    summary: "Dashboard cards",
    responses: {
      200: ok("Dashboard summary", {
        nairaTransactions: 18450000,
        cryptoTransactions: 6400000,
        giftcardTransactions: 3100000,
        deposits: 18450000,
        withdrawals: 9120000,
        usersFiatBalance: 4210000,
        cryptoBalances: [{ _id: "btc", totalAmount: 0.42 }],
        productSold: 1460,
        orders: 820,
        totalCustomers: 5821,
        totalReferrals: 734,
      }),
    },
  }),
  route("get", "/admin/dashboard/latest-orders", {
    tag: "Dashboard",
    summary: "Latest orders",
    query: { limit: 6 },
    responses: { 200: ok("Latest orders", [ORDER]) },
  }),
  route("get", "/admin/dashboard/top-products", {
    tag: "Dashboard",
    summary: "Best-selling products",
    query: { limit: 3 },
    responses: { 200: ok("Top products", [{ productId: PRODUCT_ID, sold: 64, revenue: 2880000, product: PRODUCT }]) },
  }),

  // ---------------------------------------------------------- Customers
  route("get", "/admin/users", {
    tag: "Customers",
    summary: "List customers with their risk level",
    query: {
      page: 1,
      limit: 10,
      search: { example: "ada", description: "Name, email or phone" },
      verified: { example: "1", enum: ["1", "0"] },
      active: { example: "1", enum: ["1", "0"] },
    },
    responses: { 200: ok("Users fetched", { page: 1, limit: 10, total: 1, customers: [{ ...CUSTOMER, risk: RISK }] }) },
  }),
  route("get", "/admin/users/metrics", {
    tag: "Customers",
    summary: "Customer growth cards and chart",
    query: { windowDays: 30 },
    responses: {
      200: ok("Users metrics fetched", {
        cards: { totalCustomers: 5821, newCustomers: 412, returningCustomers: 1290, conversionRate: 22 },
        series: [{ year: 2026, month: 10, label: "Oct", newCustomers: 412, returningCustomers: 230 }],
      }),
    },
  }),
  route("get", "/admin/users/:id", {
    tag: "Customers",
    summary: "Customer details: profile, balances, activity and risk",
    params: { id: USER_ID },
    responses: {
      200: ok("OK", {
        profile: { ...CUSTOMER, phoneVerifiedAt: null, imageUrl: null },
        location: "Lagos, Lagos",
        ordersCount: 0,
        holdings: { accountNumber: "6612345678", fiatBalance: "25000.00", btcBalance: 0, usdtBalance: 0, usdcBalance: 0 },
        activity: ACTIVITY,
        risk: RISK,
      }),
      404: fail("Not found"),
    },
  }),
  route("get", "/admin/users/:id/transactions", {
    tag: "Customers",
    summary: "A customer's transactions",
    params: { id: USER_ID },
    query: { page: 1, limit: 10, mode: { example: "payout", enum: ["card", "bank", "crypto", "wallet", "payout"] }, status: { example: "completed" } },
    responses: { 200: ok("OK", { page: 1, limit: 10, total: 1, transactions: [TRANSACTION] }) },
  }),
  route("get", "/admin/users/:id/orders", {
    tag: "Customers",
    summary: "A customer's orders",
    params: { id: USER_ID },
    query: { page: 1, limit: 10, status: { example: "confirmed" } },
    responses: { 200: ok("OK", { page: 1, limit: 10, total: 1, orders: [ORDER] }) },
  }),
  route("patch", "/admin/users/:id/status", {
    tag: "Customers",
    summary: "Activate / deactivate a customer",
    params: { id: USER_ID },
    body: { isActive: false },
    required: ["isActive"],
    responses: { 200: ok("OK", { _id: USER_ID, isActive: false }), 400: fail("Failed") },
  }),
  route("patch", "/admin/users/:id/risk", {
    tag: "Customers",
    summary: "Set a customer's risk level manually",
    description: "`auto` clears the manual level so the computed one applies again.",
    params: { id: USER_ID },
    body: { level: "high", note: "Chargeback reported by bank" },
    required: ["level"],
    responses: {
      200: ok("Risk level updated", {
        _id: USER_ID,
        riskOverride: { level: "high", note: "Chargeback reported by bank", setBy: "ops@jamestown.ng", setAt: DATE },
      }),
      400: fail("level must be low, medium, high or auto"),
      404: fail("Not found"),
    },
  }),

  // ---------------------------------------------------------- BVN watchlist
  route("get", "/admin/bvn-watchlist", {
    tag: "BVN watchlist",
    summary: "List watchlisted BVNs and whether they're on our system",
    description:
      "The returned page is re-checked live against wallet BVNs. Any customer found with a listed BVN who isn't flagged yet " +
      "is flagged and deactivated, and compliance is emailed. If the live check fails, the last known status is shown " +
      "with a `warning`.",
    query: {
      page: 1,
      limit: 20,
      search: { example: "2220", description: "BVN, name or reason" },
      onSystem: { example: "true", enum: ["true", "false"] },
    },
    responses: {
      200: ok("Watchlist fetched", {
        page: 1,
        limit: 20,
        total: 1,
        entries: [
          {
            _id: "8c1f2e3d-4b5a-4c6d-9e8f-0a1b2c3d4e5f",
            bvn: "22200000001",
            name: "Known fraud ring",
            reason: "Reported by bank",
            source: "manual",
            addedBy: "ops@jamestown.ng",
            onSystem: true,
            matches: [{ userId: USER_ID, source: "watchlist_added", matchedAt: DATE, flagged: true }],
            lastCheckedAt: DATE,
            createdAt: DATE,
            updatedAt: DATE,
            users: [
              { userId: USER_ID, firstName: "Ada", lastName: "Obi", email: "ada.obi@example.com", phoneNumber: "08012345678", flagged: true, matchedAt: DATE },
            ],
          },
        ],
      }),
    },
  }),
  route("get", "/admin/bvn-watchlist/summary", {
    tag: "BVN watchlist",
    summary: "Watchlist totals",
    responses: { 200: ok("Watchlist summary", { total: 240, onSystem: 3, notOnSystem: 237, flaggedAccounts: 3 }) },
  }),
  route("post", "/admin/bvn-watchlist", {
    tag: "BVN watchlist",
    summary: "Add one BVN",
    description: "Customers who already have this BVN are flagged and deactivated straight away, and compliance is emailed.",
    body: { bvn: "22200000001", name: "Known fraud ring", reason: "Reported by bank" },
    required: ["bvn"],
    responses: {
      201: ok("BVN added. 1 matching account was flagged and deactivated.", {
        entry: { _id: "8c1f2e3d-4b5a-4c6d-9e8f-0a1b2c3d4e5f", bvn: "22200000001", name: "Known fraud ring", onSystem: true },
        flaggedAccounts: 1,
      }),
      400: fail("BVN must be 11 digits"),
      409: fail("This BVN is already on the watchlist"),
    },
  }),
  route("post", "/admin/bvn-watchlist/upload", {
    tag: "BVN watchlist",
    summary: "Add BVNs in bulk from a CSV",
    description:
      "CSV columns: `bvn,name,reason` (header optional; with a header the order doesn't matter). Max 2MB / 20,000 rows. " +
      "Invalid rows are skipped and reported (first 200 listed). Matching customers are flagged as with a single add.",
    form: { file: "<file>" },
    required: ["file"],
    responses: {
      201: ok("1 BVN(s) added to the watchlist", {
        summary: { rows: 4, added: 1, alreadyListed: 1, duplicatesInFile: 1, invalid: 1, onSystem: 0, flaggedAccounts: 0 },
        invalid: [{ line: 4, value: "abc123", error: "BVN must be 11 digits" }],
      }),
      400: fail("File must be a .csv"),
    },
  }),
  route("delete", "/admin/bvn-watchlist/:id", {
    tag: "BVN watchlist",
    summary: "Remove a BVN from the watchlist",
    description: "Customers already flagged stay deactivated; reactivate them from the customer page after review.",
    params: { id: "8c1f2e3d-4b5a-4c6d-9e8f-0a1b2c3d4e5f" },
    responses: { 200: ok("BVN removed from the watchlist"), 404: fail("Entry not found") },
  }),

  // ---------------------------------------------------------- Transaction monitoring
  route("get", "/admin/monitoring/dashboard", {
    tag: MON,
    summary: "Monitoring overview (needs Monitoring: canView)",
    responses: {
      200: ok("Monitoring dashboard", {
        openAlerts: { high: 6, medium: 11, low: 1, total: 18 },
        overdueAlerts: 0,
        openCases: 1,
        held: { heldCount: 1, heldNairaAmount: 450000, heldCryptoCount: 0 },
        avgReviewHours: 3.2,
        alertsLast7Days: [{ date: "2026-10-16", count: 19 }],
        topRules: [{ ruleKey: "new_account_outflow", name: "New account moving large amounts", count: 6 }],
      }),
      403: NO_PERMISSION,
    },
  }),
  route("get", "/admin/monitoring/alerts", {
    tag: MON,
    summary: "Alert queue",
    query: {
      page: 1,
      limit: 20,
      status: { example: "active", enum: ["active", "open", "in_review", "dismissed", "escalated", "resolved", "all"], description: "active = open + in review" },
      severity: { example: "high", enum: ["low", "medium", "high"] },
      ruleKey: { example: "large_payout" },
      userId: { example: USER_ID },
      assignee: { example: "compliance@jamestown.ng" },
      held: { example: "true", description: "Only alerts with a payment still held" },
      overdue: { example: "true" },
      search: { example: "Ada" },
    },
    responses: { 200: ok("Alerts fetched", { page: 1, limit: 20, total: 1, alerts: [ALERT] }) },
  }),
  route("get", "/admin/monitoring/alerts/:id", {
    tag: MON,
    summary: "Alert detail, with the customer's other alerts and linked case",
    params: { id: ALERT._id },
    responses: {
      200: ok("Alert fetched", { ...ALERT, related: [{ _id: "a2", ruleName: "Many withdrawals in 24 hours", severity: "medium", status: "open", summary: "3 bank withdrawals totalling ₦1,170,000 in 24 hours", createdAt: DATE }], case: null }),
      404: fail("Alert not found"),
    },
  }),
  route("patch", "/admin/monitoring/alerts/:id", {
    tag: MON,
    summary: "Assign, change status or add a note (needs Monitoring: canUpdate)",
    description: "`assignee: \"me\"` assigns to the caller. Dismissing or resolving needs a `resolution` and isn't allowed while a payment is held.",
    params: { id: ALERT._id },
    body: { assignee: "me", status: "in_review", note: "Called the customer" },
    responses: {
      200: ok("Alert updated", { ...ALERT, status: "in_review", assignee: "compliance@jamestown.ng" }),
      400: fail("Release or reject the held payment first"),
    },
  }),
  route("post", "/admin/monitoring/alerts/:id/release", {
    tag: MON,
    summary: "Release the payment held by this alert",
    params: { id: ALERT._id },
    responses: {
      200: ok("Hold processed", { ok: true, state: "released", message: "Released", alert: { ...ALERT, hold: { ...ALERT.hold, state: "released", resolvedBy: "compliance@jamestown.ng", resolvedAt: DATE } } }),
      409: fail("Payment already released"),
    },
  }),
  route("post", "/admin/monitoring/alerts/:id/reject", {
    tag: MON,
    summary: "Reject the held payment and refund the customer",
    params: { id: ALERT._id },
    body: { reason: "Customer couldn't confirm the payment" },
    required: ["reason"],
    responses: {
      200: ok("Hold processed", { ok: true, state: "rejected", message: "Rejected and refunded", alert: { ...ALERT, hold: { ...ALERT.hold, state: "rejected" } } }),
      400: fail("Give a reason for rejecting"),
    },
  }),
  route("post", "/admin/monitoring/alerts/:id/escalate", {
    tag: MON,
    summary: "Escalate into a case",
    description: "Joins the customer's open case if there is one, otherwise opens a new case.",
    params: { id: ALERT._id },
    body: { note: "Looks like a mule account", title: "" },
    responses: { 200: ok("Alert escalated", CASE) },
  }),
  route("get", "/admin/monitoring/cases", {
    tag: MON,
    summary: "Cases",
    query: { page: 1, limit: 20, status: { example: "open", enum: ["open", "closed", "all"] }, userId: { example: USER_ID } },
    responses: { 200: ok("Cases fetched", { page: 1, limit: 20, total: 1, cases: [CASE] }) },
  }),
  route("get", "/admin/monitoring/cases/:id", {
    tag: MON,
    summary: "Case detail with its alerts and timeline",
    params: { id: CASE._id },
    responses: {
      200: ok("Case fetched", { ...CASE, alerts: [ALERT], timeline: [{ _id: "l1", actor: "compliance@jamestown.ng", action: "alert.escalate", targetType: "alert", targetId: ALERT._id, at: DATE }] }),
      404: fail("Case not found"),
    },
  }),
  route("patch", "/admin/monitoring/cases/:id", {
    tag: MON,
    summary: "Add a note, take ownership, restrict the account, close or reopen",
    description: "Closing needs an `outcome` and resolves the case's open alerts. `restrictAccount: true` deactivates the customer.",
    params: { id: CASE._id },
    body: { status: "closed", outcome: "account_restricted", restrictAccount: true, note: "Confirmed mule activity" },
    responses: {
      200: ok("Case updated", { ...CASE, status: "closed", outcome: "account_restricted", alerts: [], timeline: [] }),
      400: fail("outcome must be one of no_action, account_restricted, reported, other"),
    },
  }),
  route("get", "/admin/monitoring/holds", {
    tag: MON,
    summary: "Held payments",
    query: { state: { example: "held", enum: ["held", "released", "rejected", "failed", "all"] }, page: 1, limit: 20 },
    responses: { 200: ok("Holds fetched", { page: 1, limit: 20, total: 1, holds: [], summary: { heldCount: 1, heldNairaAmount: 450000, heldCryptoCount: 0 } }) },
  }),
  route("get", "/admin/monitoring/customers/:userId", {
    tag: MON,
    summary: "A customer's alerts, cases and normalised 30-day ledger",
    params: { userId: USER_ID },
    query: { days: 30 },
    responses: {
      200: ok("Customer monitoring", {
        alerts: [ALERT],
        cases: [CASE],
        ledger: { userId: USER_ID, days: 30, entries: [{ reference: "DEP1", direction: "in", channel: "deposit", amountNgn: 200000, status: "completed", at: DATE }], totals: [{ direction: "in", channel: "deposit", count: 1, amountNgn: 200000 }] },
      }),
    },
  }),
  route("post", "/admin/monitoring/customers/:userId/rescan", {
    tag: MON,
    summary: "Re-run pattern rules over the customer's last 30 days",
    params: { userId: USER_ID },
    responses: { 200: ok("Customer rescanned", { hits: 1 }) },
  }),
  route("get", "/admin/monitoring/rules", {
    tag: MON,
    summary: "Rules with their current settings",
    responses: { 200: ok("Rules fetched", [RULE]) },
  }),
  route("patch", "/admin/monitoring/rules/:key", {
    tag: MON,
    summary: "Change a rule (needs Monitoring: canConfigure)",
    description:
      "`action: \"hold\"` is only allowed on rules with `supportsHold` (bank withdrawals and crypto sends). " +
      "`tierOverrides` sets different thresholds for `unverified` and `bvn_verified` customers. Changes apply within a minute.",
    params: { key: "large_payout" },
    body: { enabled: true, action: "hold", severity: "medium", params: { minAmount: 300000 }, tierOverrides: { bvn_verified: { minAmount: 900000 } } },
    responses: {
      200: ok("Rule updated", RULE),
      400: fail("This rule can only raise alerts"),
      403: NO_PERMISSION,
      404: fail("Rule not found"),
    },
  }),
  route("post", "/admin/monitoring/rules/:key/simulate", {
    tag: MON,
    summary: "Backtest proposed settings before saving them",
    params: { key: "large_payout" },
    body: { params: { minAmount: 150000 }, tierOverrides: { bvn_verified: { minAmount: 900000 } }, days: 30 },
    responses: {
      200: ok("Simulation complete", {
        ruleKey: "large_payout",
        days: 30,
        evaluated: 412,
        alerts: 9,
        customers: 6,
        alertsPerDay: 0.3,
        perDay: { "2026-10-15": 2 },
        sample: [{ userId: USER_ID, name: "Ada Obi", at: DATE, tier: "unverified", summary: "Bank withdrawal of ₦450,000 (threshold ₦150,000)" }],
        truncated: false,
      }),
    },
  }),
  route("get", "/admin/monitoring/settings", {
    tag: MON,
    summary: "Hold timeout, review deadline and email settings",
    responses: { 200: ok("Settings fetched", MON_SETTINGS) },
  }),
  route("patch", "/admin/monitoring/settings", {
    tag: MON,
    summary: "Update monitoring settings (needs Monitoring: canConfigure)",
    description:
      "`onHoldTimeout`: what happens to a held payment nobody reviews within `holdTimeoutMinutes` — `release` (send it), " +
      "`reject` (refund) or `keep` (wait for a person). `notifyMinSeverity` can be `off`.",
    body: { holdTimeoutMinutes: 120, onHoldTimeout: "release", reviewSlaHours: 24, notifyEmail: "jamestown.ng@gmail.com", notifyMinSeverity: "high" },
    responses: { 200: ok("Settings updated", MON_SETTINGS), 403: NO_PERMISSION },
  }),
  route("get", "/admin/monitoring/audit", {
    tag: MON,
    summary: "Audit log of monitoring decisions",
    query: { page: 1, limit: 50, action: { example: "hold", description: "Prefix, e.g. rule, settings, hold, alert, case" }, actor: { example: "compliance@jamestown.ng" }, targetId: { example: ALERT._id } },
    responses: {
      200: ok("Audit log fetched", {
        page: 1,
        limit: 50,
        total: 1,
        entries: [{ _id: "l1", actor: "compliance@jamestown.ng", action: "hold.release", targetType: "alert", targetId: ALERT._id, details: { txnId: "66f1c0a2b4d5e6f708192a3b", state: "released" }, at: DATE }],
      }),
    },
  }),

  // ---------------------------------------------------------- Withdrawals
  route("get", "/admin/withdrawals", {
    tag: "Withdrawals",
    summary: "All outgoing withdrawals with the customer attached",
    query: {
      page: 1,
      limit: 20,
      kind: { example: "fiat", enum: ["fiat", "crypto", "all"], description: "Bank payouts, crypto sends, or both" },
      status: { example: "pending", enum: ["pending", "completed", "failed", "refunded"] },
      search: { example: "0123456789", description: "Reference, account no, beneficiary, customer name/email/phone" },
      userId: { example: USER_ID },
      from: { example: "2026-10-01" },
      to: { example: "2026-10-31" },
    },
    responses: {
      200: ok("Withdrawals fetched", {
        page: 1,
        limit: 20,
        total: 1,
        withdrawals: [
          {
            ...TRANSACTION,
            customer: { id: USER_ID, firstName: "Ada", lastName: "Obi", email: "ada.obi@example.com", phoneNumber: "08012345678" },
          },
        ],
      }),
    },
  }),
  route("get", "/admin/withdrawals/summary", {
    tag: "Withdrawals",
    summary: "Bank payout totals",
    responses: {
      200: ok("Withdrawal summary fetched", {
        totalCount: 1240,
        completedAmount: 9120000,
        pendingCount: 6,
        pendingAmount: 84000,
        failedCount: 22,
        last24hCount: 41,
        last24hAmount: 610000,
      }),
    },
  }),

  // ---------------------------------------------------------- Trades
  route("get", "/admin/trade/crypto", {
    tag: "Trades",
    summary: "Crypto (or gift card) transactions",
    description: "Pass `giftcard=true` for gift card trades instead of crypto.",
    query: {
      page: 1,
      cryptoType: { example: "buy", enum: ["buy", "sell", "send", "receive"] },
      coin: { example: "btc" },
      giftcard: { example: "true" },
      transactionType: { example: "sell", enum: ["buy", "sell"] },
    },
    responses: { 200: ok("Crypto Transaction fetched", { total: 1, transactions: [CRYPTO_TX] }) },
  }),
  route("get", "/admin/trade/metrics", {
    tag: "Trades",
    summary: "Trade totals ([0] crypto/gift card trades, [1] gift card request counts)",
    responses: {
      200: ok("Crypto Transaction fetched", [
        {
          totalCompletedCryptoTrades: 820,
          totalCompletedGiftCardTrades: 340,
          totalCryptoTrades: 860,
          totalGiftCardTrades: 372,
          totalGiftCardAmount: [{ _id: null, fieldN: 3100000 }],
          totalCompletedGiftCardAmount: [{ _id: null, fieldN: 2900000 }],
          totalCryptoAmount: [{ _id: null, fieldN: 6400000 }],
          totalCompletedCryptoAmount: [{ _id: null, fieldN: 6100000 }],
        },
        { pending: 12, completed: 340, declined: 18, processing: 4 },
      ]),
    },
  }),
  route("get", "/admin/trade/charts", {
    tag: "Trades",
    summary: "Monthly trade volume",
    responses: {
      200: ok("Crypto Transaction fetched", {
        cryptoSeries: [{ month: "Oct", totalAmount: 1200000 }],
        giftCardSeries: [{ month: "Oct", totalAmount: 640000 }],
      }),
    },
  }),
  route("get", "/admin/trade/gift-card-requests", {
    tag: "Trades",
    summary: "Gift card sell requests",
    query: { status: { example: "pending", enum: ["pending", "processing", "completed", "declined"] } },
    responses: { 200: ok("Gift card request fetched", { requests: [GIFTCARD_REQUEST], total: 1 }) },
  }),
  route("patch", "/admin/trade/gift-card/:id/status", {
    tag: "Trades",
    summary: "Accept, approve or decline a gift card request",
    description:
      "`processing` = accepted for review, `completed` = approved (credits the user's wallet), `declined` needs a `reason`. " +
      "The user is emailed and gets a push notification.",
    params: { id: GIFTCARD_REQUEST._id },
    body: { status: "completed", reason: "" },
    required: ["status"],
    responses: { 200: ok("Gift card request fetched", { ...GIFTCARD_REQUEST, status: "processing" }) },
  }),

  // ---------------------------------------------------------- Rates
  route("get", "/admin/rates", {
    tag: "Rates",
    summary: "List rates by type",
    query: {
      type: { example: "sell-giftcard", required: true, enum: ["giftcard", "sell-giftcard", "shipping", "crypto", "sell-crypto"] },
      country: { example: "USA" },
      category: { example: "E code" },
      weight: { example: 2.5, description: "Shipping only" },
      product: { example: "Laptop", description: "Shipping only" },
    },
    responses: { 200: ok("Rates fetched successfully", [RATE]), 400: fail("Query parameter `type` is required") },
  }),
  route("post", "/admin/rates", {
    tag: "Rates",
    summary: "Create a rate (multipart, optional image)",
    description: "Shipping rates also need `category`, `product` (or `products[]`) and `weight` or `range`.",
    form: {
      type: "sell-giftcard",
      name: "Amazon",
      country: "USA",
      category: "E code",
      "range[min]": 25,
      "range[max]": 500,
      rate: 1450,
      image: "<file>",
    },
    required: ["type", "name", "rate"],
    responses: {
      201: ok("sell-giftcard rate created successfully", RATE),
      400: fail("`name` and `rate` are required"),
    },
  }),
  route("patch", "/admin/rates/:id", {
    tag: "Rates",
    summary: "Update a rate's value (multipart, optional image)",
    params: { id: RATE._id },
    form: { rate: 1480, image: "<file>" },
    responses: { 200: ok("Rate updated successfully", { ...RATE, rate: 1480 }), 404: fail("Rate not found") },
  }),
  route("delete", "/admin/rates/:id", {
    tag: "Rates",
    summary: "Delete a rate",
    params: { id: RATE._id },
    responses: { 200: ok("Rate deleted successfully", RATE) },
  }),
  route("get", "/admin/platform-rate", {
    tag: "Rates",
    summary: "Platform naira rate",
    responses: { 200: ok("Rate updated successfully", { _id: "plat_1", rate: 1520, createdAt: DATE, updatedAt: DATE }) },
  }),
  route("post", "/admin/platform-rate", {
    tag: "Rates",
    summary: "Set the platform naira rate",
    body: { rate: 1520 },
    required: ["rate"],
    responses: { 200: ok("Rate updated successfully", { _id: "plat_1", rate: 1520 }) },
  }),

  // ---------------------------------------------------------- Notifications & email
  route("get", "/admin/notifications", {
    tag: "Notifications & email",
    summary: "Notification history",
    query: { page: 1, limit: 20 },
    responses: { 200: ok("Notification fetched", { total: 1, notifications: [NOTIFICATION] }) },
  }),
  route("post", "/admin/notifications", {
    tag: "Notifications & email",
    summary: "Send a push notification to all customers",
    description:
      "`device` limits delivery to android and/or ios; empty or both means everyone. " +
      "`push.status` is `skipped` when Firebase is not configured.",
    body: { title: "Weekend rates", message: "Gift card rates are up until Sunday.", device: ["android", "ios"], category: "custom" },
    required: ["title", "message"],
    responses: { 200: ok("Notification created", NOTIFICATION), 500: fail("Could not create Notifications") },
  }),
  route("get", "/admin/email-campaigns", {
    tag: "Notifications & email",
    summary: "List email campaigns (without content)",
    query: { page: 1, limit: 20, status: { example: "sent", enum: ["draft", "sending", "sent", "partially_sent", "failed"] } },
    responses: {
      200: ok("Campaigns fetched", {
        ...PAGE,
        total: 1,
        campaigns: [{ ...CAMPAIGN, content: undefined, status: "sent", stats: { total: 4310, sent: 4310, failed: 0 }, sentAt: DATE }],
      }),
    },
  }),
  route("get", "/admin/email-campaigns/audience-count", {
    tag: "Notifications & email",
    summary: "How many customers an audience reaches",
    description: "Excludes customers who opted out of emails.",
    query: { audience: { example: "verified", enum: ["all", "verified", "unverified", "phone_verified"] } },
    responses: { 200: ok("OK", { audience: "verified", count: 4310 }) },
  }),
  route("post", "/admin/email-campaigns/preview", {
    tag: "Notifications & email",
    summary: "Render the full email (header + content + footer)",
    description: "Merge tags (`{{first_name}}`, `{{last_name}}`) are filled with sample values.",
    body: { subject: CAMPAIGN.subject, preheader: CAMPAIGN.preheader, content: CAMPAIGN.content },
    responses: { 200: ok("OK", { html: "<!DOCTYPE html><html lang=\"en\">…<p>Hi Ada,</p>…</html>" }) },
  }),
  route("post", "/admin/email-campaigns/test", {
    tag: "Notifications & email",
    summary: "Send a test email to one address",
    body: { email: "ops@jamestown.ng", subject: CAMPAIGN.subject, preheader: CAMPAIGN.preheader, content: CAMPAIGN.content },
    required: ["email", "subject", "content"],
    responses: {
      200: ok("Test email sent to ops@jamestown.ng"),
      400: fail("A valid test email is required"),
      502: fail("Failed to send test email"),
    },
  }),
  route("post", "/admin/email-campaigns", {
    tag: "Notifications & email",
    summary: "Save a draft, or create and send with `send: true`",
    description: "Sending runs in the background; poll `GET /admin/email-campaigns/{id}` for progress.",
    body: { subject: CAMPAIGN.subject, preheader: CAMPAIGN.preheader, content: CAMPAIGN.content, audience: "verified", send: false },
    required: ["subject", "content"],
    responses: {
      201: ok("Draft saved", CAMPAIGN),
      400: fail("Email content is required"),
    },
  }),
  route("get", "/admin/email-campaigns/:id", {
    tag: "Notifications & email",
    summary: "Get a campaign (with delivery progress)",
    params: { id: CAMPAIGN._id },
    responses: {
      200: ok("Campaign fetched", { ...CAMPAIGN, status: "sending", stats: { total: 1500, sent: 1500, failed: 0 }, sentBy: "ops@jamestown.ng", startedAt: DATE }),
      404: fail("Campaign not found"),
    },
  }),
  route("patch", "/admin/email-campaigns/:id", {
    tag: "Notifications & email",
    summary: "Edit a draft",
    params: { id: CAMPAIGN._id },
    body: { subject: CAMPAIGN.subject, preheader: CAMPAIGN.preheader, content: CAMPAIGN.content, audience: "all" },
    required: ["subject", "content"],
    responses: { 200: ok("Draft updated", { ...CAMPAIGN, audience: "all" }), 400: fail("Only drafts can be edited") },
  }),
  route("post", "/admin/email-campaigns/:id/send", {
    tag: "Notifications & email",
    summary: "Send a draft",
    description: "A campaign can only be sent once.",
    params: { id: CAMPAIGN._id },
    responses: {
      200: ok("Campaign is sending", { ...CAMPAIGN, status: "sending", sentBy: "ops@jamestown.ng", startedAt: DATE }),
      400: fail("Campaign not found or already sent"),
    },
  }),
  route("delete", "/admin/email-campaigns/:id", {
    tag: "Notifications & email",
    summary: "Delete a draft",
    params: { id: CAMPAIGN._id },
    responses: { 200: ok("Draft deleted"), 400: fail("Only drafts can be deleted") },
  }),
  route("get", "/admin/banners", {
    tag: "Notifications & email",
    summary: "List app banners",
    query: { page: 1, limit: 20, section: { example: "home", enum: ["home", "shop"] } },
    responses: { 200: ok("Banner fetched", { ...PAGE, total: 1, banners: [BANNER] }) },
  }),
  route("post", "/admin/banners", {
    tag: "Notifications & email",
    summary: "Create a banner",
    body: { title: BANNER.title, description: BANNER.description, isActive: true, color: "#0a2540", position: "top", section: "home", actionUrl: BANNER.actionUrl },
    required: ["title"],
    responses: { 200: ok("Banner created", [BANNER]) },
  }),
  route("patch", "/admin/banners/:id", {
    tag: "Notifications & email",
    summary: "Update a banner",
    params: { id: BANNER._id },
    body: { isActive: false },
    responses: { 200: ok("Banner updated", { acknowledged: true, modifiedCount: 1 }), 500: fail("Banner does not exists") },
  }),
  route("delete", "/admin/banners/:id", {
    tag: "Notifications & email",
    summary: "Delete a banner",
    params: { id: BANNER._id },
    responses: { 200: ok("Banner delete", { acknowledged: true, deletedCount: 1 }) },
  }),

  // ---------------------------------------------------------- Products & categories
  route("get", "/admin/products", {
    tag: "Products & categories",
    auth: "none",
    summary: "List products",
    query: {
      page: 1,
      limit: 20,
      search: { example: "tote" },
      category_id: { example: "cat_bags" },
      subcategory: { example: "Totes" },
      brand: { example: "Jamestown" },
      price_min: { example: 10000 },
      price_max: { example: 100000 },
      in_stock: { example: "true" },
      sortBy: { example: "updated_at" },
      order: { example: "desc", enum: ["asc", "desc"] },
    },
    responses: { 200: ok("Products fetched", { page: 1, limit: 20, total: 1, pages: 1, products: [PRODUCT] }) },
  }),
  route("get", "/admin/products/:id", {
    tag: "Products & categories",
    auth: "none",
    summary: "Get a product",
    params: { id: PRODUCT_ID },
    responses: { 200: ok("Product fetched", PRODUCT), 404: fail("Product not found") },
  }),
  route("post", "/admin/add/product", {
    tag: "Products & categories",
    summary: "Create a product (multipart, up to 4 images)",
    description: "`variants` is a JSON string. Upload images as `product_image` (repeat the field).",
    form: {
      title: "Leather Tote Bag",
      category_id: "cat_bags",
      subcategory: "Totes",
      price: 45000,
      brand: "Jamestown",
      gender: "Unisex",
      description: "Full-grain leather tote with inner zip pocket.",
      stock: 12,
      variants: '[{"name":"Colour","value":"Brown","qty":12}]',
      product_image: "<file>",
    },
    required: ["title", "category_id", "price"],
    responses: { 201: ok("Product created", PRODUCT), 400: fail("title, category_id and price are required") },
  }),
  route("patch", "/admin/products/:id", {
    tag: "Products & categories",
    summary: "Update a product (multipart)",
    params: { id: PRODUCT_ID },
    form: { price: 42000, stock: 20, product_image: "<file>" },
    responses: { 200: ok("Product updated", { ...PRODUCT, price: 42000, stock: 20 }), 404: fail("Product not found") },
  }),
  route("delete", "/admin/products/:id", {
    tag: "Products & categories",
    summary: "Soft-delete a product",
    params: { id: PRODUCT_ID },
    responses: { 200: ok("Product deleted", { ...PRODUCT, isDeleted: true, deletedAt: DATE }), 404: fail("Product not found") },
  }),
  route("get", "/admin/products/:id/clicks", {
    tag: "Products & categories",
    auth: "none",
    summary: "Product view count",
    params: { id: PRODUCT_ID },
    responses: { 200: ok("Product views", { productId: PRODUCT_ID, views: 320, lastViewAt: DATE }) },
  }),
  route("get", "/admin/products/insights", {
    tag: "Products & categories",
    summary: "Sales chart, top sellers and sold-out products in one call",
    query: { months: 6, topLimit: 3, soldOutLimit: 6, page: 1 },
    responses: {
      200: ok("Product insights", {
        chart: { data: [{ year: 2026, month: 10, label: "Oct", units: 120, revenue: 5400000, orders: 88 }], momUnitsPct: 12 },
        topSelling: [{ productId: PRODUCT_ID, sold: 64, revenue: 2880000, product: PRODUCT }],
        soldOut: { page: 1, limit: 6, total: 0, products: [] },
      }),
    },
  }),
  route("get", "/admin/products/insights/series", {
    tag: "Products & categories",
    summary: "Monthly sales series",
    query: { months: 6 },
    responses: { 200: ok("Sales series", { data: [{ year: 2026, month: 10, label: "Oct", units: 120, revenue: 5400000, orders: 88 }], momUnitsPct: 12 }) },
  }),
  route("get", "/admin/products/insights/top-product", {
    tag: "Products & categories",
    summary: "Top-selling products",
    query: { limit: 3 },
    responses: { 200: ok("Top selling products", [{ productId: PRODUCT_ID, sold: 64, revenue: 2880000, product: PRODUCT }]) },
  }),
  route("get", "/admin/products/insights/sold-out", {
    tag: "Products & categories",
    summary: "Sold-out products",
    query: { page: 1, limit: 10 },
    responses: { 200: ok("Sold-out products", { page: 1, limit: 10, total: 1, products: [{ ...PRODUCT, stock: 0 }] }) },
  }),
  route("get", "/admin/categories", {
    tag: "Products & categories",
    auth: "none",
    summary: "List categories",
    responses: { 200: ok("Categories fetched", [CATEGORY]) },
  }),
  route("get", "/admin/categories/:id", {
    tag: "Products & categories",
    auth: "none",
    summary: "Get a category",
    params: { id: CATEGORY._id },
    responses: { 200: ok("Category fetched", CATEGORY), 404: fail("Category not found") },
  }),
  route("post", "/admin/categories", {
    tag: "Products & categories",
    summary: "Create a category (multipart, images as `category_image`)",
    form: { name: "Bags", description: "Bags and totes", subcategory: "Totes", category_image: "<file>" },
    required: ["name"],
    responses: { 201: ok("Category created", CATEGORY), 400: fail("Category name is required") },
  }),
  route("patch", "/admin/categories/:id", {
    tag: "Products & categories",
    summary: "Update a category",
    params: { id: CATEGORY._id },
    body: { name: "Bags", description: "Bags, totes and backpacks", subcategory: ["Totes", "Backpacks"], imageUrls: CATEGORY.imageUrls },
    responses: { 200: ok("Category updated", CATEGORY), 404: fail("Category not found") },
  }),
  route("delete", "/admin/categories/:id", {
    tag: "Products & categories",
    summary: "Delete a category",
    params: { id: CATEGORY._id },
    responses: { 200: ok("Category deleted", CATEGORY), 404: fail("Category not found") },
  }),

  // ---------------------------------------------------------- Orders
  route("get", "/admin/orders", {
    tag: "Orders",
    summary: "List orders",
    query: { page: 1, limit: 20, status: { example: "confirmed" }, q: { example: "CHK-2026" }, from: { example: "2026-10-01" }, to: { example: "2026-10-31" } },
    responses: { 200: ok("Orders fetched", { page: 1, limit: 20, total: 1, orders: [ORDER] }) },
  }),
  route("get", "/admin/orders/summary", {
    tag: "Orders",
    summary: "Order summary cards",
    responses: { 200: ok("Orders summary", { totalOrders: 820, completedOrders: 790, gmvGross: 18450000, gmvNet: 17900000 }) },
  }),
  route("get", "/admin/orders/chart", {
    tag: "Orders",
    summary: "Orders per month",
    query: { months: 12 },
    responses: { 200: ok("Orders chart", { series: [{ year: 2026, month: 10, label: "Oct", totalOrders: 88, completedOrders: 80, gmv: 5400000 }] }) },
  }),
  route("get", "/admin/orders/top-categories", {
    tag: "Orders",
    summary: "Best-selling categories",
    query: { limit: 4 },
    responses: { 200: ok("Top categories", [{ category: "Bags", sold: 64, share: 44 }]) },
  }),
  route("get", "/admin/orders/:id", {
    tag: "Orders",
    summary: "Order details",
    params: { id: ORDER._id },
    responses: {
      200: ok("Order details", {
        order: { id: ORDER._id, status: "confirmed", createdAt: DATE, subtotal: 90000, deliveryFee: 0, total: 90000, checkoutRef: ORDER.checkoutRef },
        customer: { _id: USER_ID, firstName: "Ada", lastName: "Obi", email: "ada.obi@example.com", phoneNumber: "08012345678" },
        address: null,
        items: [{ productId: PRODUCT_ID, qty: 2, unitPrice: 45000, subtotal: 90000, product: PRODUCT }],
        holdings: { fiatBalance: 25000 },
        merchants: ["Jamestown"],
      }),
      404: fail("Order not found"),
    },
  }),

  // ---------------------------------------------------------- Shipping
  route("get", "/admin/shipping", {
    tag: "Shipping",
    summary: "List shipments",
    query: { page: 1, limit: 20, status: { example: "pending" }, category: { example: "Electronics" }, search: { example: "Chidi" }, customerUserId: { example: USER_ID } },
    responses: { 200: ok("Shipments fetched", { ...PAGE, total: 1, shipments: [SHIPMENT] }) },
  }),
  route("get", "/admin/shipping/metrics", {
    tag: "Shipping",
    summary: "Shipment counts by status",
    responses: { 200: ok("Shipment metrics", { pending: 6, shipped: 14, in_transit: 9, delivered: 210, need_attention: 2 }) },
  }),
  route("get", "/admin/shipping/:id", {
    tag: "Shipping",
    summary: "Get a shipment",
    params: { id: SHIPMENT._id },
    responses: { 200: ok("Shipment fetched", SHIPMENT), 404: fail("Shipment not found") },
  }),
  route("post", "/admin/shipping", {
    tag: "Shipping",
    summary: "Create a shipment",
    body: {
      customerUserId: USER_ID,
      receiver: SHIPMENT.receiver,
      pkg: SHIPMENT.pkg,
      payment: { deliveryFee: 8500, isPaid: false },
      shipmentStatus: "awaiting_payment",
    },
    responses: { 201: ok("Shipment created", SHIPMENT), 400: fail("receiver: Path `receiver` is required.") },
  }),
  route("patch", "/admin/shipping/:id", {
    tag: "Shipping",
    summary: "Update a shipment (status, fee, …)",
    params: { id: SHIPMENT._id },
    body: { shipmentStatus: "shipped" },
    responses: { 200: ok("Shipment updated", { ...SHIPMENT, shipmentStatus: "shipped" }) },
  }),
  route("patch", "/admin/shipping/:id/pay-confirm", {
    tag: "Shipping",
    summary: "Same as PATCH /admin/shipping/{id}",
    params: { id: SHIPMENT._id },
    body: { payment: { deliveryFee: 8500, isPaid: true } },
    responses: { 200: ok("Shipment updated", { ...SHIPMENT, payment: { deliveryFee: 8500, isPaid: true } }) },
  }),
  route("delete", "/admin/shipping/:id", {
    tag: "Shipping",
    summary: "Delete a shipment",
    params: { id: SHIPMENT._id },
    responses: { 200: ok("Shipment deleted", {}), 404: fail("Shipment not found") },
  }),
  route("get", "/admin/shipping/addresses", {
    tag: "Shipping",
    summary: "Customer addresses",
    responses: { 200: ok("Addresses fetched", [{ _id: "a7d2c9b4", userId: USER_ID, line1: "12 Admiralty Way", city: "Lagos", state: "Lagos", country: "Nigeria" }]) },
  }),
  route("post", "/admin/shipping/addresses", {
    tag: "Shipping",
    summary: "Create a customer address",
    body: { userId: USER_ID, line1: "12 Admiralty Way", city: "Lagos", state: "Lagos", country: "Nigeria" },
    responses: { 200: ok("Added addresses fetched", { _id: "a7d2c9b4", userId: USER_ID, line1: "12 Admiralty Way", city: "Lagos", country: "Nigeria" }) },
  }),
  route("patch", "/admin/shipping/addresses/:id", {
    tag: "Shipping",
    summary: "Update a customer address",
    params: { id: "a7d2c9b4" },
    body: { line2: "Block C, Flat 4" },
    responses: { 200: ok("Addresses fetched", { _id: "a7d2c9b4", line2: "Block C, Flat 4" }) },
  }),
  route("get", "/admin/drop-offs", {
    tag: "Shipping",
    summary: "List drop-offs",
    query: { page: 1, limit: 20 },
    responses: { 200: ok("Drop Off fetched", { ...PAGE, total: 1, dropOffs: [DROPOFF] }) },
  }),
  route("get", "/admin/drop-offs/:id", {
    tag: "Shipping",
    summary: "Get a drop-off",
    params: { id: DROPOFF._id },
    responses: { 200: ok("Drop Off fetched", DROPOFF) },
  }),
  route("patch", "/admin/drop-offs/:id", {
    tag: "Shipping",
    summary: "Set a drop-off's status / delivery fee",
    params: { id: DROPOFF._id },
    body: { status: "awaiting_payment", deliveryFee: 6000 },
    responses: { 200: ok("Drop off created", { ...DROPOFF, status: "awaiting_payment" }), 404: fail("Drop off does not exist") },
  }),

  // ---------------------------------------------------------- Internal
  route("get", "/admin/internal/rates", {
    tag: "Internal",
    auth: "internal",
    summary: "List rates (same as GET /admin/rates)",
    query: { type: { example: "shipping", required: true, enum: ["giftcard", "sell-giftcard", "shipping", "crypto", "sell-crypto"] }, country: "United Kingdom", category: "Electronics", weight: 2.5 },
    responses: { 200: ok("Rates fetched successfully", [SHIPPING_RATE]), 403: FORBIDDEN_INTERNAL },
  }),
  route("get", "/admin/internal/rates/crypto/:name", {
    tag: "Internal",
    auth: "internal",
    summary: "Crypto rate band matching an amount",
    params: { name: "btc" },
    query: { amount: { example: 50 }, type: { example: "crypto", enum: ["crypto", "sell-crypto"] } },
    responses: {
      200: ok("Crypto rate fetched successfully", { _id: "rate_c1", type: "crypto", name: "btc", range: { min: 0, max: 500 }, rate: 1520, isActive: true }),
      404: fail("No active crypto rate found for 'btc'"),
    },
  }),
  route("get", "/admin/internal/rates/all", {
    tag: "Internal",
    auth: "internal",
    summary: "All rate bands for a crypto",
    query: { name: { example: "btc" }, type: { example: "sell-crypto" } },
    responses: { 200: ok("Crypto rate fetched successfully", [{ _id: "rate_c2", type: "sell-crypto", name: "btc", range: { min: 0, max: 500 }, rate: 1500 }]) },
  }),
  route("get", "/admin/internal/rates/shipping/categories", {
    tag: "Internal",
    auth: "internal",
    summary: "Shipping categories",
    query: { country: "United Kingdom", state: { example: "" }, region: { example: "" } },
    responses: { 200: ok("Shipping categories fetched", ["Electronics", "Documents", "Clothing"]) },
  }),
  route("get", "/admin/internal/rates/shipping/products", {
    tag: "Internal",
    auth: "internal",
    summary: "Products within a shipping category",
    query: { category: { example: "Electronics", required: true }, country: "United Kingdom" },
    responses: { 200: ok("Shipping products fetched", ["Laptop", "Phone", "Tablet"]) },
  }),
  route("get", "/admin/internal/rates/shipping/catalog", {
    tag: "Internal",
    auth: "internal",
    summary: "Shipping rates grouped for the app",
    query: { country: "United Kingdom" },
    responses: { 200: ok("Shipping catalog fetched", [SHIPPING_RATE]) },
  }),
  route("get", "/admin/internal/rates/platform", {
    tag: "Internal",
    auth: "internal",
    summary: "Platform naira rate",
    responses: { 200: ok("Rate updated successfully", { _id: "plat_1", rate: 1520 }) },
  }),
  route("post", "/admin/internal/admin/emails", {
    tag: "Internal",
    auth: "internal",
    summary: "Email every admin about a customer transaction",
    body: {
      subject: "New Crypto Purchase",
      user: { firstName: "Ada", lastName: "Obi" },
      transactionType: "buy",
      name: "0.00074 btc",
      transaction: { amount: "0.00074 btc", reference: "a1b2c3d4e5f6", status: "Completed", metadata: { description: "Bought 0.00074 btc at 76000" } },
    },
    responses: { 200: ok("Notification sent successfully", {}) },
  }),
  route("get", "/admin/internal/monitoring/config", {
    tag: "Internal",
    auth: "internal",
    summary: "Monitoring rule settings for the wallet service's engine",
    responses: {
      200: ok("OK", {
        rules: [{ key: "large_payout", enabled: true, action: "hold", severity: "medium", params: { minAmount: 300000 }, tierOverrides: { bvn_verified: { minAmount: 900000 } } }],
        settings: { holdTimeoutMinutes: 120, onHoldTimeout: "release" },
      }),
    },
  }),
  route("post", "/admin/internal/monitoring/alerts", {
    tag: "Internal",
    auth: "internal",
    summary: "Receive rule hits from the wallet service",
    description: "De-duplicated on rule + customer + window; a repeat updates the existing alert. New high-severity alerts are emailed.",
    body: {
      alerts: [
        {
          ruleKey: "large_payout",
          userId: USER_ID,
          severity: "medium",
          stage: "pre",
          action: "hold",
          tier: "unverified",
          windowKey: "intent:int_9f2c",
          summary: "Bank withdrawal of ₦450,000 (threshold ₦300,000)",
          data: { amountNgn: 450000 },
          transactionRefs: ["HOLD_3f7e725902fde39c3cf0"],
          hold: { txnId: "66f1c0a2b4d5e6f708192a3b", reference: "HOLD_3f7e725902fde39c3cf0", kind: "bank_payout", amount: 450000 },
          outcome: "held",
        },
      ],
    },
    responses: { 200: ok("OK", { created: 1 }) },
  }),
  route("post", "/admin/internal/monitoring/holds/update", {
    tag: "Internal",
    auth: "internal",
    summary: "Record a hold outcome (e.g. auto-released after the timeout)",
    body: { txnId: "66f1c0a2b4d5e6f708192a3b", reference: "HOLD_3f7e725902fde39c3cf0", state: "released", by: "auto" },
    responses: { 200: ok("OK", {}) },
  }),
  route("post", "/admin/internal/bvn-watchlist/nibss-flag", {
    tag: "Internal",
    auth: "internal",
    summary: "Record a BVN that NIBSS has watchlisted (reported by Prembly during verification)",
    description: "Adds the BVN to our watchlist (source `nibss`), deactivates the user and emails compliance.",
    body: { userId: USER_ID, bvn: "22200000102", message: "BVN has been watchlisted by NIBSS" },
    required: ["userId", "bvn"],
    responses: { 200: ok("OK", { listed: true, flagged: 1 }), 400: fail("userId and bvn are required") },
  }),
  route("post", "/admin/internal/bvn-watchlist/screen", {
    tag: "Internal",
    auth: "internal",
    summary: "Screen a submitted BVN (called by the wallet service)",
    description: "On a hit the user is flagged and deactivated and compliance is emailed before this returns.",
    body: { userId: USER_ID, bvn: "22200000001" },
    required: ["userId", "bvn"],
    responses: { 200: ok("OK", { listed: true }), 400: fail("userId and bvn are required") },
  }),
  route("post", "/admin/internal/shipping", {
    tag: "Internal",
    auth: "internal",
    summary: "Create a shipment (from the user service)",
    body: { customerUserId: USER_ID, receiver: SHIPMENT.receiver, pkg: SHIPMENT.pkg, payment: { deliveryFee: 8500, isPaid: false } },
    responses: { 201: ok("Shipment created", SHIPMENT) },
  }),
  route("get", "/admin/internal/shipping", {
    tag: "Internal",
    auth: "internal",
    summary: "List shipments",
    query: { page: 1, limit: 20, customerUserId: { example: USER_ID } },
    responses: { 200: ok("Shipments fetched", { ...PAGE, total: 1, shipments: [SHIPMENT] }) },
  }),
  route("get", "/admin/internal/shipping/:id", {
    tag: "Internal",
    auth: "internal",
    summary: "Get a shipment",
    params: { id: SHIPMENT._id },
    responses: { 200: ok("Shipment fetched", SHIPMENT) },
  }),
  route("patch", "/admin/internal/shipping/:id/pay-confirm", {
    tag: "Internal",
    auth: "internal",
    summary: "Mark a shipment paid",
    params: { id: SHIPMENT._id },
    responses: { 200: ok("Shipment updated", { acknowledged: true, modifiedCount: 1 }) },
  }),
  route("post", "/admin/internal/shipping/drop-off", {
    tag: "Internal",
    auth: "internal",
    summary: "Create a drop-off (from the user service)",
    body: { customerUserId: USER_ID, courier: "DHL", trackingNumber: "1Z999AA10123456784", pickup: { address: "Jamestown hub, Yaba" }, file: DROPOFF.file },
    required: ["customerUserId", "courier", "trackingNumber"],
    responses: { 200: ok("Drop off created", DROPOFF), 400: fail("You already issue drop off") },
  }),
  route("get", "/admin/internal/shipping/drop-off", {
    tag: "Internal",
    auth: "internal",
    summary: "List drop-offs",
    query: { page: 1, limit: 20 },
    responses: { 200: ok("Drop Off fetched", { ...PAGE, total: 1, dropOffs: [DROPOFF] }) },
  }),
  route("get", "/admin/internal/shipping/drop-off/:id", {
    tag: "Internal",
    auth: "internal",
    summary: "Get a drop-off",
    params: { id: DROPOFF._id },
    responses: { 200: ok("Drop Off fetched", DROPOFF) },
  }),
  route("patch", "/admin/internal/shipping/drop-off/:id", {
    tag: "Internal",
    auth: "internal",
    summary: "Update a drop-off (e.g. mark paid)",
    params: { id: DROPOFF._id },
    body: { status: "processing", isPaid: true },
    responses: { 200: ok("Drop off created", { ...DROPOFF, isPaid: true }), 404: fail("Drop off does not exist") },
  }),
];

const tags = [
  { name: "Auth" },
  { name: "Admins & roles" },
  { name: "Dashboard" },
  { name: "Customers", description: "Customer profiles, balances, risk levels" },
  { name: "BVN watchlist", description: "BVNs that must not hold an active account" },
  { name: "Transaction monitoring", description: "Alerts, held payments, cases, rules and settings. Needs the Monitoring role permission." },
  { name: "Withdrawals" },
  { name: "Trades", description: "Crypto and gift card trades, gift card review queue" },
  { name: "Rates" },
  { name: "Notifications & email", description: "Push notifications, email campaigns, app banners" },
  { name: "Products & categories" },
  { name: "Orders" },
  { name: "Shipping" },
  { name: "Internal", description: "Service-to-service only. Requires the `x-internal-key` header." },
];

module.exports = () =>
  buildSpec({
    info: {
      title: "Jamestown Admin Service",
      version: "1.0.0",
      description:
        "Back office API used by the admin dashboard.\n\n" +
        "**Auth:** call `POST /admin/login`, then click **Authorize** and paste the `token` (Bearer). " +
        "Admin endpoints reject tokens without the admin role (403).\n\n" +
        "Responses use `{ status, message, data }` unless noted.",
    },
    tags,
    routes,
  });
