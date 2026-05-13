import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createTransaction } from '../../../server/services/transactionService';
import Transaction from '../../../server/models/Transaction';
import Customer from '../../../server/models/Customer';

vi.mock('../../../server/models/Transaction');
vi.mock('../../../server/models/Product', () => ({
  default: {
    findOne: vi.fn(() => ({ _id: 'prod1', name: 'Test Product', warehouseStock: [{ warehouse: 'w1', quantity: 100 }] })),
    findOneAndUpdate: vi.fn(() => ({ warehouseStock: [{ warehouse: 'w1', quantity: 90 }] }))
  }
}));
vi.mock('../../../server/models/Customer');
vi.mock('../../../server/services/notificationService');

describe('Transaction Service', () => {
  const mockUserId = 'user123';
  const mockSaleData = {
    type: 'SALE',
    entityId: 'cust1',
    warehouseId: 'w1',
    total: 40000, // 40,000 KHR
    currency: 'KHR',
    exchangeRate: 4000, // 1 USD = 4000 KHR
    items: [{ product: 'prod1', quantity: 1, price: 40000 }]
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should normalize total to USD when updating customer totalSpent', async () => {
    Transaction.create.mockResolvedValue({ _id: 'trans1', ...mockSaleData });
    
    await createTransaction(mockSaleData, mockUserId);

    // 40,000 / 4000 = 10 USD
    expect(Customer.findByIdAndUpdate).toHaveBeenCalledWith(
      'cust1',
      expect.objectContaining({
        $inc: expect.objectContaining({ totalSpent: 10 })
      })
    );
  });

  it('should store the original total and currency in the transaction', async () => {
    await createTransaction(mockSaleData, mockUserId);
    
    expect(Transaction.create).toHaveBeenCalledWith(
      expect.objectContaining({
        total: 40000,
        currency: 'KHR',
        exchangeRate: 4000
      })
    );
  });
});
