import AuditLog from '../models/AuditLog.js';

export const getAuditLogs = async (req, res) => {
  try {
    const logs = await AuditLog.find({})
      .populate('userId', 'name email')
      .sort({ timestamp: -1 })
      .limit(100);
    res.json({ success: true, data: logs });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
};
