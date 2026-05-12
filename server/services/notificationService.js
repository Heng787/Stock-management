import Notification from '../models/Notification.js';

export const createNotification = async (data) => {
  try {
    return await Notification.create(data);
  } catch (err) {
    console.error('Failed to create notification:', err);
  }
};

export const getNotifications = async (limit = 10) => {
  return await Notification.find()
    .sort({ timestamp: -1 })
    .limit(limit);
};

export const markAsRead = async (id) => {
  return await Notification.findByIdAndUpdate(id, { isRead: true }, { new: true });
};

export const markAllAsRead = async () => {
  return await Notification.updateMany({ isRead: false }, { isRead: true });
};

export const deleteOldNotifications = async (days = 30) => {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  return await Notification.deleteMany({ timestamp: { $lt: cutoff } });
};
