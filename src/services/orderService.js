const axios = require('axios');
const Product = require('../models/product');
const { getTopProducts } = require('./dashboardService');

const { USER_SERVICE_URL, INTERNAL_SECRET, WALLET_SERVICE_URL } = process.env;

const userClient = axios.create({
  baseURL: `${USER_SERVICE_URL}/internal`,
  headers: { 'x-internal-key': INTERNAL_SECRET },
  timeout: 7000,
});

const walletClient = axios.create({
  baseURL: `${WALLET_SERVICE_URL}/internal`,
  headers: { "x-internal-key": INTERNAL_SECRET },
  timeout: 6000,
});

async function safe(fn, fallback) {
  try {
    const { data } = await fn();    
    return data?.data ?? data ?? fallback;
  } catch (e) {
    console.warn('admin.orders.safe:', e?.response?.status, e?.response?.data || e.message);
    return fallback;
  }
}

async function getSummary() {
  return safe(() => userClient.get('/orders/summary'), {
    totalOrders: 0, completedOrders: 0, gmvGross: 0, gmvNet: 0
  });
}

async function getChart(params = {}) {
  return safe(() => userClient.get('/orders/chart', { params }), { series: [] });
}

async function listOrders(params = {}) {
  const data = await safe(() => userClient.get('/orders/admin-list', { params }),
    { page:1, limit:10, total:0, orders:[] });

  return data;
}

async function getTopCategories({ limit = 4 } = {}) {
  const top = await getTopProducts({ limit: 100 }); 
  const byCat = new Map();
  let totalSold = 0;

  for (const t of top) {
    const cat = (t.product?.category || 'Unknown');
    totalSold += t.sold;
    byCat.set(cat, (byCat.get(cat) || 0) + t.sold);
  }

  const rows = Array.from(byCat.entries())
    .map(([category, sold]) => ({
      category,
      sold,
      share: totalSold ? Math.round((sold / totalSold) * 100) : 0
    }))
    .sort((a,b) => b.sold - a.sold)
    .slice(0, limit);

  return rows;
}

async function getOrderDetails(orderId) {
  const order = await safe(() => userClient.get(`/orders/${orderId}`));
  if (!order) return null;

  const customer  = await safe(() => userClient.get(`/users/${order.userId}`), null);
  
  const addresses = await safe(() => userClient.get(`/users/${order.userId}/addresses`), []);
  const address = Array.isArray(addresses) && addresses.length ? addresses[0] : null;

  const ids = Array.from(new Set((order.items || []).map(i => i.productId))).filter(Boolean);
  const products = ids.length
    ? await Product.find({ _id: { $in: ids } })
        .select("_id title price imageUrls category subcategory brand sku")
        .lean()
    : [];
  const byId = new Map(products.map(p => [p._id, p]));

  const items = (order.items || []).map(it => ({
    productId: it.productId,
    qty: it.quantity,
    unitPrice: it.unitPrice,
    subtotal: it.subtotal,
    product: byId.get(it.productId) || null,
  }));
  const holdings = await safe(() => walletClient.get(`/users/${order.userId}/wallet/summary`), { fiatBalance: 0 });

  const subtotal = items.reduce((s, i) => s + (Number(i.subtotal) || 0), 0);
  const deliveryFee = Number(order.deliveryFee || 0); 
  const total = subtotal + deliveryFee;

  const merchants = [...new Set(products.map(p => p.brand).filter(Boolean))];

  return {
    order: {
      id: order._id,
      status: order.status,
      createdAt: order.createdAt,
      subtotal,
      deliveryFee,
      total,
      checkoutRef: order.checkoutRef,
    },
    items,
    customer,
    address: address
      ? {
          line1: address.line1,
          line2: address.line2,
          city: address.city,
          state: address.state,
          zipCode: address.zipCode,
          country: address.country,
        }
      : null,
    merchants, 
    holdings,  // { fiatBalance }
  };
}

module.exports = {
  getSummary,
  getChart,
  listOrders,
  getTopCategories,
  getOrderDetails,
};
