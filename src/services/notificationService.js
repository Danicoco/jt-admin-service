const Notification = require('../models/notification');

async function listNotifications({ page = 1, limit = 20, category, unreadOnly }) {
  const skip = (page - 1) * limit;
  const filter = {};
  if (category)    filter.category = category;
  if (unreadOnly)  filter.isRead = false;

  const total = await Notification.countDocuments(filter);
  const notifications = await Notification
    .find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  return { notifications, total };
}

async function getNotification(id) {
  const n = await Notification.findById(id);
  if (!n) throw new Error('Notification not found');
  return n;
}

async function createNotification(data) {
  const { title, message, category } = data;
  if (!title || !message) throw new Error('`title` and `message` are required');
  return Notification.create({ ...data, title, message, category });
}

async function markAsRead(id) {
  const n = await Notification.findByIdAndUpdate(id, { isRead: true }, { new: true });
  if (!n) throw new Error('Notification not found');
  return n;
}

async function deleteNotification(id) {
  const n = await Notification.findByIdAndDelete(id);
  if (!n) throw new Error('Notification not found');
}

module.exports = {
  listNotifications,
  getNotification,
  createNotification,
  markAsRead,
  deleteNotification,
};
