const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
// 新增：引入 http 和 socket.io
const http = require('http');
const { Server } = require("socket.io");
const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Game = require('./models/Game');
const Room = require('./models/Room');

const app = express();

// Environment variables
const PORT = process.env.PORT || 3001;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/wordle-game';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const NODE_ENV = process.env.NODE_ENV || 'development';

// MongoDB connection (optional)
if (MONGODB_URI && MONGODB_URI.includes('mongodb') && NODE_ENV === 'production') {
  mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000, // 5 second timeout
    socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
  })
  .then(() => {
    console.log('✅ Connected to MongoDB');
  })
  .catch((error) => {
    console.error('❌ MongoDB connection error:', error);
    console.log('⚠️  Continuing with in-memory storage');
  });
} else {
  console.log('⚠️  Using in-memory storage (no MongoDB configured)');
}

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = NODE_ENV === 'production' 
      ? [
          FRONTEND_URL,
          'https://garyHu951.github.io',
          'https://garyHu951.github.io/wordle-game',
          'https://garyhu951.github.io',
          'https://garyhu951.github.io/wordle-game'
        ]
      : ['http://localhost:5173', 'http://127.0.0.1:5173'];
    
    // Check if origin is allowed
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
};

app.use(cors(corsOptions));
app.use(bodyParser.json());

// 建立 HTTP Server 並綁定 Socket.IO
const server = http.createServer(app);
const io = new Server(server, {
  cors: corsOptions
});

// ==========================================
// 1. 單字庫邏輯
// ==========================================
const WORD_LISTS = {};
const SUPPORTED_LENGTHS = [4, 5, 6, 7];

console.log('正在載入單字庫...');
SUPPORTED_LENGTHS.forEach(len => {
  const fileName = `${len}-letter-words.json`;
  const filePath = path.join(__dirname, fileName);
  try {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const words = JSON.parse(fileContent).map(w => w.toUpperCase().trim());
    WORD_LISTS[len] = words;
    console.log(`✅ 成功載入 ${len} 個字母的單字：共 ${words.length} 個`);
  } catch (error) {
    WORD_LISTS[len] = len === 5 ? ['ERROR'] : ['TEST']; 
  }
});

const VALID_WORDS = new Set();
Object.values(WORD_LISTS).forEach(list => list.forEach(word => VALID_WORDS.add(word)));

// 單人模式的遊戲狀態 (保留原本功能)
const singlePlayerGames = new Map();

// ==========================================
// 2. 對戰模式邏輯 (Socket.IO)
// ==========================================
const rooms = {}; // 儲存所有對戰房間狀態

function generateRoomCode() {
  // 產生 6 碼小寫英文+數字
  return Math.random().toString(36).substring(2, 8);
}

function getRandomWord(length) {
  const list = WORD_LISTS[length];
  return list[Math.floor(Math.random() * list.length)];
}

// 啟動一個新回合（為特定玩家）
function startRoundForPlayer(roomCode, playerId) {
  const room = rooms[roomCode];
  if (!room) return;

  // 檢查是否有人達到30分
  const playerIds = Object.keys(room.players);
  const scores = playerIds.map(id => room.players[id].score);
  if (Math.max(...scores) >= 30) {
    const winnerId = playerIds[scores.indexOf(Math.max(...scores))];
    io.to(roomCode).emit('game_over', { players: room.players, winner: winnerId });
    return;
  }

  // 初始化房間數據結構
  if (!room.roundWords) {
    room.roundWords = {}; // 存儲每個回合號對應的單字
  }
  if (!room.playerGuessCount) {
    room.playerGuessCount = {};
  }
  if (!room.playerRounds) {
    room.playerRounds = {};
  }

  // 重置該玩家的猜測次數
  room.playerGuessCount[playerId] = 0;
  
  // 增加該玩家的回合數
  if (!room.playerRounds[playerId]) {
    room.playerRounds[playerId] = 1;
  } else {
    room.playerRounds[playerId]++;
  }

  const currentRound = room.playerRounds[playerId];
  
  // 為這個回合號生成單字（如果還沒有的話）
  if (!room.roundWords[currentRound]) {
    room.roundWords[currentRound] = getRandomWord(room.wordLength);
  }
  
  // 獲取對手ID
  const opponentId = playerIds.find(id => id !== playerId);
  
  // 向房間內所有玩家廣播回合數更新
  playerIds.forEach(id => {
    const isCurrentPlayer = id === playerId;
    io.to(id).emit('new_round', {
      myRound: room.playerRounds[id] || 1,
      opponentRound: room.playerRounds[isCurrentPlayer ? opponentId : playerId] || 1,
      potentialPoints: 5
    });
  });

  console.log(`[Room ${roomCode}] Player ${playerId} Round ${currentRound}. Word: ${room.roundWords[currentRound]}`);
}


