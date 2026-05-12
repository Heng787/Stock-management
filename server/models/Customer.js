import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: String,
  address: String,
  totalSpent: { type: Number, default: 0 },
  orderCount: { type: Number, default: 0 }
}, { timestamps: true });

export default mongoose.model('Customer', customerSchema);
