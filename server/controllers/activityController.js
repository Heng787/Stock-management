import { getRecentActivity } from '../services/activityService.js';

export const getActivity = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const data = await getRecentActivity(limit);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};
