// d:\Work\Stock Management\server\controllers\customerController.js
import * as customerService from '../services/customerService.js';

/**
 * @desc    Get all customers
 * @route   GET /api/customers
 * @access  Private
 */
export const getCustomers = async (req, res, next) => {
  try {
    const customers = await customerService.getAllCustomers();
    res.status(200).json({ success: true, data: customers });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single customer
 * @route   GET /api/customers/:id
 * @access  Private
 */
export const getCustomer = async (req, res, next) => {
  try {
    const customer = await customerService.getCustomerById(req.params.id);
    res.status(200).json({ success: true, data: customer });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Add new customer
 * @route   POST /api/customers
 * @access  Private
 */
export const addCustomer = async (req, res, next) => {
  try {
    const customer = await customerService.createCustomer(req.body);
    res.status(201).json({ success: true, data: customer });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update customer
 * @route   PUT /api/customers/:id
 * @access  Private
 */
export const updateCustomer = async (req, res, next) => {
  try {
    const customer = await customerService.updateCustomer(req.params.id, req.body);
    res.status(200).json({ success: true, data: customer });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Remove customer
 * @route   DELETE /api/customers/:id
 * @access  Private
 */
export const removeCustomer = async (req, res, next) => {
  try {
    await customerService.deleteCustomer(req.params.id);
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    next(error);
  }
};