io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // 1. 創建房間
  socket.on('create_room', ({ wordLength }) => {
    const roomCode = generateRoomCode();
    rooms[roomCode] = {
      id: roomCode,
      wordLength: parseInt(wordLength),
      players: {},
      roundWords: {}, // 存儲每個回合號對應的單字
      playerRounds: {},
      playerGuessCount: {},
      status: 'waiting'
    };
    
    // 加入玩家 (房主)
    rooms[roomCode].players[socket.id] = { id: socket.id, score: 0, name: 'Player 1' };
    socket.join(roomCode);
    
    socket.emit('room_created', { roomCode });
    console.log(`Room created: ${roomCode}, Length: ${wordLength}`);
  });

  // 2. 加入房間
  socket.on('join_room', ({ roomCode }) => {
    const room = rooms[roomCode];
    if (!room) {
      socket.emit('error_message', '房間不存在');
      return;
    }
    if (Object.keys(room.players).length >= 2) {
      socket.emit('error_message', '房間已滿');
      return;
    }

    // 加入玩家 (挑戰者)
    rooms[roomCode].players[socket.id] = { id: socket.id, score: 0, name: 'Player 2' };
    socket.join(roomCode);
    
    // 房間滿了，開始遊戲
    room.status = 'playing';
    io.to(roomCode).emit('game_start', { 
      wordLength: room.wordLength,
      players: room.players
    });

    // 延遲3秒後為每個玩家開始第一回合
    setTimeout(() => {
      const playerIds = Object.keys(room.players);
      // 初始化每個玩家的回合數為1
      playerIds.forEach(playerId => {
        if (!room.playerRounds) room.playerRounds = {};
        room.playerRounds[playerId] = 1;
        if (!room.playerGuessCount) room.playerGuessCount = {};
        room.playerGuessCount[playerId] = 0;
      });
      
      // 為第一回合生成單字
      if (!room.roundWords) room.roundWords = {};
      if (!room.roundWords[1]) {
        room.roundWords[1] = getRandomWord(room.wordLength);
      }
      
      // 向所有玩家廣播第一回合開始
      playerIds.forEach(playerId => {
        const opponentId = playerIds.find(id => id !== playerId);
        io.to(playerId).emit('new_round', {
          myRound: 1,
          opponentRound: 1,
          potentialPoints: 5
        });
      });
      
      console.log(`[Room ${roomCode}] Game started. Both players at Round 1. Word: ${room.roundWords[1]}`);
    }, 3000);
  });

  // 3. 提交答案 (對戰模式)
  socket.on('submit_guess_competitive', ({ roomCode, guess }) => {
    const room = rooms[roomCode];
    if (!room || room.status !== 'playing') return;

    const normalizedGuess = guess.toUpperCase().trim();
    
    // 檢查長度
    if (normalizedGuess.length !== room.wordLength) return;
    if (!VALID_WORDS.has(normalizedGuess)) {
       socket.emit('guess_error', 'Word not in dictionary');
       return;
    }

    // 初始化玩家猜測次數
    if (!room.playerGuessCount) {
      room.playerGuessCount = {};
    }
    if (!room.playerGuessCount[socket.id]) {
      room.playerGuessCount[socket.id] = 0;
    }

    // 獲取該玩家當前回合的單字
    const currentRound = room.playerRounds[socket.id] || 1;
    const roundWord = room.roundWords[currentRound];
    
    if (!roundWord) {
      socket.emit('guess_error', '回合尚未開始');
      return;
    }
    
    const result = checkGuess(normalizedGuess, roundWord);
    const isCorrect = normalizedGuess === roundWord;
    
    // 增加猜測次數
    room.playerGuessCount[socket.id]++;
    const guessCount = room.playerGuessCount[socket.id];
    const gameOver = guessCount >= 6 && !isCorrect;
    
    // 回傳結果給該玩家
    socket.emit('guess_result', {
      guess: normalizedGuess,
      result: result,
      isCorrect: isCorrect,
      gameOver: gameOver
    });
    
    if (isCorrect) {
      // 答對了！
      const points = 5; // 固定5分
      room.players[socket.id].score += points;
      
      // 通知對手
      const opponentId = Object.keys(room.players).find(id => id !== socket.id);
      if (opponentId) {
        io.to(opponentId).emit('opponent_won_round', {
          opponentName: 'Opponent',
          word: roundWord,
          points: points
        });
      }
      
      // 廣播分數更新
      io.to(roomCode).emit('round_winner', {
        winnerId: socket.id,
        word: roundWord,
        points: points,
        updatedPlayers: room.players
      });
      
      // 1秒後為該玩家開始下一回合
      setTimeout(() => startRoundForPlayer(roomCode, socket.id), 1000);

    } else if (gameOver) {
      // 6次都沒猜到，1秒後開始下一回合
      setTimeout(() => startRoundForPlayer(roomCode, socket.id), 1000);
    }
  });

  // 4. 獲取當前答案
  socket.on('get_current_answer', ({ roomCode }) => {
    const room = rooms[roomCode];
    if (room && room.players[socket.id]) {
      const currentRound = room.playerRounds[socket.id] || 1;
      const roundWord = room.roundWords[currentRound];
      
      if (roundWord) {
        socket.emit('current_answer', {
          answer: roundWord
        });
      } else {
        socket.emit('error_message', 'Cannot get answer: Round not started');
      }
    } else {
      socket.emit('error_message', 'Cannot get answer: Room not found or not in game');
    }
  });

  // 5. 跳過回合
  socket.on('skip_round', ({ roomCode }) => {
    const room = rooms[roomCode];
    if (!room) return;
    
    // 獲取當前回合的答案
    const currentRound = room.playerRounds[socket.id] || 1;
    const currentAnswer = room.roundWords[currentRound];
    
    // 向房間內所有玩家廣播答案
    if (currentAnswer) {
      io.to(roomCode).emit('round_skipped_answer', {
        answer: currentAnswer,
        round: currentRound,
        playerName: `Player ${socket.id === Object.keys(room.players)[0] ? '1' : '2'}`
      });
    }
    
    // 1.5秒後為該玩家開始下一回合
    setTimeout(() => {
      startRoundForPlayer(roomCode, socket.id);
    }, 1500);
  });

  // 6. 暫停遊戲
  socket.on('pause_game', ({ roomCode }) => {
    const room = rooms[roomCode];
    if (!room) return;
    
    // 直接暫停遊戲，不需要雙方同意
    room.isPaused = true;
    
    // 通知房間內所有玩家遊戲已暫停
    const playerIds = Object.keys(room.players);
    const pausingPlayerName = `Player ${socket.id === playerIds[0] ? '1' : '2'}`;
    
    io.to(roomCode).emit('game_paused', {
      message: `Game paused by ${pausingPlayerName}`,
      pausedBy: pausingPlayerName
    });
  });

  // 7. 繼續遊戲
  socket.on('resume_game', ({ roomCode }) => {
    const room = rooms[roomCode];
    if (!room) return;
    
    // 任何玩家都可以直接恢復遊戲
    // 3秒倒計時後繼續
    let countdown = 3;
    io.to(roomCode).emit('resume_countdown', { countdown });
    
    const countdownInterval = setInterval(() => {
      countdown--;
      if (countdown > 0) {
        io.to(roomCode).emit('resume_countdown', { countdown });
      } else {
        clearInterval(countdownInterval);
        room.isPaused = false;
        io.to(roomCode).emit('game_resumed', {
          message: 'Game resumed!'
        });
      }
    }, 1000);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    
    // 找到玩家所在的房間並通知其他玩家
    for (const roomCode in rooms) {
      const room = rooms[roomCode];
      if (room.players[socket.id]) {
        delete room.players[socket.id];
        
        // 通知其他玩家
        socket.to(roomCode).emit('player_left', {
          message: 'Opponent disconnected. Returning to lobby...'
        });
        
        // 清理房間
        if (Object.keys(room.players).length === 0) {
          delete rooms[roomCode];
        }
        break;
      }
    }
  });
});

