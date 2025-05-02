const { check } = require('express-validator');

exports.loginValidation = [
  check('email').isEmail().withMessage('Valid email is required'),
  check('password').notEmpty().withMessage('Password is required')
];

exports.statusValidation = [
  check('status')
    .notEmpty().withMessage('Status is required')
    .isIn(['Approved', 'Rejected']).withMessage('Must be EXACTLY "Approved" or "Rejected" (case-sensitive)')
    .trim(),
  check('adminNotes')
    .optional()
    .isString().withMessage('Notes must be text')
    .isLength({ max: 500 }).withMessage('Notes cannot exceed 500 characters')
];