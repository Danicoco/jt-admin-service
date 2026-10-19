const axios = require('axios');
const { INTERNAL_SECRET, USER_SERVICE_URL, WALLET_SERVICE_URL } = process.env;

const client = axios.create({
  baseURL: USER_SERVICE_URL,
  headers: { 'x-internal-key': INTERNAL_SECRET },
  timeout: 5000
});

const walletClient = axios.create({
  baseURL: `${WALLET_SERVICE_URL}`,
  headers: { "x-internal-key": INTERNAL_SECRET },
  timeout: 7000,
});

async function safe(fn, fallback) {
  try { const { data } = await fn(); return data?.data ?? fallback; }
  catch (e) { console.warn("admin.customers.safe:", e?.response?.data || e.message); return fallback; }
}

async function fetchAddresses() {
  const resp = await client.get('/internal/addresses');
  return resp.data.data;  
}

async function addAddresses(body) {
  const resp = await client.post('/internal/addresses', body);
  return resp.data.data;  
}

async function updateAddresses(id, body) {
  const resp = await client.patch(`/internal/addresses/${id}`, body);
  return resp.data.data;
}

async function listCustomers(params) {
  const { data } = await client.get("/internal/customers", { params });
  return data?.data || { customers: [], page: 1, limit: 10, total: 0 };
}

async function getCustomerMetrics(params) {
  const { data } = await client.get("/internal/customers/metrics", { params });
  return data?.data || { cards: {}, series: [] };
}

async function getOverview(userId) {
  return safe(() => client.get(`/internal/customers/${userId}/overview`), null);
}

async function getCryptoTransactions(cryptoType, coin, giftcard, transactionType, page = 1, limit = 20) {
  return safe(() => walletClient.get(`/internal/crypto/transactions`, { params: { ...(cryptoType && { crytoType: cryptoType }), ...(coin && { coin }), ...(giftcard && { giftcard }),  ...(transactionType && { transactionType }), page, limit } }));
}

async function getTradeMetrics() {
  return safe(() => walletClient.get(`/internal/crypto/transactions/metrics`));
}

async function getTradeChart() {
  return safe(() => walletClient.get(`/internal/crypto/transactions/charts`));
}

async function getCardMetrics() {
  return safe(() => walletClient.get(`/internal/gift-card/metrics`));
}

async function getGiftCardSellRequest(status, page = 1, limit = 20) {
  return safe(() => walletClient.get(`/internal/gift-card/list-requests`, { params: { page, limit, ...(status && { status }) } }));
}

async function processGiftCardSellRequest(id, values) {
  return safe(() => walletClient.patch(`/internal/gift-card/${id}/status`, values), {});
}

async function getPlatformGiftCard(id, status) {
  return safe(() => walletClient.get(`/internal/gift-card/platform`), []);
}

async function getHoldings(userId) {
  return safe(() => walletClient.get(`/internal/wallet/holdings`, { params: { customerId: userId } }), { customerId: userId });
}

async function getOrders(userId, params) {
  return safe(() => client.get(`/internal/orders/by-user`, { params: { userId, ...params } }), { page:1, limit:10, total:0, orders:[] });
}

async function getTransactions(userId, params) {
  return safe(() => walletClient.get(`/internal/users/${userId}/transactions`, { params }), { page:1, limit:10, total:0, transactions:[] });
}

async function setUserStatus(userId, isActive) {
  return safe(() => client.patch(`/internal/users/${userId}/status`, { isActive }),null);
}

async function getRiskSignals(userIds) {
  if (!userIds?.length) return {};
  const out = await safe(
    () => walletClient.post(`/internal/risk/signals`, { userIds }),
    { signals: {} },
  );
  return out?.signals || {};
}

async function setRiskOverride(userId, body) {
  const { data } = await client.patch(`/internal/users/${userId}/risk`, body);
  return data?.data;
}

async function batchUsers(ids) {
  if (!ids?.length) return {};
  try {
    const { data } = await client.post(`/internal/users/batch`, { ids });
    return data?.users || {};
  } catch (e) {
    console.warn("admin.batchUsers:", e?.response?.data || e.message);
    return {};
  }
}

async function listWithdrawals(params) {
  const { data } = await walletClient.get(`/internal/withdrawals`, { params });
  return data?.data || { page: 1, limit: 20, total: 0, withdrawals: [] };
}

async function getWithdrawalSummary() {
  return safe(() => walletClient.get(`/internal/withdrawals/summary`), {});
}

async function sendPush(body) {
  const { data } = await client.post(`/internal/push/send`, body, { timeout: 60000 });
  return data?.data;
}

async function listEmailRecipients(params) {
  const { data } = await client.get(`/internal/users/email-recipients`, { params });
  return data?.data || { recipients: [], next: null };
}

async function countEmailRecipients(audience) {
  return safe(
    () => client.get(`/internal/users/email-recipients/count`, { params: { audience } }),
    { count: 0 },
  );
}

async function lookupBvns(bvns) {
  if (!bvns?.length) return {};
  const { data } = await walletClient.post(`/internal/bvn/lookup`, { bvns }, { timeout: 15000 });
  return data?.data?.matches || {};
}

async function flagUserForWatchlist(userId, body) {
  const { data } = await client.post(`/internal/users/${userId}/watchlist-flag`, body);
  return data?.data;
}

// ---- transaction monitoring (wallet service)
const wallet = async (method, url, body, params, timeout = 15000) => {
  const { data } = await walletClient.request({ method, url: `/internal/monitoring${url}`, data: body, params, timeout });
  return data?.data;
};
const monitoringCatalog = () => wallet("get", "/catalog");
const simulateRule = (body) => wallet("post", "/simulate", body, undefined, 120000);
const customerLedger = (userId, days) => wallet("get", "/ledger", undefined, { userId, days });
const listHolds = (params) => wallet("get", "/holds", undefined, params);
const releaseHold = (txnId, by) => wallet("post", `/holds/${txnId}/release`, { by }, undefined, 60000);
const rejectHold = (txnId, by, reason) => wallet("post", `/holds/${txnId}/reject`, { by, reason }, undefined, 60000);
const rescanCustomer = (userId, days) => wallet("post", "/scan", { userId, days }, undefined, 60000);
const notifyMonitoringConfigChanged = () => wallet("post", "/config-changed").catch(() => null);

module.exports = {
  monitoringCatalog,
  simulateRule,
  customerLedger,
  listHolds,
  releaseHold,
  rejectHold,
  rescanCustomer,
  notifyMonitoringConfigChanged,
  lookupBvns,
  flagUserForWatchlist,
  getRiskSignals,
  setRiskOverride,
  batchUsers,
  listWithdrawals,
  getWithdrawalSummary,
  sendPush,
  listEmailRecipients,
  countEmailRecipients,
  fetchAddresses,
  addAddresses,
  updateAddresses,
  listCustomers,
  getCustomerMetrics,
  getOverview,
  getHoldings,
  getOrders,
  getTransactions,
  setUserStatus,
  getCryptoTransactions,
  getGiftCardSellRequest,
  getTradeChart,
  getTradeMetrics,
  processGiftCardSellRequest,
  getPlatformGiftCard,
  getCardMetrics
};
