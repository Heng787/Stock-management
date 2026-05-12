import Customer from '../models/Customer.js';

export const getCustomers = async (req, res, next) => {
  try {
    const customers = await Customer.find().sort({ name: 1 });
    res.status(200).json({ success: true, data: customers });
  } catch (error) {
    next(error);
  }
};

export const getCustomer = async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) throw new Error('Customer not found');
    res.status(200).json({ success: true, data: customer });
  } catch (error) {
    next(error);
  }
};

export const addCustomer = async (req, res, next) => {
  try {
    const customer = await Customer.create(req.body);
    res.status(201).json({ success: true, data: customer });
  } catch (error) {
    next(error);
  }
};

export const updateCustomer = async (req, res, next) => {
  try {
    const customer = await Customer.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!customer) throw new Error('Customer not found');
    res.status(200).json({ success: true, data: customer });
  } catch (error) {
    next(error);
  }
};

export const removeCustomer = async (req, res, next) => {
  try {
    const customer = await Customer.findByIdAndDelete(req.params.id);
    if (!customer) throw new Error('Customer not found');
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    next(error);
  }
};
