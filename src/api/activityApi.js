import client from './client.js';

/**
 * GET /api/activity?limit=N
 * @returns {Array<{ id, type, user, action, target, timestamp }>}
 */
export const fetchActivity = (limit = 10) =>
  client.get('/activity', { params: { limit } });