// 單人模式的 API 保持不變 (為了不讓 server.js 太長，這裡省略 checkGuess 等函式宣告，
// 請確保你把剛剛 checkGuess, generateGameId, VALID_WORDS 等邏輯都包含在內)
// 注意：上面的代碼已經包含了 VALID_WORDS 的生成。
// 這裡補充 checkGuess (給單人與多人共用)
function checkGuess(guess, answer) {
    const result = [];
    const answerArray = answer.split('');
    const guessArray = guess.split('');
    const used = new Array(answer.length).fill(false);
    guessArray.forEach((letter, i) => {
      if (letter === answerArray[i]) { result[i] = 'correct'; used[i] = true; }
    });
    guessArray.forEach((letter, i) => {
      if (result[i]) return;
      const foundIndex = answerArray.findIndex((l, idx) => l === letter && !used[idx]);
      if (foundIndex !== -1) { result[i] = 'present'; used[foundIndex] = true; } 
      else { result[i] = 'absent'; }
    });
    return result;
}

// ... (請保留原本單人模式的 app.post('/api/game/new') 等 API 路由，不要刪除) ...
// 為了版面整潔，我這裡只寫出 Socket.IO 和 Server 啟動部分，
// 請務必把原本單人模式的 API 貼回這裡 (放在 io.on('connection') 區塊之後，server.listen 之前)

