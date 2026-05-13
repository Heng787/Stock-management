import { useSettingsStore } from '../stores/settings';

// Rates relative to KHR (1 Unit = X KHR)
export const KHR_RATES = {
  USD: 4012.44,
  EUR: 4710.00,
  GBP: 5432.09,
  CNY: 590.75,
  KHR: 1.00
};

/**
 * Returns the currency symbol based on current settings or override.
 */
export const getCurrencySymbol = (overrideCurrency) => {
  const settings = useSettingsStore();
  const currencyCode = overrideCurrency || settings.config.localization.currency;
  
  const symbols = {
    USD: '$',
    EUR: '€',
    KHR: '៛',
    GBP: '£',
    CNY: '¥'
  };
  
  return symbols[currencyCode] || '$';
};

/**
 * Converts a USD amount to the target currency.
 */
export const convertFromUSD = (usdAmount, targetCurrency) => {
  const amount = Number(usdAmount) || 0;
  if (targetCurrency === 'USD') return amount;
  
  const khrValue = amount * KHR_RATES.USD;
  const targetRate = KHR_RATES[targetCurrency] || KHR_RATES.USD;
  
  return khrValue / targetRate;
};

/**
 * Formats a number with the current currency symbol and exchange rate.
 */
export const formatPrice = (amount, overrideCurrency) => {
  const settings = useSettingsStore();
  const currencyCode = overrideCurrency || settings.config.localization.currency;
  
  const convertedValue = convertFromUSD(amount, currencyCode);
  const symbol = getCurrencySymbol(currencyCode);
  
  return `${symbol}${convertedValue.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
};

/**
 * Returns a string describing the current exchange rate relative to USD.
 */
export const getCurrentRateText = (overrideCurrency) => {
  const settings = useSettingsStore();
  const currencyCode = overrideCurrency || settings.config.localization.currency;
  if (currencyCode === 'USD') return '1 USD = $1.00';
  
  const symbol = getCurrencySymbol(currencyCode);
  const rate = convertFromUSD(1, currencyCode);
  
  return `1 USD = ${symbol}${rate.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
};

/**
 * Resolves a potentially relative URL to a full backend URL.
 */
export const resolveApiUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  
  const baseUrl = import.meta.env.VITE_API_URL.replace('/api', '');
  return `${baseUrl}${path}`;
};
