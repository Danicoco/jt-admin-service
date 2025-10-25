const { jsonS, jsonFailed } = require("../../../utils");
const {
  listShipments,
  getShipment,
  createShipment,
  updateShipment,
  deleteShipment,
  getMetrics,
} = require("../../../services/shippingService");
const {
  fetchAddresses,
  addAddresses,
  updateAddresses,
} = require("../../../services/userService");

const Controller = {
  metrics: async (req, res) => {
    try {
      const data = await getMetrics();
      return jsonS(res, 200, "Shipment metrics", data);
    } catch (err) {
      console.error(err);
      return jsonFailed(res, {}, "Could not fetch metrics", 500);
    }
  },

  list: async (req, res) => {
    try {
      const { page, limit, status, category, search, customerUserId } =
        req.query;

      const { shipments, total } = await listShipments({
        page,
        limit,
        status,
        category,
        search,
        customerUserId,
      });

      return jsonS(res, 200, "Shipments fetched", {
        page: Number(page) || 1,
        limit: Number(limit) || 20,
        total,
        shipments,
      });
    } catch (err) {
      console.error("Error listing shipments:", err);
      return jsonFailed(res, {}, "Error listing shipments", 500);
    }
  },

  get: async (req, res) => {
    try {
      const shipment = await getShipment(req.params.id);
      return jsonS(res, 200, "Shipment fetched", shipment);
    } catch (err) {
      return jsonFailed(res, {}, err.message, 404);
    }
  },

  create: async (req, res) => {
    try {
      // req.body must include exactly:
      // { customerUserId, sender, receiver, pkg, payment }
      const shipment = await createShipment(req.body);
      return jsonS(res, 201, "Shipment created", shipment);
    } catch (err) {
      console.error(err);
      return jsonFailed(res, {}, err.message, 400);
    }
  },

  update: async (req, res) => {
    try {
      const shipment = await updateShipment(req.params.id, req.body);
      return jsonS(res, 200, "Shipment updated", shipment);
    } catch (err) {
      console.error(err);
      return jsonFailed(res, {}, err.message, 400);
    }
  },
  confirmPay: async (req, res) => {
    try {
      const shipment = await getShipment(req.params.id);

      const result = await updateShipment(req.params.id, { shipmentStatus: 'in_transit', payment: { deliveryFee: shipment.payment.deliveryFee, isPaid: true } });
      return jsonS(res, 200, "Shipment updated", result);
    } catch (err) {
      console.error(err);
      return jsonFailed(res, {}, err.message, 400);
    }
  },

  remove: async (req, res) => {
    try {
      await deleteShipment(req.params.id);
      return jsonS(res, 200, "Shipment deleted", {});
    } catch (err) {
      return jsonFailed(res, {}, err.message, 404);
    }
  },
  listAllAddress: async (req, res) => {
    try {
      const addresses = await fetchAddresses();
      return jsonS(res, 200, "Addresses fetched", addresses);
    } catch (err) {
      console.error("Error fetching user addresses:", err);
      return jsonFailed(res, {}, "Cannot fetch user addresses", 500);
    }
  },
  createAllAddress: async (req, res) => {
    const body = req.body;
    try {
      const addresses = await addAddresses(body);
      return jsonS(res, 200, "Added addresses fetched", addresses);
    } catch (err) {
      console.error("Error fetching user addresses:", err);
      return jsonFailed(res, {}, "Cannot creating addresses", 500);
    }
  },
  updateAllAddress: async (req, res) => {
    try {
      const addresses = await updateAddresses(req.params.id, req.body);
      return jsonS(res, 200, "Addresses fetched", addresses);
    } catch (err) {
      console.error("Error fetching user addresses:", err);
      return jsonFailed(res, {}, "Cannot fetch user addresses", 500);
    }
  },
};

module.exports = Controller;
