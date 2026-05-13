import Customer from '../models/Customer.js';

export const getAllCustomers = async () => {
  return await Customer.find().sort({ name: 1 });
};

export const getCustomerById = async (id) => {
  const customer = await Customer.findById(id);
  if (!customer) throw new Error('Customer not found');
  return customer;
};

export const createCustomer = async (customerData) => {
  return await Customer.create(customerData);
};

export const updateCustomer = async (id, customerData) => {
  const customer = await Customer.findByIdAndUpdate(id, customerData, { new: true, runValidators: true });
  if (!customer) throw new Error('Customer not found');
  return customer;
};

export const deleteCustomer = async (id) => {
  const customer = await Customer.findByIdAndDelete(id);
  if (!customer) throw new Error('Customer not found');
  return customer;
};
