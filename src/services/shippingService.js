const Shipment = require('../models/shipment');

async function listShipments({
  page = 1,
  limit = 20,
  status,
  category,
  search,
  customerUserId
}) {
  const skip = (page - 1) * limit;
  const filter = {};

  if (customerUserId) {
    filter.customerUserId = customerUserId;
  }

  if (status) {
    filter.shipmentStatus = status;
  }

  if (category) {
    // pkg.category lives under nested pkg
    filter['pkg.category'] = category;
  }

  if (search) {
    const re = new RegExp(search, 'i');
    filter.$or = [
      { _id: re },
      { 'sender.name': re },
      { 'receiver.name': re },
    ];
  }

  const total = await Shipment.countDocuments(filter);
  const shipments = await Shipment.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  return { shipments, total };
}

async function getShipment(id) {
  const s = await Shipment.findById(id);
  if (!s) throw new Error('Shipment not found');
  return s;
}

async function createShipment(data) {
  ['customerUserId','receiver','pkg','payment'].forEach(k => {
    if (data[k] == null) {
      throw new Error(`Missing required field: ${k}`);
    }
  });
  console.log(data, "This is for shipping");
  return Shipment.create(data);
}

async function updateShipment(id, updates) {
  const s = await Shipment.findByIdAndUpdate(id, updates, { new: true });
  if (!s) throw new Error('Shipment not found');
  return s;
}

async function deleteShipment(id) {
  const s = await Shipment.findByIdAndDelete(id);
  if (!s) throw new Error('Shipment not found');
}

async function getMetrics() {
  const statuses = ['pending','shipped','in_transit','delivered','need_attention'];
  const [pending, shipped, in_transit, delivered, need_attention] = await Promise.all([
    Shipment.countDocuments({ shipmentStatus: statuses[0] }),
    Shipment.countDocuments({ shipmentStatus: statuses[1] }),
    Shipment.countDocuments({ shipmentStatus: statuses[2] }),
    Shipment.countDocuments({ shipmentStatus: statuses[3] }),
    Shipment.countDocuments({ shipmentStatus: statuses[4] }),  
  ])
  return {
    pending,
    shipped,
    in_transit,
    delivered,
    need_attention
  }
}

module.exports = {
  listShipments,
  getShipment,
  createShipment,
  updateShipment,
  deleteShipment,
  getMetrics,
};
