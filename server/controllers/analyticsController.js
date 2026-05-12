import * as analyticsService from '../services/analyticsService.js';

export const getValuation = async (req, res, next) => {
  try {
    const data = await analyticsService.getInventoryValuation();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

export const getStats = async (req, res, next) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const data = await analyticsService.getSalesReport(days);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

export const getTrends = async (req, res, next) => {
  try {
    const data = await analyticsService.getSalesTrends();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

export const getTopProducts = async (req, res, next) => {
  try {
    const data = await analyticsService.getTopSellingProducts();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};
