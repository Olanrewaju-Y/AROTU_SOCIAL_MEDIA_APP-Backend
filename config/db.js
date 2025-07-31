// config/db.js
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs'); // To read directories for models

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true, // Deprecated in newer Mongoose, but usually harmless
      useUnifiedTopology: true // Deprecated in newer Mongoose, but usually harmless
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);

    // --- CRITICAL PART: Require all your models here ---
    // This ensures Mongoose knows about all your schemas before population attempts.
    const modelsPath = path.join(__dirname, '../models'); // Adjust path as needed
    fs.readdirSync(modelsPath).forEach(file => {
      if (file.endsWith('.js')) {
        require(path.join(modelsPath, file));
      }
    });

  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1); // Exit process with failure
  }
};

module.exports = connectDB;