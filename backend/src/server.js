require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const compression = require('compression');
const path = require('path');

const { general } = require('./middleware/rateLimiter');
const { errorHandler } = require('./middleware/errorHandler');
const logger = require('./utils/logger');

const app = express();
app.set('trust proxy', 1);

// ── Security & Utilities ──────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(compression());
app.use(morgan('combined', { stream: { write: msg => logger.info(msg.trim()) } }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(general);

// ── Static uploads ────────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// ── Routes ────────────────────────────────────────────────────
app.use('/api/auth',          require('./routes/auth'));
app.use('/api/requests',      require('./routes/requests'));
app.use('/api/payments',      require('./routes/payments'));
app.use('/api/appeals',       require('./routes/appeals'));
app.use('/api/admin',         require('./routes/admin'));
app.use('/api/master',        require('./routes/master'));
app.use('/api/notifications', require('./routes/notifications'));

// ── Health check ──────────────────────────────────────────────
app.get('/api/health', (req, res) =>
  res.json({ status: 'ok', version: '1.0.0', timestamp: new Date().toISOString() })
);

// ── 404 ───────────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ success: false, message: 'Route not found.' }));

// ── Error handler ─────────────────────────────────────────────
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => logger.info(`RTI Portal API running on port ${PORT} [${process.env.NODE_ENV}]`));

module.exports = app;
