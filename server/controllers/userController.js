import User from '../models/User.js';
import { logActivity } from '../services/auditService.js';

export const getUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-password');
    res.json({ success: true, data: users });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

export const createUser = async (req, res) => {
  try {
    const { name, email, password, role, dob, contact } = req.body;
    
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ error: 'User already exists' });

    // Use default password if not provided
    const finalPassword = password || 'Staff123!';

    const user = await User.create({ 
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
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { name, email, role, status, dob, contact } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) return res.status(404).json({ error: 'User not found' });

    user.name = name || user.name;
    user.email = email || user.email;
    user.role = role || user.role;
    user.status = status || user.status;
    user.dob = dob || user.dob;
    user.contact = contact || user.contact;

    const updatedUser = await user.save();
    
    await logActivity('UPDATE', 'USERS', { name, email, role, status }, req.user._id);

    res.json({
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
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    await User.deleteOne({ _id: req.params.id });
    
    await logActivity('DELETE', 'USERS', { name: user.name, email: user.email }, req.user._id);

    res.json({ success: true, message: 'User deleted' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
