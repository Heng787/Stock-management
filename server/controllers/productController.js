// d:\Work\Stock Management\server\controllers\productController.js
import * as productService from '../services/productService.js';

/**
 * @desc    Get all products
 * @route   GET /api/products
 * @access  Private
 */
export const getProducts = async (req, res, next) => {
  try {
    const products = await productService.getAllProducts(req.query);
    res.status(200).json({ success: true, data: products });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single product
 * @route   GET /api/products/:id
 * @access  Private
 */
export const getProduct = async (req, res, next) => {
  try {
    const product = await productService.getProductById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }
    res.status(200).json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Add new product
 * @route   POST /api/products
 * @access  Private
 */
export const addProduct = async (req, res, next) => {
  try {
    const product = await productService.createProduct(req.body);
    res.status(201).json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Bulk add products
 * @route   POST /api/products/bulk
 * @access  Private
 */
export const addProductsBulk = async (req, res, next) => {
  try {
    productService.validateBulkProducts(req.body);
    const products = await productService.createProductsBulk(req.body);
    res.status(201).json({ success: true, data: products, count: products.length });
  } catch (error) {
    // If it's a validation error, return 400
    if (error.message.includes('missing required fields') || error.message.includes('limit') || error.message.includes('non-empty array')) {
      return res.status(400).json({ success: false, error: error.message });
    }
    next(error);
  }
};

/**
 * @desc    Update product
 * @route   PUT /api/products/:id
 * @access  Private
 */
export const updateProduct = async (req, res, next) => {
  try {
    const product = await productService.updateProduct(req.params.id, req.body);
    res.status(200).json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Remove product
 * @route   DELETE /api/products/:id
 * @access  Private
 */
export const removeProduct = async (req, res, next) => {
  try {
    await productService.deleteProduct(req.params.id);
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get product movement history
 * @route   GET /api/products/:id/history
 * @access  Private
 */
export const getProductHistory = async (req, res, next) => {
  try {
    const { getProductHistory } = await import('../services/movementService.js');
    const history = await getProductHistory(req.params.id);
    res.status(200).json({ success: true, data: history });
  } catch (error) {
    next(error);
  }
};
