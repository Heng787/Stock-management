import { describe, it, expect, vi } from 'vitest';
import { createTransaction } from '../../server/services/transactionService';
import Transaction from '../../server/models/Transaction';
import Product from '../../server/models/Product';
import Customer from '../../server/models/Customer';

vi.mock('../../server/models/Transaction');
vi.mock('../../server/models/Product');
vi.mock('../../server/models/Customer');
vi.mock('../../server/services/notificationService');

describe('Sales Integration', () => {
  const mockUserId = 'user123';
  
  it('should complete a multi-currency sale and update stock/customer correctly', async () => {
    // 1. Mock Product
    const mockProduct = {
      _id: 'p1',
      name: 'Phone',
      price: 1000, // $1000
      quantity: 10,
      warehouseStock: [{ warehouse: 'w1', quantity: 10 }]
    };
    Product.findById.mockResolvedValue(mockProduct);
    Product.findOne.mockResolvedValue(mockProduct);
    Product.findOneAndUpdate.mockResolvedValue({
      ...mockProduct,
      quantity: 9,
      warehouseStock: [{ warehouse: 'w1', quantity: 9 }]
    });

    // 2. Sale Data ($1000 Phone paid in KHR at 4000 rate = 4,000,000 KHR)
    const saleData = {
      type: 'SALE',
      entityId: 'c1',
      warehouseId: 'w1',
      total: 4000000,
      currency: 'KHR',
      exchangeRate: 4000,
      items: [{ product: 'p1', quantity: 1, price: 4000000 }]
    };

    Transaction.create.mockResolvedValue({ _id: 't1', ...saleData });

    // 3. Execute
    const result = await createTransaction(saleData, mockUserId);

    // 4. Assertions
    // Stock decreased
    expect(Product.findOneAndUpdate).toHaveBeenCalled();
    
    // Customer spent 1000 USD
    expect(Customer.findByIdAndUpdate).toHaveBeenCalledWith(
      'c1',
      expect.objectContaining({
        $inc: expect.objectContaining({ totalSpent: 1000 })
      })
    );

    // Transaction stored correctly
    expect(result.total).toBe(4000000);
    expect(result.currency).toBe('KHR');
  });
});
