import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  sku: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: String,
  unit: { type: String, default: 'pcs' }, // pcs, kg, box, etc.
  binLocation: String, // e.g., Shelf A-1
  minStockLevel: { type: Number, default: 5 }, // Reorder Point
  maxStockLevel: { type: Number, default: 0 }, // Maximum Capacity (0 = unlimited)
  price: { type: Number, required: true },
  image: { type: String, default: '' },
  costPrice: { type: Number, default: 0 }, // For valuation
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  supplierId: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier' },
  warehouseStock: [{
    warehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse' },
    quantity: { type: Number, default: 0 }
  }],
  quantity: { type: Number, default: 0 }, // Global count
  status: { type: String, enum: ['active', 'discontinued'], default: 'active' },
  batchNumber: String,
  expiryDate: Date,
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model('Product', productSchema);
