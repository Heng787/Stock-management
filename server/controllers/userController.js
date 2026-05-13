// d:\Work\Stock Management\server\controllers\userController.js
import * as userService from '../services/userService.js';
import { logActivity } from '../services/auditService.js';

/**
 * @desc    Get all users
 * @route   GET /api/users
 * @access  Admin
 */
export const getUsers = async (req, res, next) => {
  try {
    const users = await userService.getAllUsers();
    res.status(200).json({ success: true, data: users });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new user
 * @route   POST /api/users
 * @access  Admin
 */
export const createUser = async (req, res, next) => {
  try {
    const { name, email, password, role, dob, contact } = req.body;
    
    const userExists = await userService.findUserByEmail(email);
    if (userExists) {
      return res.status(400).json({ success: false, error: 'User already exists' });
    }

    const finalPassword = password || 'Staff123!';

    const user = await userService.createUser({ 
      name, 
      email, 
      password: finalPassword, 
      role: role || 'CLERK', 
      dob, 
      contact 
    });
    
    await logActivity('CREATE', 'USERS', { name, email, role: user.role }, req.user._id);

    res.status(201).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        dob: user.dob,
        contact: user.contact,
        status: user.status
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update a user
 * @route   PUT /api/users/:id
 * @access  Admin
 */
export const updateUser = async (req, res, next) => {
  try {
    const { name, email, role, status, dob, contact } = req.body;
    const user = await userService.getUserById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    user.name = name || user.name;
    user.email = email || user.email;
    user.role = role || user.role;
    user.status = status || user.status;
    user.dob = dob || user.dob;
    user.contact = contact || user.contact;

    const updatedUser = await user.save();
    
    await logActivity('UPDATE', 'USERS', { name, email, role, status }, req.user._id);

    res.status(200).json({
      success: true,
      data: {
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        dob: updatedUser.dob,
        contact: updatedUser.contact,
        status: updatedUser.status
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a user
 * @route   DELETE /api/users/:id
 * @access  Admin
 */
export const deleteUser = async (req, res, next) => {
  try {
    const user = await userService.getUserById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    await userService.deleteUserById(req.params.id);
    
    await logActivity('DELETE', 'USERS', { name: user.name, email: user.email }, req.user._id);

    res.status(200).json({ success: true, message: 'User deleted' });
  } catch (error) {
    next(error);
  }
};
