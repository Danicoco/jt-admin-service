const { jsonS, jsonFailed } = require("../../../utils");
const Banner = require("../../../models/banner");

const Controller = {
  create: async (req, res) => {
    try {
      const result = await Banner.create([{ ...req.body }]);
      return jsonS(res, 200, "Banner created", result);
    } catch (err) {
      console.error(err);
      return jsonFailed(res, {}, "Could not create banners", 500);
    }
  },
  update: async (req, res) => {
    try {
      const banner = await Banner.findOne({ id: req.params.id });
      if (!banner) return jsonFailed(res, {}, "Banner does not exists", 500);
      const result = await Banner.updateOne(
        { _id: banner._id },
        { ...req.body }
      );
      return jsonS(res, 200, "Banner updated", result);
    } catch (err) {
      console.error(err);
      return jsonFailed(res, {}, "Could not update banners", 500);
    }
  },
  remove: async (req, res) => {
    try {
      const banner = await Banner.findOne({ id: req.params.id });
      if (!banner) return jsonFailed(res, {}, "Banner does not exists", 500);
      const result = await Banner.deleteOne(
        { _id: banner._id },
      );
      return jsonS(res, 200, "Banner delete", result);
    } catch (err) {
      console.error(err);
      return jsonFailed(res, {}, "Could not update banners", 500);
    }
  },
  list: async (req, res) => {
    try {
      const { page, limit, section } = req.query;

      const skip = (page - 1) * limit;
      const total = await Banner.countDocuments({
        ...(section && { section }),
      });
      const banners = await Banner.find({ ...(section && { section }) })
        .sort({ "created_at": -1 })
        .skip(skip)
        .limit(limit);

      return jsonS(res, 200, "Banner fetched", {
        page: Number(page) || 1,
        limit: Number(limit) || 20,
        total,
        banners,
      });
    } catch (err) {
      console.error("Error listing Banners:", err);
      return jsonFailed(res, {}, "Error listing Banners", 500);
    }
  },
};

module.exports = Controller;
