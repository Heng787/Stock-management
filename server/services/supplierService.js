import Supplier from '../models/Supplier.js';

export const getAllSuppliers = async () => {
  return await Supplier.find().sort({ name: 1 });
};

export const createSupplier = async (data) => {
  const { name, contactPerson, email, phone, address, categories, rating } = data;
  return await Supplier.create({ name, contactPerson, email, phone, address, categories, rating });
};

export const updateSupplier = async (id, data) => {
  const { name, contactPerson, email, phone, address, categories, rating } = data;
  return await Supplier.findByIdAndUpdate(id, { name, contactPerson, email, phone, address, categories, rating }, { new: true });
};

export const deleteSupplier = async (id) => {
  return await Supplier.findByIdAndDelete(id);
};
