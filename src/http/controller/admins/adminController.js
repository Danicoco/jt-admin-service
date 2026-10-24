const { jsonS, jsonFailed } = require("../../../utils");
var config = require("../../../config/jwt");
const Admin = require("../../../models/admin");
const Role = require("../../../models/role");
const { composeFilter } = require("./helper");

const Controller = {
  list: async (req, res) => {
    try {
      const filter = composeFilter(req);
      const admins = await Admin.find(filter, { password: 0 }, { populate: 'roleId' }).sort({
        createdAt: -1,
      });

      return jsonS(res, 200, "Admins fetched", {
        admins,
      });
    } catch (error) {
      console.error(error);
      return jsonFailed(res, {}, "server error", 500);
    }
  },
  updateStatus: async (req, res) => {
    const { isActive } = req.body;
    if (typeof isActive !== "boolean")
      return jsonFailed(res, {}, "isActive must be true or false", 400);
    try {
      if (!isActive && String(req.params.id) === String(req.user?.id))
        return jsonFailed(res, {}, "You can't deactivate your own account", 400);
      const admin = await Admin.findById(req.params.id);
      if (!admin) return jsonFailed(res, {}, "Admin not found", 404);
      // the admin's role may have been deleted while they were inactive
      if (isActive && !(await Role.exists({ _id: admin.roleId })))
        return jsonFailed(res, {}, "This admin's role no longer exists", 400);
      admin.isActive = isActive;
      await admin.save();
      return jsonS(res, 200, isActive ? "Admin activated" : "Admin deactivated", {
        _id: admin._id,
        isActive: admin.isActive,
      });
    } catch (error) {
      console.error(error);
      return jsonFailed(res, {}, "Could not update admin status", 500);
    }
  },
};
module.exports = Controller;
