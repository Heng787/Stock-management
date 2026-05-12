import * as productService from '../services/productService.js';

export const getProducts = async (req, res, next) => {
  try {
    const products = await productService.getAllProducts(req.query);
    res.status(200).json({ success: true, data: products });
  } catch (error) {
    next(error);
  }
};

export const getProduct = async (req, res, next) => {
  try {
    const product = await productService.getProductById(req.params.id);
    if (!product) throw new Error('Product not found');
    res.status(200).json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

export const addProduct = async (req, res, next) => {
  try {
    const product = await productService.createProduct(req.body);
    res.status(201).json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

export const addProductsBulk = async (req, res, next) => {
  try {
    if (!Array.isArray(req.body) || req.body.length === 0) {
      return res.status(400).json({ success: false, error: 'Request body must be a non-empty array of products' });
    }
    if (req.body.length > 500) {
      return res.status(400).json({ success: false, error: 'Bulk import limit is 500 products per request' });
    }
    // Validate required fields on each item
    const invalid = req.body.filter(item => !item.name || !item.sku || item.price == null);
    if (invalid.length > 0) {
      return res.status(400).json({
        success: false,
        error: `${invalid.length} item(s) are missing required fields: name, sku, price`
      });
    }
    const products = await productService.createProductsBulk(req.body);
    res.status(201).json({ success: true, data: products, count: products.length });
  } catch (error) {
    next(error);
  }
};

export const updateProduct = async (req, res, next) => {
  try {
    const product = await productService.updateProduct(req.params.id, req.body);
    res.status(200).json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

export const removeProduct = async (req, res, next) => {
  try {
    await productService.deleteProduct(req.params.id);
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    next(error);
  }
};

export const getProductHistory = async (req, res, next) => {
  try {
    const { getProductHistory } = await import('../services/movementService.js');
    const history = await getProductHistory(req.params.id);
    res.status(200).json({ success: true, data: history });
  } catch (error) {
    next(error);
  }
};
