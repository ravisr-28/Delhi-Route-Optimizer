import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import connectDatabase from './config/database.js';
import passport from './config/passport.js';
import authRoutes from './routes/auth.js';
import oauthRoutes from './routes/oauth.js';
import routeRoutes from './routes/routes.js';
import transitRoutes from './routes/transit.js';
import { errorHandler } from './middleware/errorHandler.js';
import stationRoutes from './routes/stations.js';
import newsletterRoutes from './routes/newsletter.js';

// Fail fast if JWT_SECRET is not set
if (!process.env.JWT_SECRET) {
  console.error('❌ FATAL: JWT_SECRET environment variable is not set. Server cannot start.');
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 3000;

// Trust first proxy (Render/Vercel)
app.set('trust proxy', 1);

// Debug middleware to see all requests
app.use((req, res, next) => {
  console.log(`📍 ${req.method} ${req.path}`);
  next();
});

// CORS configuration
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    process.env.CLIENT_URL,
    'https://route-optimizer-teal.vercel.app'
  ].filter(Boolean),
  credentials: true,
  exposedHeaders: ['Authorization']
}));

// Helmet - configure to allow OAuth redirects
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://apis.google.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://use.fontawesome.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "https://use.fontawesome.com"],
      imgSrc: ["'self'", "data:", "https:", "http:"],
      connectSrc: [
        "'self'",
        "http://localhost:5173",
        "http://localhost:3000",
        process.env.CLIENT_URL,
        process.env.SERVER_URL
      ].filter(Boolean),
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: false,
}));

app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize passport
app.use(passport.initialize());

// Test route to check if server is running
app.get('/api/test', (req, res) => {
  res.json({ message: 'Server is running' });
});

// Routes - OAuth routes first
app.use('/api/oauth', oauthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/routes', routeRoutes);
app.use('/api/transit', transitRoutes);
app.use('/api/stations', stationRoutes);
app.use('/api/newsletter', newsletterRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'Delhi Transit API is running!',
    endpoints: {
      oauth: '/api/oauth/google',
      auth: '/api/auth',
      routes: '/api/routes'
    }
  });
});

// Error handling
app.use(errorHandler);

// Database connection and server start
const startServer = async () => {
  try {
    await connectDatabase();
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔑 OAuth endpoints:`);
      console.log(`   - Google: http://localhost:${PORT}/api/oauth/google`);
      console.log(`   - GitHub: http://localhost:${PORT}/api/oauth/github`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();