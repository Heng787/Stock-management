import * as reportService from '../services/reportService.js';

export const getDashboardSummary = async (req, res) => {
  try {
    const summary = await reportService.getSummary();
    res.json(summary);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getInventoryMovers = async (req, res) => {
  try {
    const movers = await reportService.getMovers();
    res.json(movers);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
