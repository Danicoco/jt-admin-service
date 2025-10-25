const { jsonS, jsonFailed } = require("../../../utils");
var config = require("../../../config/jwt");
const Admin = require("../../../models/admin");
const errorHandler = require("../../../utils/errorHandler");
const { composeFilter } = require("./helper");

const Controller = {
  list: async (req, res) => {
    try {
      const filter = composeFilter(req);
      console.log(filter, "FILTER");
      const admins = await Admin.find(filter, {}, { populate: 'roleId' }).sort({
        createdAt: -1,
      });

      return jsonS(res, 200, "Admins fetched", {
        admins,
      });
    } catch (error) {
      console.error(error);
      errorHandler(error, req, res);
      return jsonFailed(res, {}, "server error", 500);
    }
  },
};
module.exports = Controller;
