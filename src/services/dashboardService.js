const axios = require('axios');
const Product = require('../models/product');

const {
  USER_SERVICE_URL,
  WALLET_SERVICE_URL,
  INTERNAL_SECRET,
} = process.env;

const userClient = axios.create({
  baseURL: `${USER_SERVICE_URL}/internal`,
  headers: { 'x-internal-key': INTERNAL_SECRET },
  timeout: 8000,
});

const walletClient = axios.create({
  baseURL: `${WALLET_SERVICE_URL}/internal`,
  headers: { 'x-internal-key': INTERNAL_SECRET },
  timeout: 8000,
});

function toNumber(v, def = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
}

async function safeGet(label, client, path, params) {
  try {
    const resp = await client.get(path, { params });
    const payload = resp.data?.data ?? resp.data;
    return payload;
  } catch (e) {
    const status = e.response?.status;
    const body = e.response?.data || e.message;
    console.warn('dashboard.err:', label, status, body);
    return null;
  }
}

async function getSummary() {
  const orderMetrics =
    (await safeGet('orders.metrics', userClient, '/orders/metrics')) || {};
  const walletMetrics =
    (await safeGet('wallet.metrics', walletClient, '/metrics')) || {};
  const usersCount =
    (await safeGet('users.count', userClient, '/users/count')) || {};

  return {
    nairaTransactions: toNumber(orderMetrics.nairaVolume),
    cryptoTransactions: toNumber(walletMetrics.cryptoVolume),
    giftcardTransactions: toNumber(walletMetrics.giftcardVolume),
    deposits: toNumber(walletMetrics.nairaDeposits),
    withdrawals: toNumber(walletMetrics.nairaWithdrawals),
    productSold: toNumber(orderMetrics.productSold),
    orders: toNumber(orderMetrics.totalOrders),
    totalCustomers: toNumber(usersCount.count),
  };
}

async function getLatestOrders({ limit = 6 } = {}) {
  const rows =
    (await safeGet('orders.latest', userClient, '/orders/latest', { limit })) ||
    [];
  return Array.isArray(rows) ? rows : [];
}

async function getTopProducts({ limit = 3 } = {}) {
  const top =
    (await safeGet(
      'orders.top-products',
      userClient,
      '/orders/top-products',
      { limit }
    )) || [];

  if (!Array.isArray(top) || top.length === 0) return [];

  const ids = top.map((t) => t._id);
  const products = await Product.find({ _id: { $in: ids } }).select(
    '_id title price imageUrls sku category subcategory brand'
  );

  const byId = new Map(products.map((p) => [p._id, p]));
  return top.map((t) => ({
    productId: t._id,
    sold: toNumber(t.sold),
    revenue: toNumber(t.revenue),
    product: byId.get(t._id) || null,
  }));
}

module.exports = {
  getSummary,
  getLatestOrders,
  getTopProducts,
};
