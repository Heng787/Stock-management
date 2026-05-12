import Product from '../models/Product.js';
import Transaction from '../models/Transaction.js';

import Warehouse from '../models/Warehouse.js';

export const getInventoryValuation = async () => {
  const products = await Product.find({});
  const warehouses = await Warehouse.find({});
  
  // Calculate valuation per warehouse
  const valuationByWarehouse = warehouses.map(w => {
    const warehouseProducts = products.filter(p => p.warehouseId?.toString() === w._id.toString());
    const totalValue = warehouseProducts.reduce((sum, p) => sum + (p.quantity * p.price), 0);
    
    return {
      warehouse: w.name,
      totalValue: totalValue,
      itemCount: warehouseProducts.length
    };
  });

  return valuationByWarehouse;
};

export const getSalesReport = async (days = 30) => {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const transactions = await Transaction.find({
    type: 'SALE',
    createdAt: { $gte: startDate }
  });

  const totalSales = transactions.reduce((sum, t) => sum + t.total, 0);
  const orderCount = transactions.length;

  return {
    totalSales,
    orderCount,
    averageOrderValue: orderCount > 0 ? totalSales / orderCount : 0,
    growth: 15 // Mock growth for now, will calculate vs previous period later
  };
};

export const getSalesTrends = async () => {
  const last7Days = [...Array(7)].map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    return d;
  }).reverse();

  const trends = await Promise.all(last7Days.map(async date => {
    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + 1);
    const transactions = await Transaction.find({
      type: 'SALE',
      createdAt: { $gte: date, $lt: nextDate }
    });
    return {
      date: date.toLocaleDateString('en-US', { weekday: 'short' }),
      sales: transactions.reduce((sum, t) => sum + t.total, 0)
    };
  }));

  return {
    labels: trends.map(t => t.date),
    salesTrend: trends.map(t => t.sales),
    stockTrend: [0, 0, 0, 0, 0, 0, 0] // Placeholder for now
  };
}

export const getTopSellingProducts = async () => {
  const transactions = await Transaction.find({ type: 'SALE' })
    .populate({
      path: 'items.product',
      populate: { path: 'categoryId', select: 'name' }
    })
    .limit(500); // Look at more transactions for better top-selling data
  
  const productSales = {};
  transactions.forEach(t => {
    t.items.forEach(item => {
      if (!item || !item.product) return;
      
      // Handle both populated object and raw ID
      const productObj = item.product;
      const id = (productObj._id || productObj).toString();
      
      if (!productSales[id]) {
        productSales[id] = {
          name: productObj.name || item.name || 'Unknown Product',
          category: productObj.categoryId?.name || 'General',
          totalSold: 0,
          revenue: 0
        };
      }
      productSales[id].totalSold += item.quantity;
      productSales[id].revenue += item.quantity * item.price;
    });
  });

  const sorted = Object.values(productSales)
    .sort((a, b) => b.totalSold - a.totalSold)
    .map(p => ({
      name: p.name,
      category: p.category,
      sold: p.totalSold,
      revenue: p.revenue
    }))
    .slice(0, 5);

  console.log(`[Analytics] Found ${sorted.length} top selling products`);
  return sorted;
};
