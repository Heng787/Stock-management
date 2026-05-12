import { body, validationResult } from 'express-validator';

export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }
  return res.status(400).json({
    success: false,
    error: errors.array()[0].msg
  });
};

export const productValidation = [
  body('sku').notEmpty().withMessage('SKU is required'),
  body('name').notEmpty().withMessage('Name is required'),
  body('price').isNumeric().withMessage('Price must be a number'),
  body('categoryId').isMongoId().withMessage('Invalid Category ID'),
  validate
];

export const categoryValidation = [
  body('name').notEmpty().withMessage('Category name is required'),
  validate
];

export const supplierValidation = [
  body('name').notEmpty().withMessage('Supplier name is required'),
  body('phone').optional({ checkFalsy: true }).matches(/^[+]*[(]{0,1}[0-9]{1,4}[)]{0,1}[-\s./0-9]*$/).withMessage('Invalid phone number format'),
  body('email').optional({ checkFalsy: true }).isEmail().withMessage('Invalid email format'),
  validate
];

export const customerValidation = [
  body('name').notEmpty().withMessage('Customer name is required'),
  body('phone').optional({ checkFalsy: true }).matches(/^[+]*[(]{0,1}[0-9]{1,4}[)]{0,1}[-\s./0-9]*$/).withMessage('Invalid phone number format'),
  body('email').optional({ checkFalsy: true }).isEmail().withMessage('Invalid email format'),
  validate
];
