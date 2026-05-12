import * as supplierService from '../services/supplierService.js';

export const getSuppliers = async (req, res, next) => {
  try {
    const suppliers = await supplierService.getAllSuppliers();
    res.status(200).json({ success: true, data: suppliers });
  } catch (error) {
    next(error);
  }
};

export const addSupplier = async (req, res, next) => {
  try {
    const supplier = await supplierService.createSupplier(req.body);
    res.status(201).json({ success: true, data: supplier });
  } catch (error) {
    next(error);
  }
};

export const updateSupplier = async (req, res, next) => {
  try {
    const supplier = await supplierService.updateSupplier(req.params.id, req.body);
    res.status(200).json({ success: true, data: supplier });
  } catch (error) {
    next(error);
  }
};

export const removeSupplier = async (req, res, next) => {
  try {
    await supplierService.deleteSupplier(req.params.id);
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    next(error);
  }
};
