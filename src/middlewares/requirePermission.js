const Admin = require("../models/admin");
const Role = require("../models/role");

const CACHE_MS = 60 * 1000;
const cache = new Map(); // adminId -> { permissions, at }

async function permissionsFor(adminId) {
  const hit = cache.get(adminId);
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.permissions;
  const admin = await Admin.findById(adminId).select("roleId isActive").lean();
  const role = admin?.isActive === false ? null : admin && (await Role.findById(admin.roleId).lean());
  const permissions = role?.permissions || [];
  cache.set(adminId, { permissions, at: Date.now() });
  return permissions;
}

const read = (perms, key) => (perms instanceof Map ? perms.get(key) : perms?.[key]);

/**
 * Require a role permission, e.g. requirePermission("Monitoring", "canConfigure").
 * Runs after the admin auth middleware. Role changes apply within a minute.
 */
const requirePermission = (module, permission) => async (req, res, next) => {
  try {
    const permissions = await permissionsFor(req.user?.id);
    const entry = permissions.find((p) => String(p.module).toLowerCase() === module.toLowerCase());
    if (read(entry?.permissions, permission) === true) return next();
    return res.status(403).json({
      status: "error",
      message: `You don't have permission to do this (${module}: ${permission})`,
      data: null,
    });
  } catch (e) {
    console.error("requirePermission error:", e);
    return res.status(500).json({ status: "error", message: "Permission check failed", data: null });
  }
};

module.exports = { requirePermission };
