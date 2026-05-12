import process from 'node:process';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import Category from './models/Category.js';

dotenv.config();

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('[Seed] Connected to MongoDB');

    // 1. Create Default Admin if not exists
    let admin = await User.findOne({ email: 'admin@example.com' });
    if (!admin) {
      admin = await User.create({
        name: 'System Admin',
        email: 'admin@example.com',
        password: 'admin123',
        role: 'admin'
      });
      console.log('[Seed] Default Admin created');
    } else {
      admin.password = 'admin123';
      await admin.save();
      console.log('[Seed] Admin password reset to: admin123');
    }

    // 2. Create Initial Categories
    const categoriesCount = await Category.countDocuments();
    if (categoriesCount === 0) {
      await Category.insertMany([
        { name: 'Electronics', description: 'Gadgets and electronic components' },
        { name: 'Furniture', description: 'Office and home furniture' },
        { name: 'Stationery', description: 'Office supplies and paper' }
      ]);
      console.log('[Seed] Initial categories created');
    }

    console.log('[Seed] Database seeded successfully');
    process.exit();
  } catch (error) {
    console.error(`[Seed Error] ${error.message}`);
    process.exit(1);
  }
};

seedData();
