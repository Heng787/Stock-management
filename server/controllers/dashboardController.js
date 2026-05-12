import Product from '../models/Product.js';
import StockMovement from '../models/StockMovement.js';
import Category from '../models/Category.js';

export const getDashboardStats = async (req, res, next) => {
  try {
    const totalProducts = await Product.countDocuments();
    const categoriesCount = await Category.countDocuments();
    
    const products = await Product.find();
    const lowStockCount = products.filter(p => p.quantity <= p.minStockLevel).length;
    const totalValue = products.reduce((acc, p) => acc + (p.price * p.quantity), 0);

    const recentMovements = await StockMovement.find()
      .populate('productId', 'name')
      .populate('userId', 'name')
      .sort({ timestamp: -1 })
      .limit(5);

    res.status(200).json({
      success: true,
      data: {
        totalProducts,
        categoriesCount,
        lowStockCount,
        totalValue,
        recentMovements
      }
    });
  } catch (error) {
    next(error);
  }
};
