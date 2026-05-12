import mongoose from 'mongoose';

const warehouseSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  location: String,
  isDefault: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model('Warehouse', warehouseSchema);
