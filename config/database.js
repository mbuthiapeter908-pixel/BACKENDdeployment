import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    // Get MongoDB URI from environment with fallback
    const mongoURI = process.env.MONGODB_URI;
    
    console.log('🔧 Environment check:');
    console.log('🔧 MONGODB_URI present:', !!mongoURI);
    console.log('🔧 NODE_ENV:', process.env.NODE_ENV);
    
    if (!mongoURI) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    // Hide password in logs for security
    const safeURI = mongoURI.replace(/:[^:@]+@/, ':****@');
    console.log(`🔧 Connecting to: ${safeURI}`);

    const conn = await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);
    
    return conn;
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    console.error('❌ Please check your MONGODB_URI environment variable');
    process.exit(1);
  }
};

export default connectDB;