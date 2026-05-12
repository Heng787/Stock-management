import express from 'express';
import * as notificationService from '../services/notificationService.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const notifications = await notificationService.getNotifications();
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/:id/read', async (req, res) => {
  try {
    const notification = await notificationService.markAsRead(req.params.id);
    res.json(notification);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/read-all', async (req, res) => {
  try {
    await notificationService.markAllAsRead();
    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
