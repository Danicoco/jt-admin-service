const { createNotification, listNotifications } = require("../../../services/notificationService");
const { jsonS, jsonFailed } = require("../../../utils");

const Controller = {
  create: async (req, res) => {
    try {
      const result = await createNotification(req.body);
      return jsonS(res, 200, "Notification created", result);
    } catch (err) {
      console.error(err);
      return jsonFailed(res, {}, "Could not create Notifications", 500);
    }
  },
  list: async (req, res) => {
    try {
      const { page, limit, section } = req.query;

      
      const { notifications, total } = await listNotifications({ page, limit });

      return jsonS(res, 200, "Notification fetched", {
        total,
        notifications,
      });
    } catch (err) {
      console.error("Error listing Notifications:", err);
      return jsonFailed(res, {}, "Error listing Notifications", 500);
    }
  },
};

module.exports = Controller;
