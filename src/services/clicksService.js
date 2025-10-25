const Product = require('../models/product');           
const Clicks = require('../models/clicks');           

async function incrementView(productId) {
  await Clicks.updateOne(
    { _id: productId },
    { $inc: { views: 1 }, $set: { lastViewAt: new Date() } },
    { upsert: true }
  );
  const doc = await Clicks.findById(productId).lean();
  return doc || { _id: productId, views: 0, lastViewAt: null };
}

async function getViews(productId) {
  const doc = await Clicks.findById(productId).lean();
  return doc || { _id: productId, views: 0, lastViewAt: null };
}

module.exports = { incrementView, getViews };
