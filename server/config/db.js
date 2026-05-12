import process from 'node:process';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async () => {
  try {
    console.log(`\x1b[33m[MongoDB]\x1b[0m Attempting to connect to: ${process.env.MONGODB_URI}`);
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`\x1b[32m[MongoDB]\x1b[0m Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`\x1b[31m[MongoDB Error]\x1b[0m ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
