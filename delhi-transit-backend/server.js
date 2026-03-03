const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { connectDatabase } = require('./config/database');
const passport = require('./config/passport');
const authRoutes = require('./routes/auth');
const oauthRoutes = require('./routes/oauth');
const routeRoutes = require('./routes/routes');
const transitRoutes = require('./routes/transit');
const { errorHandler } = require('./middleware/errorHandler');
const stationRoutes = require('./routes/stations');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:5173"
}));

app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'Delhi Transit API is running!' });
});

app.use('/api/auth', authRoutes);
app.use('/api/oauth', oauthRoutes);
app.use('/api/routes', routeRoutes);
app.use('/api/transit', transitRoutes);
app.use('/api/stations', stationRoutes);


// Error handling
app.use(errorHandler);

// Database connection and server start
const startServer = async () => {
  try {
    await connectDatabase();
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();