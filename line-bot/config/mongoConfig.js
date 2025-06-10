const mongoose = require("mongoose");
const logger = require("./logger");

const mongoURI = process.env["MONGODB_URI"];

mongoose
  .connect(mongoURI, {
    serverSelectionTimeoutMS: 5000,
  })
  .then(() => logger.info("MongoDB connected successfully"))
  .catch((err) => logger.error(`MongoDB connection error: ${err.message}`));

module.exports = mongoose;
