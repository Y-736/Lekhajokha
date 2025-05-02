const { validateEmail, validateMobile } = require('./helpers');

const validateRetailerSignup = (data) => {
  const errors = {};
  
  if (!data.name || data.name.trim() === '') {
    errors.name = 'Name is required';
  }
  
  if (!data.email || !validateEmail(data.email)) {
    errors.email = 'Valid email is required';
  }
  
  if (!data.mobile || !validateMobile(data.mobile)) {
    errors.mobile = 'Valid 10-digit mobile number is required';
  }
  
  if (!data.password || data.password.length < 6) {
    errors.password = 'Password must be at least 6 characters';
  }
  
  if (!data.aadhar || data.aadhar.length !== 12) {
    errors.aadhar = 'Valid 12-digit Aadhar number is required';
  }
  
  return {
    errors,
    isValid: Object.keys(errors).length === 0
  };
};

const validateLogin = (data) => {
  const errors = {};
  
  if (!data.email || !validateEmail(data.email)) {
    errors.email = 'Valid email is required';
  }
  
  if (!data.password || data.password.length < 6) {
    errors.password = 'Password must be at least 6 characters';
  }
  
  return {
    errors,
    isValid: Object.keys(errors).length === 0
  };
};

const validateCustomer = (data) => {
  const errors = {};
  
  if (!data.name || data.name.trim() === '') {
    errors.name = 'Name is required';
  }
  
  if (!data.mobile || !validateMobile(data.mobile)) {
    errors.mobile = 'Valid 10-digit mobile number is required';
  }
  
  return {
    errors,
    isValid: Object.keys(errors).length === 0
  };
};

const validateTransaction = (data) => {
  const errors = {};
  
  if (!data.amount || isNaN(data.amount)) {
    errors.amount = 'Valid amount is required';
  }
  
  if (!data.credit_debit || !['credit', 'debit'].includes(data.credit_debit)) {
    errors.credit_debit = 'Transaction type (credit/debit) is required';
  }
  
  if (!data.type || data.type.trim() === '') {
    errors.type = 'Transaction type is required';
  }
  
  return {
    errors,
    isValid: Object.keys(errors).length === 0
  };
};

module.exports = {
  validateRetailerSignup,
  validateLogin,
  validateCustomer,
  validateTransaction
};