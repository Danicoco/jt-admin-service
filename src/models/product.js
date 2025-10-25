const mongoose = require('mongoose');
const { db } = require('../utils/mongoDb');
const { Schema } = mongoose;
const { generateProductSku } = require('../utils/sku');

const VariantSchema = new Schema({
  name:  { type: String, required: true },
  value: { type: String, required: true },
  qty:   { type: Number, required: true, min: 0 },
}, { _id: false });

const ProductSchema = new Schema({
  _id: { type: String, required: true },
  title: { type: String, required: true },
  sku: { type: String, unique: true, index: true },   
  category_id: {
    type: String, ref: 'Category', required: true, index: true,
    validate: {
      validator: async function (v) {
        if (!v) return false;
        return !!(await mongoose.model('Category').exists({ _id: v }));
      },
      message: 'Invalid category_id: category does not exist',
    },
  },
  category:    { type: String, default: null },
  subcategory: {
    type: String, default: null,
    validate: {
      validator: async function (sub) {
        if (!sub) return true;
        if (!this.category_id) return false;
        const cat = await mongoose.model('Category')
          .findById(this.category_id).select('subcategory');
        return !!(cat && Array.isArray(cat.subcategory) && cat.subcategory.includes(sub));
      },
      message: 'Invalid subcategory for the given category',
    },
  },
  price: { type: Number, required: true, min: 0 },
  gender: { type: String, enum: ['Male','Female','Unisex'], default: 'Unisex' },
  brand: { type: String },
  description: { type: String },
  imageUrls: { type: [String], default: [] },
  variants: { type: [VariantSchema], default: [] },
  stock: { type: Number, default: 0, min: 0, required: true },
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date, default: null },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
});

ProductSchema.pre('validate', async function(next) {
  try {
    if (!this.sku) {
      this.sku = await generateProductSku({
        brand: this.brand,
        category: this.category,
        title: this.title,
      });
    }
    if (Array.isArray(this.variants) && this.variants.length > 0) {
      this.stock = this.variants.reduce((sum, v) => sum + (Number(v.qty) || 0), 0);
    } else {
      this.stock = Number(this.stock || 0);
    }
    next();
  } catch (e) {
    next(e);
  }
});

module.exports = db.model('Product', ProductSchema);
