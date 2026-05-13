// d:\Work\Stock Management\server\controllers\auditController.js
import AuditLog from '../models/AuditLog.js';

/**
 * @desc    Get all audit logs
 * @route   GET /api/audit
 * @access  Admin
 */
export const getAuditLogs = async (req, res, next) => {
  try {
    const logs = await AuditLog.find({})
      .populate('userId', 'name email')
      .sort({ timestamp: -1 })
      .limit(100);
    
    res.status(200).json({ success: true, data: logs });
  } catch (error) {
    next(error);
  }
};
