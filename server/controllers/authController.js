import * as authService from '../services/authService.js';

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public (Should be Admin in production)
export const register = async (req, res, next) => {
  try {
    const { user, token } = await authService.registerUser(req.body);
    
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    });

    res.status(201).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Authenticate a user
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const { user, token } = await authService.loginUser(email, password);
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    });

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Logout user / clear cookie
// @route   POST /api/auth/logout
// @access  Public
export const logout = async (req, res) => {
  res.cookie('token', 'none', {
    httpOnly: true,
    expires: new Date(Date.now() + 10 * 1000)
  });
  res.status(200).json({ success: true, data: {} });
};
