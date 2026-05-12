import process from 'node:process';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const clearDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('[Clear DB] Connected to MongoDB');

    const collections = await mongoose.connection.db.collections();

    for (let collection of collections) {
      await collection.deleteMany({});
      console.log(`[Clear DB] Cleared collection: ${collection.collectionName}`);
    }

    console.log('[Clear DB] Database cleared successfully');
    process.exit();
  } catch (error) {
    console.error(`[Clear DB Error] ${error.message}`);
    process.exit(1);
  }
};

clearDB();
