// const mongoose = require('mongoose');

// const connectDB = async () => {
//   try {
//     await mongoose.connect(process.env.MONGODB_URI);
//     console.log('✅ MongoDB Connected!');
//   } catch (error) {
//     console.log('❌ MongoDB Error:', error);
//     process.exit(1);
//   }
// };

// module.exports = connectDB;




const mongoose = require('mongoose');

// Vercel serverless connections ko reuse/cache karne ke liye
let cached = global.mongoose || { conn: null, promise: null };

const connectDB = async () => {
  if (cached.conn) {
    return cached.conn; // Agar pehle se connected hai toh fast response do
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      maxPoolSize: 10, // Max 10 connections hi banenge
      serverSelectionTimeoutMS: 5000, // 5 sec se zyada wait nahi karega
    };

    cached.promise = mongoose.connect(process.env.MONGODB_URI, opts).then((mongooseInstance) => {
      console.log('✅ MongoDB Connected!');
      return mongooseInstance;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.promise = null; // Error aane par reset karo taaki agli request try kar sake
    console.log('❌ MongoDB Error:', error);
    // process.exit(1) mat use karo Vercel par
  }

  return cached.conn;
};

module.exports = connectDB;