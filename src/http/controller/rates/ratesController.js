const Rate = require("../../../models/rates");
const PlatformRate = require("../../../models/platformRate");
const { v4: uuidv4 } = require("uuid");
const { jsonS, jsonFailed } = require("../../../utils");
const { getPlatformGiftCard } = require("../../../services/userService");

const Controller = {
  listRates: async (req, res) => {
    try {
      const {
        type,
        country,
        state,
        region,
        category,
        weight,
        product,
        aggregate,
      } = req.query;

      if (!type) {
        return jsonFailed(res, {}, "Query parameter `type` is required", 400);
      }

      let rates = [];

      if (!aggregate) {
        const filter = { type, isActive: true };

        if (country) filter.country = country;
        if (state) filter.state = state;
        if (region) filter.region = region;
        if (category) filter.category = category;
        if (product) filter.product = product;

        if (weight !== undefined) {
          const w = Number(weight);
          if (Number.isNaN(w)) {
            return jsonFailed(res, {}, "Invalid weight", 400);
          }
          filter["range.min"] = { $lte: w };
          filter["range.max"] = { $gte: w };
        }

        console.log(filter, "Filter");

        rates = await Rate.find(filter).sort({ createdAt: -1 });
      } else {
        rates = await Rate.aggregate([
          {
            $match: { type },
          },
          {
            $group: {
              _id: type === "shipping" ? "$category" : "$name",
              record: { $push: "$$ROOT" },
            },
          },
        ]);
      }

      return jsonS(res, 200, "Rates fetched successfully", rates);
    } catch (error) {
      console.error("Error fetching rates:", error);
      return jsonFailed(res, {}, "Internal server error", 500);
    }
  },
  createRate: async (req, res) => {
    try {
      const {
        type,
        name,
        country,
        state,
        region,
        category,
        product,
        products,
        weight,
        range,
        rate,
        photoUrl,
        subCategory,
      } = req.body;

      if (!["giftcard", "shipping", "crypto", "sell-crypto", "sell-giftcard"].includes(type)) {
        return jsonFailed(res, {}, "Invalid rate type", 400);
      }
      if (!name || rate == null) {
        return jsonFailed(res, {}, "`name` and `rate` are required", 400);
      }

      if (type === "shipping") {
        if (!category) {
          return jsonFailed(
            res,
            {},
            "`category` is required for shipping rates",
            400
          );
        }

        let productList = [];
        if (Array.isArray(products) && products.length) {
          productList = [
            ...new Set(products.map((p) => String(p).trim()).filter(Boolean)),
          ];
        } else if (product) {
          productList = [String(product).trim()];
        }

        if (!productList.length) {
          return jsonFailed(
            res,
            {},
            "`product` (or `products[]`) is required for shipping rates",
            400
          );
        }

        const hasExactWeight =
          typeof weight === "number" && !Number.isNaN(weight);
        const hasRange =
          range &&
          typeof range.min === "number" &&
          typeof range.max === "number";

        if (!hasExactWeight && !hasRange) {
          return jsonFailed(
            res,
            {},
            "Provide either `weight` or `range.{min,max}` for shipping rates",
            400
          );
        }
        if (hasRange && range.min > range.max) {
          return jsonFailed(res, {}, "`range.min` must be <= `range.max`", 400);
        }

        const docs = productList.map((prod) => ({
          type,
          name: name.toLowerCase(),
          country,
          state,
          region,
          category,
          product: prod,
          weight,
          range,
          rate,
          subCategory,
          ...(photoUrl && { image: photoUrl }),
        }));

        const created = await Rate.insertMany(docs, { ordered: true });
        const msg =
          created.length === 1
            ? "shipping rate created successfully"
            : `${created.length} shipping rates created successfully`;

        return jsonS(
          res,
          201,
          msg,
          created.length === 1 ? created[0] : created
        );
      }

      const newRate = await Rate.create({
        type,
        name: name.toLowerCase(),
        country,
        state,
        region,
        category,
        subCategory,
        product,
        weight,
        range,
        ...(req.body["range[min]"] &&
          req.body["range[max]"] && {
            range: {
              min: Number(req.body["range[min]"]),
              max: Number(req.body["range[max]"]),
            },
          }),
        rate,
        ...(photoUrl && { image: photoUrl }),
      });
      console.log(req.body, "REQ BODY");
      console.log(newRate);
      return jsonS(res, 201, `${type} rate created successfully`, newRate);
    } catch (error) {
      console.error("Error creating rate:", error);
      return jsonFailed(res, {}, "Internal server error", 500);
    }
  },
  updateRate: async (req, res) => {
    const { id } = req.params;
    const { rate: newRateValue } = req.body;
    try {
      const updated = await Rate.findByIdAndUpdate(
        id,
        { rate: newRateValue },
        { new: true }
      );
      if (!updated) {
        return jsonFailed(res, {}, "Rate not found", 404);
      }
      return jsonS(res, 200, "Rate updated successfully", updated);
    } catch (error) {
      console.error("Error updating rate:", error);
      return jsonFailed(res, {}, "Internal server error", 500);
    }
  },
    deleteRate: async (req, res) => {
    const { id } = req.params;
    try {
      const updated = await Rate.deleteOne({ id });
      return jsonS(res, 200, "Rate deleted successfully", updated);
    } catch (error) {
      console.error("Error updating rate:", error);
      return jsonFailed(res, {}, "Internal server error", 500);
    }
  },
  createOrUpdatePlatformRate: async (req, res) => {
    const { rate } = req.body;
    try {
      let result;
      const platform = await PlatformRate.findOne({
        baseCurrency: "USD",
        quoteCurrency: "NGN",
      });
      if (!platform) {
        result = await new PlatformRate({
          baseCurrency: "USD",
          quoteCurrency: "NGN",
          rate,
        }).save();
      } else {
        result = await PlatformRate.updateOne({ _id: platform._id }, { rate });
      }
      return jsonS(res, 200, "Rate updated successfully", result);
    } catch (error) {
      console.error("Error updating rate:", error);
      return jsonFailed(res, {}, "Internal server error", 500);
    }
  },
  getPlatformRate: async (_req, res) => {
    try {
      const platform = await PlatformRate.findOne({
        baseCurrency: "USD",
        quoteCurrency: "NGN",
      });
      return jsonS(res, 200, "Rate updated successfully", platform);
    } catch (error) {
      console.error("Error updating rate:", error);
      return jsonFailed(res, {}, "Internal server error", 500);
    }
  },
  getCryptoRateByName: async (req, res) => {
    const { name } = req.params;
    const { amount } = req.query;
    if (!name) {
      return jsonFailed(res, {}, "`name` parameter is required", 400);
    }
    try {
      const rateDoc = await Rate.findOne({
        type: "crypto",
        name: name.toLowerCase(),
        isActive: true,
        "range.min": { $lte: Number(amount) },
        "range.max": { $gte: Number(amount) },
      });
      console.log({
        rateDoc,
      });
      if (!rateDoc) {
        return jsonFailed(
          res,
          {},
          `No active crypto rate found for '${name}'`,
          404
        );
      }
      return jsonS(res, 200, "Crypto rate fetched successfully", rateDoc);
    } catch (error) {
      console.error("Error fetching crypto rate by name:", error);
      return jsonFailed(res, {}, "Internal server error", 500);
    }
  },
  getInternalRates: async (req, res) => {
    const { name, type } = req.query;
    try {
      const rateDocs = await Rate.find({
        type: type || "crypto",
        name: name.toLowerCase(),
        isActive: true,
      });
      
      return jsonS(res, 200, "Crypto rate fetched successfully", rateDocs);
    } catch (error) {
      console.error("Error fetching crypto rate by name:", error);
      return jsonFailed(res, {}, "Internal server error", 500);
    }
  },
  listShippingCategories: async (req, res) => {
    try {
      const { country, state, region } = req.query;
      const filter = { type: "shipping", isActive: true };
      if (country) filter.country = country;
      if (state) filter.state = state;
      if (region) filter.region = region;

      const categories = await Rate.distinct("category", filter);
      return jsonS(res, 200, "Shipping categories fetched", categories);
    } catch (err) {
      console.error("listShippingCategories error:", err);
      return jsonFailed(res, {}, "Internal server error", 500);
    }
  },

  listShippingProducts: async (req, res) => {
    try {
      const { category, country, state, region } = req.query;
      const filter = { type: "shipping", isActive: true };
      if (category) filter.category = category;
      if (country) filter.country = country;
      if (state) filter.state = state;
      if (region) filter.region = region;

      const products = await Rate.distinct("product", filter);
      return jsonS(res, 200, "Shipping products fetched", products);
    } catch (err) {
      console.error("listShippingProducts error:", err);
      return jsonFailed(res, {}, "Internal server error", 500);
    }
  },

  listShippingCatalog: async (req, res) => {
    try {
      const { country, state, region } = req.query;
      const match = { type: "shipping", isActive: true };
      if (country) match.country = country;
      if (state) match.state = state;
      if (region) match.region = region;

      const docs = await Rate.aggregate([
        { $match: match },
        { $group: { _id: { category: "$category", product: "$product" } } },
        {
          $group: {
            _id: "$_id.category",
            products: { $addToSet: "$_id.product" },
          },
        },
        {
          $project: {
            _id: 0,
            category: "$_id",
            products: {
              $filter: {
                input: "$products",
                as: "p",
                cond: { $and: [{ $ne: ["$$p", null] }, { $ne: ["$$p", ""] }] },
              },
            },
          },
        },
        { $sort: { category: 1 } },
      ]);

      return jsonS(res, 200, "Shipping catalog fetched", docs);
    } catch (err) {
      console.error("listShippingCatalog error:", err);
      return jsonFailed(res, {}, "Internal server error", 500);
    }
  },
};

module.exports = Controller;
