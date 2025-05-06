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
// app.use(cors({
//   origin: 'https://flourishing-praline-b9bb7b.netlify.app',  // allow frontend origin
//   credentials: true                 // allow cookies if needed
// }));

const corsOptions = {
  origin: 'https://flourishing-praline-b9bb7b.netlify.app',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true
};

app.use(cors(corsOptions));

// Handle preflight requests for all routes
app.options('*', cors(corsOptions));

// Routes
app.use('/api/admin', adminRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/retailers', retailerRoutes);
app.use('/api', transactionRoutes);

// Error handling middleware
app.use(errorHandler);

module.exports = app;