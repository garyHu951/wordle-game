const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  roomCode: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  wordLength: {
    type: Number,
    required: true
  },
  players: [{
    socketId: String,
    score: { type: Number, default: 0 },
    round: { type: Number, default: 1 }
  }],
  currentWord: String,
  gameState: {
    type: String,
    enum: ['waiting', 'playing', 'finished'],
    default: 'waiting'
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 3600 // 自動刪除 1 小時後的房間記錄
  }
});

module.exports = mongoose.model('Room', roomSchema);