// 單人模式 API 區塊 (簡化版示意，請使用你原本的完整代碼)
// ----------------------------------------------------
function generateGameId() { return 'game_' + Date.now(); } // 單人用
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        environment: NODE_ENV,
        mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
    });
});

// Root path for Render health check
app.get('/', (req, res) => {
    res.json({ 
        message: 'Wordle Game Backend API',
        status: 'running',
        version: '1.0.1', // Updated version to trigger deployment
        timestamp: new Date().toISOString(),
        cors: 'Updated for GitHub Pages',
        endpoints: {
            health: '/api/health',
            words: '/api/words/:length',
            game: '/api/game/new'
        }
    });
});

// 新增：單字表API
app.get('/api/words/:length', (req, res) => {
    try {
        const length = parseInt(req.params.length);
        if (!SUPPORTED_LENGTHS.includes(length)) {
            return res.status(400).json({ success: false, error: 'Invalid word length' });
        }
        
        const words = WORD_LISTS[length] || [];
        res.json({ success: true, words: words }); // 返回所有單字
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to fetch words' });
    }
});

app.post('/api/game/new', (req, res) => {
    // ... 貼上你原本單人模式的 create game 邏輯 ...
    // 注意：要用到上面的 WORD_LISTS
    try {
        let length = parseInt(req.body.length) || 5;
        if (!SUPPORTED_LENGTHS.includes(length)) length = 5;
        const maxGuesses = 6; // Always 6 guesses regardless of word length
        const gameId = generateGameId();
        const list = WORD_LISTS[length];
        const answer = list[Math.floor(Math.random() * list.length)];
        const gameData = { id: gameId, answer, wordLength: length, guesses: [], gameOver: false, won: false, createdAt: new Date(), maxGuesses: maxGuesses };
        singlePlayerGames.set(gameId, gameData); // 改名為 singlePlayerGames 避免衝突
        res.json({ success: true, gameId, wordLength: length, maxGuesses: maxGuesses });
    } catch(e) { res.status(500).json({error: 'err'}); }
});
app.post('/api/game/:id/guess', (req, res) => {
    // ... 貼上你原本單人模式的 guess 邏輯 ...
    // 請記得把 games.get 改成 singlePlayerGames.get
    try {
        const { id } = req.params; const { guess } = req.body;
        const game = singlePlayerGames.get(id);
        if(!game) return res.status(404).json({error: 'Not found'});
        // ... 邏輯同前 ...
        const normalizedGuess = guess.toUpperCase().trim();
        if (!VALID_WORDS.has(normalizedGuess)) return res.status(400).json({success: false, error: 'Not in word list!'});
        const result = checkGuess(normalizedGuess, game.answer);
        game.guesses.push({word: normalizedGuess, result});
        if(normalizedGuess === game.answer) { 
            game.won = true; 
            game.gameOver = true; 
        } else if(game.guesses.length >= game.maxGuesses) { 
            game.gameOver = true; 
        }
        
        // Prepare response message
        let message = '';
        if (game.won) {
            message = 'You Won!';
        } else if (game.gameOver) {
            message = `Game Over! The word was: ${game.answer}`;
        }
        
        res.json({ 
            success: true, 
            result, 
            guesses: game.guesses, 
            gameOver: game.gameOver, 
            won: game.won, 
            answer: game.gameOver ? game.answer : null, 
            remainingGuesses: game.maxGuesses - game.guesses.length, 
            message: message 
        });
    } catch(e) { res.status(500).json({error: 'err'}); }
});
// ----------------------------------------------------

// 最後啟動 Server (注意是用 server.listen 而不是 app.listen)
server.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${NODE_ENV}`);
  console.log(`🔗 CORS allowed origins: ${corsOptions.origin}`);
}).on('error', (err) => {
  console.error('❌ Server failed to start:', err);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('✅ Process terminated');
  });
});