import Transaction from '../models/Transaction.js';
import Product from '../models/Product.js';
import Customer from '../models/Customer.js';
import { createNotification } from './notificationService.js';

export const createTransaction = async (data, userId) => {
  const { type, items, warehouseId, entityId } = data;

  // Strict Validation (Crucial without transactions)
  if (!items || items.length === 0) throw new Error('No items provided');
  if (items.some(i => i.quantity <= 0)) throw new Error('Quantities must be positive');

  let total = 0;

  // Process items sequentially
  for (const item of items) {
    const adjustment = type === 'SALE' ? -item.quantity : item.quantity;
    total += item.price * item.quantity;

    // 1. Check if warehouse entry exists
    let product = await Product.findOne({ _id: item.product });
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

    // 2. Atomic increment
    const updatedProduct = await Product.findOneAndUpdate(
      { _id: item.product, 'warehouseStock.warehouse': warehouseId },
      { $inc: { 'warehouseStock.$.quantity': adjustment, quantity: adjustment } },
      { new: true, runValidators: true }
    );

    // 3. Rollback safety (Manual)
    const targetWS = updatedProduct.warehouseStock.find(ws => 
      ws && ws.warehouse && ws.warehouse.toString() === warehouseId.toString()
    );

    if (targetWS && targetWS.quantity < 0) {
      // Reverse the adjustment if it went negative (Simulated rollback)
      await Product.findOneAndUpdate(
        { _id: item.product, 'warehouseStock.warehouse': warehouseId },
        { $inc: { 'warehouseStock.$.quantity': -adjustment, quantity: -adjustment } }
      );
      throw new Error(`Insufficient stock for ${product.name} in this warehouse`);
    }
  }

  const transactionData = {
    ...data,
    total,
    warehouse: warehouseId,
    createdBy: userId,
    paymentMethod: data.paymentMethod || 'CASH',
    [type === 'SALE' ? 'customer' : 'supplier']: entityId
  };

  const transaction = await Transaction.create(transactionData);

  if (type === 'SALE') {
    await Customer.findByIdAndUpdate(entityId, {
      $inc: { totalSpent: total, orderCount: 1 }
    });

    // Notify of new sale
    await createNotification({
      type: 'SALE',
      title: 'New Sale Completed',
      message: `Order #${transaction._id.toString().slice(-6).toUpperCase()} processed successfully ($${total.toFixed(2)})`,
      link: '/history'
    });
  }

  return transaction;
};
