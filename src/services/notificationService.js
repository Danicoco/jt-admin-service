const Notification = require('../models/notification');
const { sendPush } = require('./userService');

const PLATFORMS = ['android', 'ios'];

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

  const device = (Array.isArray(data.device) ? data.device : []).filter((d) =>
    PLATFORMS.includes(d),
  );
  const notification = await Notification.create({ title, message, category, device });

  // no device ticked, or both ticked, means everyone
  const platforms = device.length && device.length < PLATFORMS.length ? device : undefined;

  let push;
  try {
    const r = await sendPush({
      all: true,
      platforms,
      title,
      body: message,
      data: { type: 'broadcast', notificationId: notification._id },
    });
    push = {
      status: r?.skipped ? 'skipped' : 'sent',
      targeted: r?.targeted || 0,
      success: r?.success || 0,
      failure: r?.failure || 0,
    };
  } catch (e) {
    console.error('push broadcast error:', e?.response?.data || e.message);
    push = { status: 'failed', error: e?.response?.data?.message || e.message };
  }

  notification.push = push;
  await notification.save();
  return notification;
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
