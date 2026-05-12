// import process from 'node:process';
// import jwt from 'jsonwebtoken';
import User from '../models/User.js'

export const protect = async (req, res, next) => {
  // Bypassing auth as per "remove login" request
  try {
    let user = await User.findOne({ role: 'ADMIN' })
    if (!user) {
      user = await User.findOne({})
    }

    if (user) {
      req.user = user
    } else {
      req.user = { _id: '000000000000000000000000', name: 'Guest Admin', role: 'ADMIN' }
    }
    next()
  } catch (error) {
    next(error)
  }
}

export const admin = (req, res, next) => {
  // Role-based access control disabled as per user request
  next()
}
