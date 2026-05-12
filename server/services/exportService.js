// server/services/exportService.js
import Product from '../models/Product.js';
import Customer from '../models/Customer.js';
import Transaction from '../models/Transaction.js';

export const generateCSV = async (resource) => {
  switch (resource) {
    case 'products': {
      const data = await Product.find().lean();
      const headers = ['SKU', 'Name', 'Quantity', 'Price', 'Category'];
      return { headers, rows: data.map(p => [p.sku, p.name, p.quantity, p.price, p.categoryId]) };
    }
    case 'customers': {
      const data = await Customer.find().lean();
      const headers = ['Name', 'Email', 'Phone', 'Total Spent'];
      return { headers, rows: data.map(c => [c.name, c.email, c.phone, c.totalSpent]) };
    }
    case 'transactions': {
      const data = await Transaction.find().lean();
      const headers = ['ID', 'Type', 'Status', 'Total', 'Date'];
      return { headers, rows: data.map(t => [t._id, t.type, t.status, t.total, t.createdAt]) };
    }
    default:
      throw new Error('Invalid resource type');
  }
};

import fs from 'fs';
import path from 'path';
import Settings from '../models/Settings.js';
import Category from '../models/Category.js';
import Supplier from '../models/Supplier.js';

export const createJSONBackup = async () => {
  const backupDir = 'uploads/backups';
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const backupData = {
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    data: {
      settings: await Settings.find().lean(),
      categories: await Category.find().lean(),
      suppliers: await Supplier.find().lean(),
      products: await Product.find().lean(),
      customers: await Customer.find().lean(),
      transactions: await Transaction.find().lean()
    }
  };

  const filename = `backup-${Date.now()}.json`;
  const filepath = path.join(backupDir, filename);
  
  fs.writeFileSync(filepath, JSON.stringify(backupData, null, 2));
  
  return { filename, filepath, size: Buffer.byteLength(JSON.stringify(backupData)) };
};
