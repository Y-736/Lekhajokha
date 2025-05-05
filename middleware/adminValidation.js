const { body, param, query } = require('express-validator');

const loginValidation = [
  body('email')
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

const statusValidation = [
  param('id')
    .isInt()
    .withMessage('Invalid retailer ID'),
  body('status')
    .isIn(['Approved', 'Rejected', 'Pending'])
    .withMessage('Invalid status value'),
  body('adminNotes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Notes must be less than 500 characters')
];

const paginationValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1-100')
];

module.exports = {
  loginValidation,
  statusValidation,
  paginationValidation
};