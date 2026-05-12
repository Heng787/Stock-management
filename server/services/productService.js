import Product from '../models/Product.js';
import * as settingsService from './settingsService.js';
import { logActivity } from './auditService.js';

export const getAllProducts = async (rawQuery = {}) => {
  // Whitelist allowed query parameters to prevent NoSQL injection
  const filter = {};
  if (rawQuery.categoryId) filter.categoryId = rawQuery.categoryId;
  if (rawQuery.supplierId) filter.supplierId = rawQuery.supplierId;
  if (rawQuery.status) filter.status = rawQuery.status;
  if (rawQuery.search) {
    filter.$or = [
      { name: { $regex: rawQuery.search, $options: 'i' } },
      { sku: { $regex: rawQuery.search, $options: 'i' } }
    ];
  }

  return await Product.find(filter)
    .populate('categoryId', 'name')
    .populate('supplierId', 'name')
    .sort({ name: 1 });
};

export const getProductById = async (id) => {
  return await Product.findById(id).populate('categoryId supplierId');
};

export const createProduct = async (data) => {
  // Fetch global settings to check if SKU auto-generation is enabled
  const settings = await settingsService.getSettings();
  
  let sku = data.sku;
  if (!sku && settings?.inventory?.skuPrefixEnabled) {
    sku = `PRD-${Date.now().toString().slice(-6)}`;
  }

  // Ensure empty strings are handled as null for database references
  const cleanData = {
    ...data,
    sku,
    categoryId: data.categoryId || null,
    supplierId: data.supplierId || null
  };

  // VALIDATION: Check initial quantity against max capacity
  if (cleanData.maxStockLevel > 0 && (cleanData.quantity || 0) > cleanData.maxStockLevel) {
    throw new Error(`Initial quantity exceeds maximum capacity of ${cleanData.maxStockLevel}`);
  }

  // REQUIREMENT: Handle initial warehouse assignment
  if (data.warehouseId) {
    cleanData.warehouseStock = [{
      warehouse: data.warehouseId,
      quantity: data.quantity || 0
    }];
  }

  const product = await Product.create(cleanData);

  // 5. Log activity
  if (data.userId) {
    await logActivity('CREATE', 'PRODUCTS', {
      productId: product._id,
      name: product.name,
      sku: product.sku
    }, data.userId);
  }

  return product;
};

export const createProductsBulk = async (dataArray) => {
  const cleanDataArray = dataArray.map(data => ({
    ...data,
    categoryId: data.categoryId || null,
    supplierId: data.supplierId || null
  }));
  return await Product.insertMany(cleanDataArray);
};

export const updateProduct = async (id, data) => {
  data.updatedAt = Date.now();
  // Ensure empty strings are handled as null for database references
  const cleanData = {
    ...data,
    categoryId: data.categoryId || null,
    supplierId: data.supplierId || null
  };

  // VALIDATION: Ensure new quantity/limit doesn't violate rules
  if (cleanData.maxStockLevel > 0 && cleanData.quantity > cleanData.maxStockLevel) {
    throw new Error(`Quantity exceeds updated maximum capacity of ${cleanData.maxStockLevel}`);
  }

  const product = await Product.findByIdAndUpdate(id, cleanData, { new: true });

  // Log activity
  if (data.userId) {
    await logActivity('UPDATE', 'PRODUCTS', {
      productId: id,
      name: product.name,
      sku: product.sku
    }, data.userId);
  }

  return product;
};

export const deleteProduct = async (id) => {
  return await Product.findByIdAndDelete(id);
};
