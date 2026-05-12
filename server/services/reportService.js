import Product from '../models/Product.js';
import Transaction from '../models/Transaction.js';

export const getSummary = async () => {
  const products = await Product.find();
  const totalValuation = products.reduce((acc, p) => acc + (p.quantity * (p.costPrice || p.price)), 0);
  const totalSKUs = products.length;
  const stockOuts = products.filter(p => p.quantity <= 0).length;
  const lowStock = products.filter(p => p.quantity > 0 && p.quantity <= p.minStockLevel).length;

  const pendingOrders = await Transaction.countDocuments({ status: 'PENDING' });

  return {
    totalValuation,
    totalSKUs,
    stockOuts,
    lowStock,
    pendingOrders
  };
};

export const getMovers = async () => {
  // Simple logic: sort by quantity sold in last 30 days
  // For now, we'll just return top/bottom based on total stock movement count in transactions
  const fastMovers = await Transaction.aggregate([
    { $match: { type: 'SALE' } },
    { $unwind: '$items' },
    { $group: { _id: '$items.product', totalSold: { $sum: '$items.quantity' }, name: { $first: '$items.name' } } },
    { $sort: { totalSold: -1 } },
    { $limit: 5 }
  ]);

  const slowMovers = await Product.find({ quantity: { $gt: 0 } })
    .sort({ quantity: 1 }) // Items sitting in stock
    .limit(5)
    .select('name quantity');

  return { fastMovers, slowMovers };
};
