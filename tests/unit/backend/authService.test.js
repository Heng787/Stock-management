import { loginUser } from '../../../server/services/authService';
import User from '../../../server/models/User';
import jwt from 'jsonwebtoken';

// Mock dependencies
jest.mock('../../../server/models/User');
jest.mock('jsonwebtoken');

describe('AuthService - loginUser', () => {
  const mockUser = {
    _id: 'user123',
    name: 'Admin',
    email: 'admin@example.com',
    role: 'admin',
    matchPassword: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return user data and token on successful login', async () => {
    User.findOne.mockReturnValue({
      select: jest.fn().mockResolvedValue(mockUser)
    });
    mockUser.matchPassword.mockResolvedValue(true);
    jwt.sign.mockReturnValue('mock-token');

    const result = await loginUser('admin@example.com', 'admin123');

    expect(result.token).toBe('mock-token');
    expect(result.email).toBe('admin@example.com');
    expect(User.findOne).toHaveBeenCalledWith({ email: 'admin@example.com' });
  });

  it('should throw error on invalid password', async () => {
    User.findOne.mockReturnValue({
      select: jest.fn().mockResolvedValue(mockUser)
    });
    mockUser.matchPassword.mockResolvedValue(false);

    await expect(loginUser('admin@example.com', 'wrongpass'))
      .rejects.toThrow('Invalid email or password');
  });

  it('should throw error if user not found', async () => {
    User.findOne.mockReturnValue({
      select: jest.fn().mockResolvedValue(null)
    });

    await expect(loginUser('notfound@example.com', 'anypass'))
      .rejects.toThrow('Invalid email or password');
  });
});
