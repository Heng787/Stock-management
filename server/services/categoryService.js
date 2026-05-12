import Category from '../models/Category.js';

export const getAllCategories = async () => {
  return await Category.find().sort({ name: 1 });
};

export const createCategory = async (data) => {
  return await Category.create(data);
};

export const updateCategory = async (id, data) => {
  return await Category.findByIdAndUpdate(id, data, { new: true, runValidators: true });
};

export const deleteCategory = async (id) => {
  return await Category.findByIdAndDelete(id);
};
