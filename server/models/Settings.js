// server/models/Settings.js
import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema({
  business: {
    name: { type: String, default: 'StockFlow Pro' },
    logo: { type: String, default: '' },
    address: { type: String, default: '' },
    phone: { type: String, default: '' },
    email: { type: String, default: '' }
  },
  localization: {
    currency: { type: String, default: 'USD' },
    dateFormat: { type: String, default: 'DD/MM/YYYY' },
    timezone: { type: String, default: 'UTC' }
  },
  inventory: {
    lowStockAlerts: { type: Boolean, default: true },
    skuPrefixEnabled: { type: Boolean, default: true },
    defaultTaxRate: { type: Number, default: 0 }
  },
  security: {
    auditLogRetentionDays: { type: Number, default: 90 },
    roles: { type: Map, of: [String], default: {} }
  },
  ui: {
    theme: { type: String, enum: ['light', 'dark', 'system'], default: 'system' },
    sidebarCollapsed: { type: Boolean, default: false }
  }
}, { timestamps: true });

// Ensure only one settings document exists
settingsSchema.statics.getSingleton = async function() {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

export default mongoose.model('Settings', settingsSchema);
