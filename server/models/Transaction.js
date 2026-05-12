import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
  type: { type: String, enum: ['SALE', 'PURCHASE'], required: true },
  status: { type: String, enum: ['PENDING', 'COMPLETED', 'CANCELLED'], default: 'COMPLETED' },
  items: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    name: String,
    quantity: { type: Number, required: true },
    price: { type: Number, required: true }
  }],
  total: { type: Number, required: true },
  warehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier' },
  expectedDate: Date,
  paymentMethod: { type: String, enum: ['CASH', 'CARD', 'TRANSFER'], default: 'CASH' },
  notes: String,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

export default mongoose.model('Transaction', transactionSchema);
