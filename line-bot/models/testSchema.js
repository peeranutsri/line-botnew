const mongoose = require("../config/mongoConfig");

const testSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  testType: String,
  answers: [Number],
  score: Number,
  isInProgress: { type: Boolean, default: true },
});

module.exports = mongoose.model("Test", testSchema);
