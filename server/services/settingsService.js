// server/services/settingsService.js
import Settings from '../models/Settings.js';
import Product from '../models/Product.js';
import Warehouse from '../models/Warehouse.js';
import Supplier from '../models/Supplier.js';
import Customer from '../models/Customer.js';
import Transaction from '../models/Transaction.js';
import StockMovement from '../models/StockMovement.js';
import AuditLog from '../models/AuditLog.js';
import User from '../models/User.js';

export const getSettings = async () => {
  return await Settings.getSingleton();
};

export const updateSettings = async (updateData) => {
  const settings = await Settings.getSingleton();
  
  const allowedKeys = ['business', 'localization', 'inventory', 'security', 'ui'];

  // Dynamic merge for nested objects
  Object.keys(updateData).forEach(key => {
    if (!allowedKeys.includes(key)) return;

    if (settings[key] && typeof updateData[key] === 'object' && !Array.isArray(updateData[key])) {
      // Use toObject() to avoid Mongoose internal properties interference
      const current = settings[key].toObject ? settings[key].toObject() : settings[key];
      settings[key] = { ...current, ...updateData[key] };
    } else {
      settings[key] = updateData[key];
    }
  });

  return await settings.save();
};

export const handleLogoUpload = async (file) => {
  if (!file) throw new Error('No file uploaded');
  const logoUrl = `/uploads/logos/${file.filename}`;
  await updateSettings({ business: { logo: logoUrl } });
  return logoUrl;
};

export const clearDatabase = async (currentAdminId) => {
  try {
    // REQUIREMENT: Wipe everything EXCEPT Category and current Admin
    console.log(`Starting system wipe. Preserving Admin: ${currentAdminId}`);
    
    await Promise.all([
      Product.deleteMany({}),
      Warehouse.deleteMany({}),
      Supplier.deleteMany({}),
      Customer.deleteMany({}),
      Transaction.deleteMany({}),
      StockMovement.deleteMany({}),
      AuditLog.deleteMany({}),
      User.deleteMany({ _id: { $ne: currentAdminId } })
    ]);
    
    return { success: true, message: 'Database wiped successfully (Categories and Admin preserved)' };
  } catch (err) {
    console.error('DATABASE WIPE FAILED:', err);
    throw new Error(`Wipe failed: ${err.message}`, { cause: err });
  }
};
