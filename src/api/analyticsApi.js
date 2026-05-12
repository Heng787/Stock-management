import client from './client.js';

/**
 * GET /api/analytics/trends
 * @returns {{ labels: string[], salesTrend: number[], stockTrend: number[] }}
 */
export const fetchTrends = () => client.get('/analytics/trends');

/**
 * GET /api/analytics/top-products
 * @returns {Array<{ name: string, quantity: number, sold: number }>}
 */
export const fetchTopProducts = () => client.get('/analytics/top-products');
