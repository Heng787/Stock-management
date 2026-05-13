import Transaction from '../models/Transaction.js';
import Product from '../models/Product.js';
import Customer from '../models/Customer.js';
import { createNotification } from './notificationService.js';

export const createTransaction = async (data, userId) => {
  const { type, items, warehouseId, entityId, total, currency, paymentMethod, notes, discount, tax, exchangeRate = 1 } = data;

  // 1. Validation
  if (!warehouseId) throw new Error('Warehouse ID is required');
  if (!items || items.length === 0) throw new Error('No items provided');
  if (items.some(i => i.quantity <= 0)) throw new Error('Quantities must be positive');
  if (total == null) throw new Error('Transaction total is required');

  // 2. Process items sequentially with atomic sufficiency checks
  for (const item of items) {
    const adjustment = type === 'SALE' ? -item.quantity : item.quantity;
    
    let product = await Product.findById(item.product);
    if (!product) throw new Error(`Product ${item.product} not found`);

    const hasWarehouseEntry = (product.warehouseStock || []).some(ws => 
      ws && ws.warehouse && ws.warehouse.toString() === warehouseId.toString()
    );

    if (!hasWarehouseEntry) {
      if (type === 'SALE') throw new Error(`No stock available in this warehouse for ${product.name}`);
      // Create entry if it doesn't exist (Purchase case)
      await Product.updateOne(
        { _id: item.product },
        { $push: { warehouseStock: { warehouse: warehouseId, quantity: 0 } } }
      );
    }

    // Atomic update with sufficiency check for SALES
    const query = { 
      _id: item.product, 
      'warehouseStock.warehouse': warehouseId 
    };
    
    if (type === 'SALE') {
      query['warehouseStock.quantity'] = { $gte: item.quantity };
    }

    const updatedProduct = await Product.findOneAndUpdate(
      query,
      { $inc: { 'warehouseStock.$.quantity': adjustment, quantity: adjustment } },
      { new: true, runValidators: true }
    );

    if (!updatedProduct) {
      throw new Error(`Insufficient stock for ${product.name} in selected warehouse`);
    }
  }

  const totalUSD = total / exchangeRate;

  const transactionData = {
    type,
    items,
    total,
    currency: currency || 'USD',
    exchangeRate,
    discount: discount || 0,
    tax: tax || 0,
    warehouse: warehouseId,
    createdBy: userId,
    paymentMethod: paymentMethod || 'CASH',
    paymentDetails: data.paymentDetails,
    expectedDate: data.expectedDate,
    notes,
    [type === 'SALE' ? 'customer' : 'supplier']: entityId
  };

  const transaction = await Transaction.create(transactionData);

  if (type === 'SALE' && entityId) {
    await Customer.findByIdAndUpdate(entityId, {
      $inc: { totalSpent: totalUSD, orderCount: 1 }
    });

    // Notify of new sale
    await createNotification({
      type: 'SALE',
      title: 'New Sale Completed',
      message: `Order #${transaction._id.toString().slice(-6).toUpperCase()} processed successfully (${currency || 'USD'} ${total.toFixed(2)})`,
      link: '/history'
    });
  }

  return transaction;
};

export const getTransactions = async (query = {}) => {
  const { page = 1, limit = 20, startDate, endDate } = query;
  const skip = (page - 1) * limit;

  const filter = {};
  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) {
      const start = new Date(startDate);
      if (isNaN(start.getTime())) throw new Error('Invalid start date format');
      filter.createdAt.$gte = start;
    }
    if (endDate) {
      const end = new Date(endDate);
      if (isNaN(end.getTime())) throw new Error('Invalid end date format');
      end.setHours(23, 59, 59, 999);
      filter.createdAt.$lte = end;
    }
  }

  const transactions = await Transaction.find(filter)
    .populate('items.product', 'name sku')
    .populate('warehouse', 'name')
    .populate('customer', 'name')
    .populate('supplier', 'name')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Transaction.countDocuments(filter);

  return {
    transactions,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  };
};
