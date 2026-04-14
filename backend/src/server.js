// server.js (CommonJS)

// --- Imports ---
const dotenv = require('dotenv');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const compression = require('compression');
const path = require('path');

// Custom modules
const { general } = require('./middleware/rateLimiter.js');
const { errorHandler } = require('./middleware/errorHandler.js');
const logger = require('./utils/logger.js');

// Your route modules
const authRoutes = require('./routes/auth.js');
const requestRoutes = require('./routes/requests.js');
const paymentRoutes = require('./routes/payments.js');
const appealRoutes = require('./routes/appeals.js');
const adminRoutesOld = require('./routes/admin.js');
const masterRoutes = require('./routes/master.js');
const notificationRoutes = require('./routes/notifications.js');

// New admin routes you created
const adminRoutes = require('./routes/adminRoutes.js');

// --- Setup dotenv ---
dotenv.config();

// --- App setup ---
const app = express();
app.set('trust proxy', 1);

// Security & utilities
app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  })
);
app.use(compression());
app.use(
  morgan('combined', {
    stream: { write: msg => logger.info(msg.trim()) },
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(general);

// Static uploads
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Routes (old ones + new admin stub)
app.use('/api/auth', authRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/appeals', appealRoutes);
// app.use('/api/admin', adminRoutesOld);
app.use('/api/master', masterRoutes);
app.use('/api/notifications', notificationRoutes);

// Mount your new admin routes (can replace the old one later)
app.use('/api/admin', require('./routes/adminRoutes'));

// Health check
app.get('/api/health', (req, res) =>
  res.json({
    status: 'ok',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  })
);

// 404
app.use((req, res) =>
  res.status(404).json({ success: false, message: 'Route not found.' })
);

// Error handler
app.use(errorHandler);

// Start server (local)
const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  logger.info(`RTI Portal API running on port ${PORT} [${process.env.NODE_ENV}]`)
);

// Export for testing or other uses
module.exports = app;