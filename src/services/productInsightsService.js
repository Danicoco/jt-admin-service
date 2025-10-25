const axios = require('axios');
const Product = require('../models/product');

const { INTERNAL_SECRET, USER_SERVICE_URL } = process.env;

const userClient = axios.create({
  baseURL: `${USER_SERVICE_URL}/internal`,
  headers: { 'x-internal-key': INTERNAL_SECRET },
  timeout: 7000,
});

async function safe(fn, fallback) {
  try { const { data } = await fn(); return data?.data ?? fallback; }
  catch (e) { console.warn('admin.insights.safe:', e?.response?.data || e.message); return fallback; }
}

async function getSalesSeries({ months = 6 } = {}) {
  return safe(() => userClient.get('/orders/sales-data', { params: { months } }), { series: [], momUnitsPct: 0 });
}

async function getTopSelling({ limit = 3 } = {}) {
  const top = await safe(() => userClient.get('/orders/top-products', { params: { limit } }), []);
  if (!top.length) return [];

  const ids = top.map(t => t._id);
  const products = await Product.find({ _id: { $in: ids } })
    .select('_id title price imageUrls sku category subcategory brand')
    .lean();

  const byId = new Map(products.map(p => [p._id, p]));
  return top.map(t => ({
    productId: t._id,
    sold: t.sold,
    revenue: t.revenue || 0,
    product: byId.get(t._id) || null,
  }));
}

async function getSoldOut({ page = 1, limit = 10 }) {
  page  = Math.max(parseInt(page, 10) || 1, 1);
  limit = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 100);
  const skip = (page - 1) * limit;

  const match = { isDeleted: { $ne: true }, stock: { $lte: 0 } };

  const [items, total] = await Promise.all([
    Product.find(match)
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit)
      .select('_id title sku price imageUrls brand category subcategory variants stock created_at updated_at')
      .lean(),
    Product.countDocuments(match),
  ]);

  return { page, limit, total, products: items };
}

async function getProductInsights(params = {}) {
  const [series, top, soldOut] = await Promise.all([
    getSalesSeries({ months: params.months || 6 }),
    getTopSelling({ limit: params.topLimit || 3 }),
    getSoldOut({ limit: params.soldOutLimit || 10, page: params.page || 1 })
  ]);

  return {
    chart: series,       
    topSelling: top,     
    soldOut              
  };
}

module.exports = {
  getSalesSeries,
  getTopSelling,
  getSoldOut,
  getProductInsights,
};
