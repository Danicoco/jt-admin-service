const Product = require("../../../models/product");
const { jsonS, jsonFailed } = require("../../../utils");
const { v4: uuidv4 } = require("uuid");
const Category = require("../../../models/category");
const { incrementView, getViews } = require("../../../services/clicksService");
const Clicks = require("../../../models/clicks");
const svc = require('../../../services/productInsightsService');

const Controller = {
    listProducts: async (req, res) => {
        try {
            const {
            page = 1,
            limit = 20,
            search,
            category_id,          
            category,             
            subcategory,          
            brand,                
            color,                
            price_min,            
            price_max,            
            price_range,          // "min-max" alternative
            in_stock,             
            sortBy = 'updated_at',
            order = 'desc',      
            } = req.query;

            const pageNum  = Math.max(1, parseInt(page, 10) || 1);
            const limitNum = Math.max(1, Math.min(200, parseInt(limit, 10) || 20));
            const skip     = (pageNum - 1) * limitNum;

            const parseCSV = (v) =>
            !v ? [] : String(v).split(',').map(s => s.trim()).filter(Boolean);
            const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

            const filter = { isDeleted: false };

            if (search) {
            const rx = new RegExp(esc(search), 'i');
            filter.$or = [
                { title: rx },
                { brand: rx },
                { description: rx },
                { category: rx },
                { subcategory: rx },
            ];
            }

            if (category_id) {
            filter.category_id = String(category_id).trim();
            }

            if (category) {
            const cats = parseCSV(category);
            filter.category = cats.length === 1 ? cats[0] : { $in: cats };
            }

            if (subcategory) {
            const subs = parseCSV(subcategory);
            filter.subcategory = subs.length === 1 ? subs[0] : { $in: subs };
            }

            if (brand) {
            const brands = parseCSV(brand).map(b => new RegExp(`^${esc(b)}$`, 'i'));
            filter.brand = brands.length === 1 ? brands[0] : { $in: brands };
            }

            let minP = price_min != null ? Number(price_min) : null;
            let maxP = price_max != null ? Number(price_max) : null;
            if (!Number.isFinite(minP)) minP = null;
            if (!Number.isFinite(maxP)) maxP = null;

            if (price_range && minP === null && maxP === null) {
            const [a, b] = String(price_range).split('-').map(Number);
            if (Number.isFinite(a)) minP = a;
            if (Number.isFinite(b)) maxP = b;
            }

            if (minP !== null || maxP !== null) {
            filter.price = {};
            if (minP !== null) filter.price.$gte = minP;
            if (maxP !== null) filter.price.$lte = maxP;
            }

            if (color) {
            const colors = parseCSV(color).map(c => new RegExp(`^${esc(c)}$`, 'i'));
            filter.variants = {
                $elemMatch: {
                name: /^color$/i,
                value: colors.length === 1 ? colors[0] : { $in: colors },
                },
            };
            }

            if (in_stock === 'true') {
            filter.$and = (filter.$and || []).concat({
                variants: { $elemMatch: { qty: { $gt: 0 } } },
            });
            }

            const allowedSort = new Set(['updated_at', 'created_at', 'price', 'title']);
            const sortField = allowedSort.has(String(sortBy)) ? String(sortBy) : 'updated_at';
            const sort = { [sortField]: order === 'asc' ? 1 : -1 };

            const [total, products] = await Promise.all([
            Product.countDocuments(filter),
            Product.find(filter).sort(sort).skip(skip).limit(limitNum),
            ]);

            return jsonS(res, 200, 'Products fetched', {
            page: pageNum,
            limit: limitNum,
            total,
            pages: Math.ceil(total / limitNum),
            products,
            });
        } catch (err) {
            console.error('Error listing products:', err);
            return jsonFailed(res, {}, 'Internal Server Error', 500);
        }
    },

    getProduct: async (req, res) => {
        try {
        const { id } = req.params;
        const product = await Product.findById(id);
        if (!product || product.isDeleted) {
            return jsonFailed(res, {}, 'Product not found', 404);
        }
        await incrementView(id);
        return jsonS(res, 200, 'Product fetched', product);
        } catch (err) {
        console.error('Error fetching product:', err);
        return jsonFailed(res, {}, 'Internal Server Error', 500);
        }
    },

    createProduct: async (req, res) => {
        try {
            const {
                title,
                category_id,   
                subcategory,
                price,
                gender,
                brand,
                description,
                variants,
                stock
            } = req.body;

            if (!title || !category_id || !stock || price === undefined) {
                return jsonFailed(res, {}, "title, category_id and price are required", 400);
            }

            const cat = await Category.findById(category_id).select('name subcategory');
            if (!cat) return jsonFailed(res, {}, "Invalid category_id", 400);

            if (subcategory && !cat.subcategory.includes(subcategory)) {
                return jsonFailed(res, {}, "subcategory does not belong to the selected category", 400);
            }

            const imageUrls = Array.isArray(req.body.imageUrls) ? req.body.imageUrls : [];

            let variantArray = [];
            if (variants) {
                try {
                variantArray = typeof variants === 'string' ? JSON.parse(variants) : variants;
                } catch {
                return jsonFailed(res, {}, "Invalid JSON for variants", 400);
                }
                if (!Array.isArray(variantArray)) {
                return jsonFailed(res, {}, "variants must be an array", 400);
                }
            }

            const payload = {
                _id:          uuidv4(),
                title,
                category_id,             
                category:     cat.name,  
                subcategory:  subcategory || null,
                price:        Number(price),
                gender,
                brand,
                description,
                imageUrls,
                variants:     variantArray,
                stock:        Number(stock),
            };

            if (Number.isNaN(payload.price) || payload.price < 0) {
                return jsonFailed(res, {}, 'Invalid price value', 400);
            }

            const product = await Product.create(payload);
            return jsonS(res, 201, "Product created", product);
        } catch (err) {
            console.error("createProduct error:", err);
            const status = err.name === 'ValidationError' ? 400 : 500;
            return jsonFailed(res, {}, err.message || "Internal Server Error", status);
        }
    },

    updateProduct: async (req, res) => {
        try {
        const { id } = req.params;
        const product = await Product.findById(id);
        if (!product || product.isDeleted) {
            return jsonFailed(res, {}, 'Product not found', 404);
        }

        if (req.body.category_id !== undefined) {
            const cat = await Category.findById(req.body.category_id).select('name subcategory');
            if (!cat) return jsonFailed(res, {}, "Invalid category_id", 400);
            product.category_id = req.body.category_id;
            product.category = cat.name; 

            if (req.body.subcategory && !cat.subcategory.includes(req.body.subcategory)) {
            return jsonFailed(res, {}, "subcategory does not belong to the selected category", 400);
            }
        }

        if (req.body.subcategory !== undefined) {
            product.subcategory = req.body.subcategory || null;
        }

        if (req.body.imageUrls) {
            if (!Array.isArray(req.body.imageUrls)) {
            return jsonFailed(res, {}, 'imageUrls must be an array', 400);
            }
            product.imageUrls = req.body.imageUrls;
        }

        if (req.body.variants) {
            let variants = req.body.variants;
            if (typeof variants === 'string') {
            try { variants = JSON.parse(variants); }
            catch { return jsonFailed(res, {}, 'Invalid JSON for variants', 400); }
            }
            if (!Array.isArray(variants)) {
            return jsonFailed(res, {}, 'variants must be an array', 400);
            }
            product.variants = variants;
        }

        const updatable = ['title','gender','brand','description','status'];
        updatable.forEach(field => {
            if (req.body[field] !== undefined) product[field] = req.body[field];
        });

        if (req.body.price !== undefined) {
            const p = Number(req.body.price);
            if (Number.isNaN(p) || p < 0) {
            return jsonFailed(res, {}, 'Invalid price value', 400);
            }
            product.price = p;
        }

        await product.save();
        return jsonS(res, 200, 'Product updated', product);
        } catch (err) {
        console.error('Error updating product:', err);
        const status = err.name === 'ValidationError' ? 400 : 500;
        return jsonFailed(res, {}, err.message || 'Internal Server Error', status);
        }
    },

    deleteProduct: async (req, res) => {
        try {
        const { id } = req.params;
        const product = await Product.findByIdAndUpdate(
            id,
            { isDeleted: true, deletedAt: new Date() },
            { new: true }
        );

        if (!product) {
            return jsonFailed(res, {}, 'Product not found', 404);
        }

        return jsonS(res, 200, 'Product deleted', product);
        } catch (err) {
        console.error('Error deleting product:', err);
        return jsonFailed(res, {}, 'Internal Server Error', 500);
        }
    },

    getProductClicksCount: async (req, res) => {
        try {
            const { id } = req.params;
            const exists = await Product.exists({ _id: id, isDeleted: false });
            if (!exists) return jsonFailed(res, {}, 'Product not found', 404);

            const counter = await getViews(id);
            return jsonS(res, 200, 'Product views', {
                productId: id,
                views: counter.views,
                lastViewAt: counter.lastViewAt,
            });
        } catch (err) {
            console.error('Error getting product views:', err);
            return jsonFailed(res, {}, 'Internal Server Error', 500);
        }
    },

    series: async (req, res) => {
        try {
            const months = Math.min(parseInt(req.query.months || '6', 10), 24);
            const data = await svc.getSalesSeries({ months });
            return jsonS(res, 200, 'Sales series', data);
        } catch (e) {
            console.error('insights.series error:', e);
            return jsonFailed(res, {}, 'Failed to fetch sales series', 500);
        }
    },

    topProduct: async (req, res) => {
        try {
            const limit = Math.min(parseInt(req.query.limit || '3', 10), 50);
            const data = await svc.getTopSelling({ limit });
            return jsonS(res, 200, 'Top selling products', data);
        } catch (e) {
            console.error('insights.top error:', e);
            return jsonFailed(res, {}, 'Failed to fetch top products', 500);
        }
    },

    soldOutProduct: async (req, res) => {
        try {
            const page  = Math.max(parseInt(req.query.page || '1', 10), 1);
            const limit = Math.min(parseInt(req.query.limit || '10', 10), 100);
            const data  = await svc.getSoldOut({ page, limit });
            return jsonS(res, 200, 'Sold-out products', data);
        } catch (e) {
            console.error('insights.soldOut error:', e);
            return jsonFailed(res, {}, 'Failed to fetch sold-out products', 500);
        }
    },

    allData: async (req, res) => {
        try {
            const months        = Math.min(parseInt(req.query.months || '6', 10), 24);
            const topLimit      = Math.min(parseInt(req.query.topLimit || '3', 10), 50);
            const soldOutLimit  = Math.min(parseInt(req.query.soldOutLimit || '6', 10), 100);
            const page          = Math.max(parseInt(req.query.page || '1', 10), 1);

            const data = await svc.getProductInsights({ months, topLimit, soldOutLimit, page });
            return jsonS(res, 200, 'Product insights', data);
        } catch (e) {
            console.error('insights.combined error:', e);
            return jsonFailed(res, {}, 'Failed to fetch product insights', 500);
        }
    },
};

module.exports = Controller;
