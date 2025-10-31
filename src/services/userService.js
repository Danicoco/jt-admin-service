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

async function getCryptoTransactions(cryptoType, coin, giftcard, page = 1, limit = 20) {
  return safe(() => walletClient.get(`/internal/crypto/transactions`, { params: { ...(cryptoType && { cryptoType }), ...(coin && { coin }), ...(giftcard && { giftcard }), page, limit } }));
}

async function getTradeMetrics() {
  return safe(() => walletClient.get(`/internal/crypto/transactions/metrics`));
}

async function getTradeChart() {
  return safe(() => walletClient.get(`/internal/crypto/transactions/charts`));
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

module.exports = {
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
  getPlatformGiftCard
};
