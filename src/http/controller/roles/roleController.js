const { jsonS, jsonFailed } = require("../../../utils");
const Role = require("../../../models/role");
const Admin = require("../../../models/admin");
const { permissionFeatures } = require("./helper");

const Controller = {
  create: async (req, res) => {
    const { title } = req.body;
    try {
      const role = await Role.findOne({ title });
      if (role) return jsonFailed(res, {}, "Role already exists", 400);
      const result = await Role.create([{ ...req.body }]);
      return jsonS(res, 200, "Role created", result);
    } catch (err) {
      console.error(err);
      return jsonFailed(res, {}, "Could not create Roles", 500);
    }
  },
  update: async (req, res) => {
    try {
      const role = await Role.findById(req.params.id);
      if (!role) return jsonFailed(res, {}, "Role does not exists", 404);
      const result = await Role.updateOne({ _id: role._id }, { ...req.body });
      return jsonS(res, 200, "Role updated", result);
    } catch (err) {
      console.error(err);
      return jsonFailed(res, {}, "Could not update Roles", 500);
    }
  },
  remove: async (req, res) => {
    try {
      const role = await Role.findById(req.params.id);
      if (!role) return jsonFailed(res, {}, "Role does not exists", 404);
      // every admin on the role must be deactivated before it can go
      const activeAdmins = await Admin.countDocuments({
        roleId: role._id,
        isActive: { $ne: false },
      });
      if (activeAdmins)
        return jsonFailed(
          res,
          { activeAdmins },
          `Deactivate the ${activeAdmins} active admin${activeAdmins > 1 ? "s" : ""} on this role before deleting it`,
          400,
        );
      const result = await Role.deleteOne({ _id: role._id });
      return jsonS(res, 200, "Role deleted", result);
    } catch (err) {
      console.error(err);
      return jsonFailed(res, {}, "Could not delete Role", 500);
    }
  },
  list: async (req, res) => {
    try {
      const roles = await Role.find({}).sort({ createdAt: -1 });

      return jsonS(res, 200, "Role fetched", {
        roles,
      });
    } catch (err) {
      console.error("Error listing Roles:", err);
      return jsonFailed(res, {}, "Error listing Roles", 500);
    }
  },
  permissionList: async (req, res) => {
    try {
      return jsonS(res, 200, "Permissions fetched", {
        permissionFeatures,
      });
    } catch (err) {
      return jsonFailed(res, {}, "Error listing permissions", 500);
    }
  },
};

module.exports = Controller;
