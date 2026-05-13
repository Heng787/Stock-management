import Product from '../models/Product.js';
import Transaction from '../models/Transaction.js';

import Warehouse from '../models/Warehouse.js';

export const getInventoryValuation = async () => {
  const products = await Product.find({});
  const warehouses = await Warehouse.find({});
  
  return warehouses.map(w => {
    let totalValue = 0;
    let itemCount = 0;
    
    products.forEach(p => {
      const stock = p.warehouseStock?.find(s => s.warehouse?.toString() === w._id.toString());
      if (stock && stock.quantity > 0) {
        // Use costPrice for valuation, fallback to price
        totalValue += stock.quantity * (p.costPrice || p.price || 0);
        itemCount++;
      }
    });
    
    return {
      warehouse: w.name,
      totalValue,
      itemCount
    };
  });
};

export const getSalesReport = async (days = 30, customStart = null, customEnd = null) => {
  let start;
  let end = customEnd ? new Date(customEnd) : new Date();
  
  if (customStart) {
    start = new Date(customStart);
  } else {
    start = new Date();
    start.setDate(start.getDate() - days);
  }

  const query = {
    type: 'SALE',
    createdAt: { $gte: start, $lte: end }
  };

  const transactions = await Transaction.find(query);

  const totalSales = transactions.reduce((sum, t) => sum + (t.total / (t.exchangeRate || 1)), 0);
  const orderCount = transactions.length;

  return {
    totalSales,
    orderCount,
    averageOrderValue: orderCount > 0 ? totalSales / orderCount : 0,
    growth: 15
  };
};

export const getSalesTrends = async (customStart = null, customEnd = null) => {
  let labels = [];
  let salesTrend = [];
  
  // For trends, we usually want the last 7 items in the range or a fixed interval
  // If no custom range, default to last 7 days
  const end = customEnd ? new Date(customEnd) : new Date();
  const start = customStart ? new Date(customStart) : new Date(new Date().setDate(new Date().getDate() - 6));
  
  // Calculate day-by-day trend
  const transactions = await Transaction.find({
    type: 'SALE',
    createdAt: { $gte: start, $lte: end }
  });

  // Calculate day-by-day trend
  let current = new Date(start);
  while (current <= end) {
    const d = new Date(current);
    d.setHours(0, 0, 0, 0);
    const next = new Date(d);
    next.setDate(next.getDate() + 1);
    
    const dayTransactions = transactions.filter(t => {
      const tDate = new Date(t.createdAt);
      return tDate >= d && tDate < next;
    });
    
    labels.push(d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
    salesTrend.push(dayTransactions.reduce((sum, t) => sum + (t.total / (t.exchangeRate || 1)), 0));
    
    current.setDate(current.getDate() + 1);
    if (labels.length > 60) break; // Increased cap but still safe
  }

  return {
    labels,
    salesTrend,
    stockTrend: new Array(labels.length).fill(0)
  };
}

export const getTopSellingProducts = async (customStart = null, customEnd = null) => {
  const query = { type: 'SALE' };
  if (customStart || customEnd) {
    query.createdAt = {};
    if (customStart) query.createdAt.$gte = new Date(customStart);
    if (customEnd) {
      const end = new Date(customEnd);
      end.setHours(23, 59, 59, 999);
      query.createdAt.$lte = end;
    }
  }

  const transactions = await Transaction.find(query)
    .populate({
      path: 'items.product',
      populate: { path: 'categoryId', select: 'name' }
    });
  
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
      productSales[id].revenue += (item.quantity * item.price) / (t.exchangeRate || 1);
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
