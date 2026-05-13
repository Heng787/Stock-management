/**
 * Centralized formatting utilities for the Stock Management system.
 */

export const formatCurrency = (val, currency = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD'
  }).format(val || 0);
};

export const formatDate = (dateString, options = {}) => {
  if (!dateString) return 'N/A';
  
  const defaultOptions = {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    ...options
  };
  
  return new Date(dateString).toLocaleDateString('en-US', defaultOptions);
};

export const formatID = (id) => {
  if (!id) return 'N/A';
  return `#${id.slice(-6).toUpperCase()}`;
};

export const getCurrencySymbol = (currency = 'USD') => {
  try {
    return (0).toLocaleString('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).replace(/\d/g, '').trim();
  } catch (e) {
    return '$';
  }
};

export const convertFromUSD = (amount, rate = 1) => {
  return (amount || 0) * (rate || 1);
};

export const getCurrentRateText = () => {
  return 'Base Currency: USD';
};

// Alias for backward compatibility during refactor
export const formatPrice = formatCurrency;

export const resolveApiUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  
  const baseUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
};
