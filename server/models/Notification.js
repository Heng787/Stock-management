import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['LOW_STOCK', 'SALE', 'STAFF', 'SYSTEM']
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  isRead: {
    type: Boolean,
    default: false
  },
  link: {
    type: String // Optional link to the relevant page (e.g., /inventory, /history)
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('Notification', notificationSchema);
