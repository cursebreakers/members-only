// mongo.js - Database controller

const mongoose = require('mongoose');

const uri = process.env.MONGODB_URI;

const clientOptions = { serverApi: { version: '1', strict: true, deprecationErrors: true } };

async function connectDB() {

  try {
    // Connect to the MongoDB database
    await mongoose.connect(uri, clientOptions);

    // Log the database name and collections
    const dbName = mongoose.connection.name;
    const collections = await mongoose.connection.db.collections();
    const collectionNames = collections.map(collection => collection.collectionName);

    console.log("Connected to MongoDB database:", dbName);
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
    throw error; // Rethrow the error to handle it in the caller
  }
}

module.exports = { connectDB };