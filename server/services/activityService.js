import StockMovement from '../models/StockMovement.js';
import Transaction from '../models/Transaction.js';

/**
 * Returns the last N combined system activities from movements and transactions.
 * Normalized to the shape Kevin's ActivityFeed component expects:
 * { id, type, user, action, target, timestamp }
 *
 * Movement types map to: STOCK_IN | STOCK_OUT
 * Transaction type SALE maps to: STOCK_OUT
 * Transaction type PURCHASE maps to: PURCHASE
 */
export const getRecentActivity = async (limit = 10) => {
  const [movements, transactions] = await Promise.all([
    StockMovement.find()
      .populate('productId', 'name')
      .populate('userId', 'name')
      .sort({ timestamp: -1 })
      .limit(limit),
    Transaction.find()
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .limit(limit)
  ]);

  const movementActivities = movements.map(m => {
    let type, action;
    if (m.type === 'IN') {
      type = 'STOCK_IN';
      action = `added ${m.quantity}x`;
    } else if (m.type === 'OUT') {
      type = 'STOCK_OUT';
      action = `removed ${m.quantity}x`;
    } else {
      // ADJUSTMENT
      type = 'UPDATE';
      action = `adjusted stock by ${m.quantity}x`;
    }
    return {
      id: m._id.toString(),
      type,
      user: m.userId?.name || 'System',
      action,
      target: m.productId?.name || 'Unknown Product',
      timestamp: m.timestamp
    };
  });

  const transactionActivities = transactions.map(t => ({
    id: t._id.toString(),
    type: t.type === 'SALE' ? 'STOCK_OUT' : 'PURCHASE',
    user: t.createdBy?.name || 'System',
    action: t.type === 'SALE'
      ? `processed sale worth $${t.total?.toFixed(2)}`
      : `created purchase order worth $${t.total?.toFixed(2)}`,
    target: t.type === 'SALE' ? 'Sales Order' : 'Purchase Order',
    timestamp: t.createdAt
  }));

  // Merge and sort all activity by timestamp desc, return top N
  const combined = [...movementActivities, ...transactionActivities]
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, limit);

  return combined;
};
