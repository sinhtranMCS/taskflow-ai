const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/taskflow-ai';
    const conn = await mongoose.connect(uri);
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);

    if (process.env.NODE_ENV === 'production') {
      throw error;
    }

    console.log('API routes that need MongoDB will fail until the database is available.');
  }
};

module.exports = connectDB;
