const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema({
  gameId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  answer: {
    type: String,
    required: true
  },
  wordLength: {
    type: Number,
    required: true
  },
  guesses: [{
    word: String,
    result: [String]
  }],
  maxGuesses: {
    type: Number,
    default: 6
  },
  gameOver: {
    type: Boolean,
    default: false
  },
  won: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 86400 // 自動刪除 24 小時後的遊戲記錄
  }
});

module.exports = mongoose.model('Game', gameSchema);
