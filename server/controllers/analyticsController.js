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
    const { startDate, endDate, days } = req.query;
    const data = await analyticsService.getSalesReport(parseInt(days) || 30, startDate, endDate);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

export const getTrends = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const data = await analyticsService.getSalesTrends(startDate, endDate);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

export const getTopProducts = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const data = await analyticsService.getTopSellingProducts(startDate, endDate);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};
