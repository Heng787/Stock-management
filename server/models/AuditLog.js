import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true,
    enum: ['CREATE', 'UPDATE', 'DELETE', 'ADJUST', 'LOGIN']
  },
  module: {
    type: String,
    required: true,
    enum: ['PRODUCTS', 'STOCK', 'USERS', 'WAREHOUSES', 'CUSTOMERS', 'SUPPLIERS', 'AUTH']
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('AuditLog', auditLogSchema);
