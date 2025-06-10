const mongoose = require("../config/mongoConfig");

const userSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  name: String,
  age: String,
  step: { type: Number, default: 1 },
  lastTestDate: Date,
  history: [
    {
      testType: String,
      score: Number,
      date: Date,
      liked: Boolean,
      completed: Boolean,
    },
  ],
  moodLogs: [{ mood: String, note: String, date: Date }],
  currentActivityIndex: { type: Number, default: 0 },
  recommendedActivity: { type: Object, default: null },
  activities: [
    {
      type: { type: String, required: true },
      interactive: { type: Boolean, default: false },
      progress: { type: Number, default: 0 },
      completed: { type: Boolean, default: false },
      liked: Boolean,
      dateStarted: Date,
      dateCompleted: Date,
      rounds: { type: Number, default: 0 },
      goal: { type: Number, default: 0 },
      currentCount: { type: Number, default: 0 },
      maxRounds: { type: Number, default: 0 },
      maxSteps: { type: Number, default: 0 },
      words: [String],
    },
  ],
});

module.exports = mongoose.model("User", userSchema);
