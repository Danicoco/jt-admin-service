const { jsonS, jsonFailed } = require("../../../utils");
const { composeDropOffFilter } = require("./helper");
const DropOff = require("../../../models/dropOff");

const Controller = {
  create: async (req, res) => {
    const { trackingNumber, courier, customerUserId } = req.body;
    try {
      const data = await DropOff.findOne({
        trackingNumber,
        courier,
        customerUserId,
      });
      if (data) return jsonFailed(res, {}, "You already issue drop off", 400);
      const result = await DropOff.create([{ ...req.body }]);
      return jsonS(res, 200, "Drop off created", result);
    } catch (err) {
      console.error(err);
      return jsonFailed(res, {}, "Could not fetch metrics", 500);
    }
  },
  update: async (req, res) => {
    const { status, deliveryFee } = req.body;
    try {
      const data = await DropOff.findOne({
        _id: req.params.id,
      });
      if (!data) return jsonFailed(res, {}, "Drop off does not exist", 404);
      const result = await DropOff.updateOne({ _id: data._id }, { status, deliveryFee });
      return jsonS(res, 200, "Drop off created", result);
    } catch (err) {
      console.error(err);
      return jsonFailed(res, {}, "Could not fetch metrics", 500);
    }
  },
  list: async (req, res) => {
    try {
      const { page, limit } = req.query;

      const filter = composeDropOffFilter(req);
      const skip = (page - 1) * limit;
      const total = await DropOff.countDocuments(filter);
      const dropOffs = await DropOff.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      return jsonS(res, 200, "Drop Off fetched", {
        page: Number(page) || 1,
        limit: Number(limit) || 20,
        total,
        dropOffs,
      });
    } catch (err) {
      console.error("Error listing drop offs:", err);
      return jsonFailed(res, {}, "Error listing drop offs", 500);
    }
  },
  get: async (req, res) => {
    try {
      const dropOff = await DropOff.findOne({ _id: req.params.id })

      return jsonS(res, 200, "Drop Off fetched",dropOff);
    } catch (err) {
      console.error("Error listing drop offs:", err);
      return jsonFailed(res, {}, "Error listing drop offs", 500);
    }
  },
};

module.exports = Controller;
