import AuditLog from '../models/AuditLog.js';

export const logActivity = async (action, module, details, userId) => {
  try {
    await AuditLog.create({
      action,
      module,
      details,
      userId
    });
  } catch (err) {
    console.error('Audit Logging Failed:', err);
    // We don't throw here to avoid breaking the main operation if logging fails
  }
};
