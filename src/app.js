const express = require('express');

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Import routes
const bonusRoutes = require('../core/bonus/routes');
const participantRoutes = require('../core/participants/routes');
const categoryRoutes = require('../core/categories/routes');
const productRoutes = require('../core/products/routes');
const forecastRoutes = require('../core/forecasts/routes');
const tierRuleRoutes = require('../core/tier-rules/routes');
const receiptRoutes = require('../core/receipts/routes');

// Health check
app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        message: 'TopShelf API is running',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// Register routes
app.use('/api/bonuses', bonusRoutes);
app.use('/api/participants', participantRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/forecasts', forecastRoutes);
app.use('/api/tier-rules', tierRuleRoutes);
app.use('/api/receipts', receiptRoutes);

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Route not found',
        path: req.path,
        method: req.method
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
    });
});

module.exports = app;