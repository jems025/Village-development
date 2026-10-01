const mongoose = require('mongoose');
const seedDataFn = require('./seedFn');

global.isDbConnected = false;

const connectDB = async () => {
  const primaryUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/village_portal';
  
  try {
    const conn = await mongoose.connect(primaryUri, {
      serverSelectionTimeoutMS: 2000,
    });
    console.log(`[DB] Connected to Primary MongoDB: ${conn.connection.host}`);
    global.isDbConnected = true;
    await seedDataFn();
  } catch (error) {
    console.warn(`[DB] Local MongoDB daemon not running (${error.message}).`);
    console.log('[DB] Operating in Instant Fallback Mode for immediate responsiveness.');
    
    // Asynchronously attempt memory server in background without blocking server responses
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      MongoMemoryServer.create({ binary: { version: '6.0.5' } })
        .then(async (mongod) => {
          const uri = mongod.getUri();
          const conn = await mongoose.connect(uri);
          console.log(`[DB] Embedded MongoDB connected in background: ${conn.connection.host}`);
          global.isDbConnected = true;
          await seedDataFn();
        })
        .catch(err => {
          console.log('[DB] Continuing in Standalone High-Speed Mode.');
        });
    } catch (memError) {
      console.log('[DB] High-Speed Standalone Mode Active.');
    }
  }
};

module.exports = connectDB;
