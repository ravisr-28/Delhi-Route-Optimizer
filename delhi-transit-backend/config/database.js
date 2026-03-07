const mongoose = require('mongoose');
const dns = require('dns');

// Fix for querySrv ECONNREFUSED issues with MongoDB Atlas
dns.setServers(['8.8.8.8', '1.1.1.1']);

const connectDatabase = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/delhi-transit';
    
    await mongoose.connect(mongoUri);
    
    console.log('✅ MongoDB connected successfully');
    
    mongoose.connection.on('error', (error) => {
      console.error('❌ MongoDB connection error:', error);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  MongoDB disconnected');
    });
    
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    throw error;
  }
};

module.exports = connectDatabase;