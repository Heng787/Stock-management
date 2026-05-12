import Supplier from '../models/Supplier.js';

export const getAllSuppliers = async () => {
  return await Supplier.find().sort({ name: 1 });
};

export const createSupplier = async (data) => {
  return await Supplier.create(data);
};

export const updateSupplier = async (id, data) => {
  return await Supplier.findByIdAndUpdate(id, data, { new: true });
};

export const deleteSupplier = async (id) => {
  return await Supplier.findByIdAndDelete(id);
};
