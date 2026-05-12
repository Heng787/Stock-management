import StockMovement from '../models/StockMovement.js';
import Product from '../models/Product.js';
import mongoose from 'mongoose';
import { logActivity } from './auditService.js';
import { createNotification } from './notificationService.js';

export const createMovement = async (movementData) => {
  const { productId, type, quantity, warehouseId, userId } = movementData;
  
  // 1. Create movement record
  const movement = await StockMovement.create(movementData);

  // 2. Calculate adjustment
  let adjustment;
  if (type === 'IN') adjustment = quantity;
  else if (type === 'OUT') adjustment = -quantity;
  else adjustment = quantity;

  const product = await Product.findById(productId);
  if (!product) throw new Error('Product not found');

  // 3. Update Warehouse specific stock
  let targetWarehouseId = warehouseId;
  
  // Fallback to default if no warehouseId provided
  if (!targetWarehouseId) {
    const Warehouse = mongoose.model('Warehouse');
    let warehouse = await Warehouse.findOne({ isDefault: true }) || await Warehouse.findOne();
    if (!warehouse) throw new Error('No warehouse found in system');
    targetWarehouseId = warehouse._id;
  }

  // Check if product already has this warehouse in its stock list
  const warehouseIndex = (product.warehouseStock || []).findIndex(ws => 
    ws && ws.warehouse && ws.warehouse.toString() === targetWarehouseId.toString()
  );

  if (warehouseIndex === -1) {
    // Add new warehouse entry to product
    await Product.updateOne(
      { _id: productId },
      { 
        $push: { warehouseStock: { warehouse: targetWarehouseId, quantity: adjustment } },
        $inc: { quantity: adjustment }
      }
    );
  } else {
    // Update existing warehouse entry
    const updateQuery = {};
    updateQuery[`warehouseStock.${warehouseIndex}.quantity`] = adjustment;
    
    await Product.updateOne(
      { _id: productId },
      { 
        $inc: { 
          quantity: adjustment,
          ...updateQuery
        } 
      }
    );
  }

  // Final check for negative stock
  const finalProduct = await Product.findById(productId);
  if (finalProduct.quantity < 0 && type === 'OUT') {
    throw new Error('Insufficient stock for this operation');
  }

  // 5. Log activity
  await logActivity(type === 'ADJUSTMENT' ? 'ADJUST' : 'UPDATE', 'STOCK', {
    productId,
    productName: product.name, // Added for readability
    type,
    quantity: adjustment,
    warehouseId: targetWarehouseId
  }, userId);

  // 6. Check for Low Stock Notification
  if (finalProduct.quantity <= finalProduct.minStockLevel) {
    await createNotification({
      type: 'LOW_STOCK',
      title: 'Low Stock Alert',
      message: `${finalProduct.name} is below threshold (${finalProduct.quantity} left)`,
      link: '/inventory'
    });
  }

  return movement;
};

export const getProductHistory = async (productId) => {
  return await StockMovement.find({ productId })
    .populate('userId', 'name')
    .sort({ timestamp: -1 });
};
