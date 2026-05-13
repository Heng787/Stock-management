import Product from '../models/Product.js';
import * as settingsService from './settingsService.js';
import { logActivity } from './auditService.js';

export const getAllProducts = async (rawQuery = {}) => {
  const filter = {};
  // Sanitize inputs by forcing string type
  if (rawQuery.categoryId) filter.categoryId = String(rawQuery.categoryId);
  if (rawQuery.supplierId) filter.supplierId = String(rawQuery.supplierId);
  if (rawQuery.status) filter.status = String(rawQuery.status);
  
  if (rawQuery.search) {
    const escapedSearch = String(rawQuery.search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    filter.$or = [
      { name: { $regex: escapedSearch, $options: 'i' } },
      { sku: { $regex: escapedSearch, $options: 'i' } }
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
  const settings = await settingsService.getSettings();
  
  let sku = data.sku;
  if (!sku && settings?.inventory?.skuPrefixEnabled) {
    sku = `PRD-${Date.now().toString().slice(-6)}`;
  }

  const { 
    name, description, categoryId, supplierId, price, costPrice,
    minStockLevel, maxStockLevel, quantity, unit, binLocation,
    batchNumber, expiryDate, image 
  } = data;

  const cleanData = {
    name,
    description,
    sku,
    price,
    costPrice: costPrice || 0,
    minStockLevel: minStockLevel || 0,
    maxStockLevel: maxStockLevel || 0,
    quantity: quantity || 0,
    unit: unit || 'pcs',
    binLocation,
    batchNumber,
    expiryDate,
    image,
    categoryId: categoryId || null,
    supplierId: supplierId || null
  };

  if (cleanData.maxStockLevel > 0 && (cleanData.quantity || 0) > cleanData.maxStockLevel) {
    throw new Error(`Initial quantity exceeds maximum capacity of ${cleanData.maxStockLevel}`);
  }

  if (data.warehouseId) {
    cleanData.warehouseStock = [{
      warehouse: data.warehouseId,
      quantity: data.quantity || 0
    }];
  }

  const product = await Product.create(cleanData);

  if (data.userId) {
    await logActivity('CREATE', 'PRODUCTS', {
      productId: product._id,
      name: product.name,
      sku: product.sku
    }, data.userId);
  }

  return product;
};

export const validateBulkProducts = (products) => {
  if (!Array.isArray(products) || products.length === 0) {
    throw new Error('Request body must be a non-empty array of products');
  }
  if (products.length > 500) {
    throw new Error('Bulk import limit is 500 products per request');
  }
  
  const invalid = products.filter(item => !item.name || !item.sku || item.price == null);
  if (invalid.length > 0) {
    throw new Error(`${invalid.length} item(s) are missing required fields: name, sku, price`);
  }
  return true;
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
  const { 
    name, description, categoryId, supplierId, price, costPrice,
    minStockLevel, maxStockLevel, quantity, unit, binLocation,
    batchNumber, expiryDate, image 
  } = data;

  const cleanData = {
    name,
    description,
    price,
    costPrice,
    minStockLevel,
    maxStockLevel,
    quantity,
    unit,
    binLocation,
    batchNumber,
    expiryDate,
    image,
    updatedAt: Date.now(),
    categoryId: categoryId || null,
    supplierId: supplierId || null
  };

  if (cleanData.maxStockLevel > 0 && cleanData.quantity > cleanData.maxStockLevel) {
    throw new Error(`Quantity exceeds updated maximum capacity of ${cleanData.maxStockLevel}`);
  }

  const product = await Product.findByIdAndUpdate(id, cleanData, { new: true });

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
