const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const errorHandler = require('./middleware/errorHandler');
const env = require('dotenv')
env.config();

// Import routes
const adminRoutes = require('./routes/adminRoutes');
const authRoutes = require('./routes/authRoutes');
const customerRoutes = require('./routes/customerRoutes');
const retailerRoutes = require('./routes/retailerRoutes');
const transactionRoutes = require('./routes/transactionRoutes');

const app = express();

// Middleware
app.use(express.json()); // For parsing application/json
app.use(express.urlencoded({ extended: true })); // For parsing form data
app.use(morgan('dev'));
// Add error handling for JSON parsing
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ 
      success: false,
      message: 'Invalid JSON format in request body' 
    });
  }
  next();
});
app.use(cors({
  origin: 'http://localhost:5173',  // allow frontend origin
  credentials: true                 // allow cookies if needed
}));
// Routes
app.use('/api/admin', adminRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/retailers', retailerRoutes);
app.use('/api', transactionRoutes);

// Error handling middleware
app.use(errorHandler);

module.exports = app;