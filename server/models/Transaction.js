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
  currency: { type: String, default: 'USD' },
  exchangeRate: { type: Number, default: 1 },
  discount: { type: Number, default: 0 },
  tax: { type: Number, default: 0 },
  warehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier' },
  expectedDate: Date,
  paymentMethod: { type: String, enum: ['CASH', 'CARD', 'TRANSFER'], default: 'CASH' },
  paymentDetails: {
    cardName: String,
    cardLast4: String,
    transferRef: String,
    transferBank: String
  },
  notes: String,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

export default mongoose.model('Transaction', transactionSchema);
