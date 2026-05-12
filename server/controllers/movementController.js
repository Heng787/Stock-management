import * as movementService from '../services/movementService.js';

export const addMovement = async (req, res, next) => {
  try {
    const movementData = {
      ...req.body,
      userId: req.user._id
    };
    const movement = await movementService.createMovement(movementData);
    res.status(201).json({ success: true, data: movement });
  } catch (error) {
    next(error);
  }
};

export const getHistory = async (req, res, next) => {
  try {
    const history = await movementService.getProductHistory(req.params.productId);
    res.status(200).json({ success: true, data: history });
  } catch (error) {
    next(error);
  }
};
