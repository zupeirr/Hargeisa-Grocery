const express = require('express');
const path = require('path');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL is missing. Backend may fail to connect to the database.');
}
if (!process.env.JWT_SECRET) {
  console.warn('⚠️ JWT_SECRET is missing. Using a default secret for development ONLY.');
  if (process.env.NODE_ENV === 'production') {
    console.error('❌ JWT_SECRET is required in production!');
    process.exit(1);
  }
}

const app = express();
const PORT = process.env.PORT || 3001;

// ─── Security: HTTP Security Headers (XSS, clickjacking, MIME sniffing) ──────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false,
}));

// ─── Performance: Gzip Compression ───────────────────────────────────────────
app.use(compression());

// ─── Rate Limiting ────────────────────────────────────────────────────────────
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts, please try again later.' },
});

app.use('/api/', generalLimiter);
app.use('/api/auth', authLimiter);

// ─── Request Logging ──────────────────────────────────────────────────────────
app.use((req, _res, next) => {
  const ts = new Date().toISOString();
  console.log(`[${ts}] ${req.method} ${req.path}`);
  next();
});

// ─── CORS configuration (FIXED) ────────────────────────────────────────────────
const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://hargeisa-grocery.vercel.app',
  process.env.FRONTEND_URL
].filter(Boolean);

console.log(`🔐 CORS Origins allowed: ${ALLOWED_ORIGINS.join(', ')}`);

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`⚠️  CORS rejected origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
};

const server = http.createServer(app);
const io = new Server(server, {
  cors: corsOptions,
  transports: ['websocket', 'polling'],
  pingInterval: 25000,
  pingTimeout: 60000
});

app.set('io', io);

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));

// Serve uploaded images as static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./src/routes/auth'));
app.use('/api/products', require('./src/routes/products'));
app.use('/api/orders', require('./src/routes/orders'));
app.use('/api/customers', require('./src/routes/customers'));
app.use('/api/dashboard', require('./src/routes/dashboard'));
app.use('/api/settings', require('./src/routes/settings'));
app.use('/api/reviews', require('./src/routes/reviews'));
app.use('/api/coupons', require('./src/routes/coupons'));
app.use('/api/suppliers', require('./src/routes/suppliers'));
app.use('/api/purchase-orders', require('./src/routes/purchaseOrders'));
app.use('/api/upload', require('./src/routes/upload'));
app.use('/api/categories', require('./src/routes/categories'));
app.use('/api/deliveries', require('./src/routes/deliveries'));
app.use('/api/employees', require('./src/routes/employees'));
app.use('/api/expenses', require('./src/routes/expenses'));
app.use('/api/inventory', require('./src/routes/inventory'));
app.use('/api/reports', require('./src/routes/reports'));
app.use('/api/financial', require('./src/routes/financial'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Hargeisa Grocery API is running 🚀',
    security: { helmet: true, rateLimit: true, compression: true, cors: true },
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler
app.use((err, req, res, _next) => {
  console.error(`[ERROR] ${err.message}`);
  const errorResponse = { error: err.message || 'Internal server error' };
  if (process.env.NODE_ENV === 'development') {
    errorResponse.stack = err.stack;
  }
  res.status(err.status || 500).json(errorResponse);
});

io.on('connection', (socket) => {
  console.log(`📡 Socket client connected: ${socket.id}`);
  socket.on('disconnect', () => {
    console.log(`📡 Socket client disconnected: ${socket.id}`);
  });
});

server.listen(PORT, () => {
  console.log(`✅ Backend server running at http://localhost:${PORT}`);
  console.log(`🔒 Security: helmet + rate-limiting enabled`);
  console.log(`⚡ Performance: gzip compression enabled`);
  console.log(`📡 Socket.IO: enabled with CORS`);
});