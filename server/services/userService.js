import User from '../models/User.js';

export const getAllUsers = async () => {
  return await User.find({}).select('-password');
};

export const findUserByEmail = async (email) => {
  return await User.findOne({ email });
};

export const createUser = async (userData) => {
  return await User.create(userData);
};

export const getUserById = async (id) => {
  return await User.findById(id);
};

export const deleteUserById = async (id) => {
  return await User.deleteOne({ _id: id });
};
