import React, { useState, useEffect, useRef } from 'react';
import { RotateCcw, Wifi, WifiOff, User, Swords, ArrowLeft, Trophy, Info, Clock, Users, Hash } from 'lucide-react';
import io from 'socket.io-client';

const API_URL = 'http://localhost:3001/api';
const SOCKET_URL = 'http://localhost:3001';

// ==========================================
// 1. 首頁選單 (Home Page)
// ==========================================
const HomePage = ({ onSelectMode }) => {
  return (
    <div className="min-h-screen bg-[#F5F5DC] flex flex-col items-center justify-center p-4">
      <div className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-xl max-w-md w-full text-center animate-fade-in-up">
        <h1 className="text-5xl font-extrabold text-black mb-8">WORDLE+</h1>
        <div className="space-y-4">
          <button onClick={() => onSelectMode('single')} className="group w-full p-4 bg-white border-2 border-gray-200 hover:border-black rounded-xl shadow-sm hover:shadow-md transition-all duration-300 flex items-center gap-4 text-left relative overflow-hidden">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-700 group-hover:bg-black group-hover:text-white transition-colors"><User size={24} /></div>
            <div><h3 className="text-lg font-bold text-gray-800">Single Player</h3><p className="text-sm text-gray-500">Classic Mode (4-7 Letters)</p></div>
          </button>
          <button onClick={() => onSelectMode('competitive')} className="group w-full p-4 bg-white border-2 border-gray-200 hover:border-black rounded-xl shadow-sm hover:shadow-md transition-all duration-300 flex items-center gap-4 text-left">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-700 group-hover:bg-black group-hover:text-white transition-colors"><Swords size={24} /></div>
            <div><h3 className="text-lg font-bold text-gray-800">Competitive</h3><p className="text-sm text-gray-500">Create or Join Room</p></div>
          </button>
        </div>
        <div className="mt-8 pt-6 border-t border-gray-200 text-xs text-gray-400">v2.1.0 • Fixed Multiplayer Input</div>
      </div>
    </div>
  );
};

// ==========================================
// 2. 單人模式 (Single Player)
// ==========================================
const SinglePlayerGame = ({ onBack }) => {
  const [gameId, setGameId] = useState(null);
  const [wordLength, setWordLength] = useState(5);
  const [maxGuesses, setMaxGuesses] = useState(6);
  const [guesses, setGuesses] = useState([]);
  const [currentGuess, setCurrentGuess] = useState('');
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [serverConnected, setServerConnected] = useState(false);
  const [remainingGuesses, setRemainingGuesses] = useState(6);

  useEffect(() => { checkServerHealth(); }, []);
  useEffect(() => { if (serverConnected) startNewGame(wordLength); }, [serverConnected, wordLength]);

  const checkServerHealth = async () => {
    try { const res = await fetch(`${API_URL}/health`); if (res.ok) setServerConnected(true); } catch { setServerConnected(false); setMessage('❌ Cannot connect to server'); }
  };
  const startNewGame = async (length = 5) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/game/new`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ length }), });
      const data = await response.json();
      if (data.success) { setGameId(data.gameId); setGuesses([]); setCurrentGuess(''); setGameOver(false); setWon(false); setMessage(''); setMaxGuesses(data.maxGuesses); setRemainingGuesses(data.maxGuesses); } else { setMessage(data.error); }
    } catch (e) { setMessage('❌ Connection Failed'); }
    setLoading(false);
  };
  const handleKeyPress = async (key) => {
    if (gameOver || loading || !serverConnected) return;
    if (key === 'ENTER') {
      if (currentGuess.length !== wordLength) { setMessage(`Must be ${wordLength} letters`); setTimeout(() => setMessage(''), 1500); return; }
      setLoading(true);
      try {
        const response = await fetch(`${API_URL}/game/${gameId}/guess`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ guess: currentGuess }), });
        const data = await response.json();
        if (data.success) { setGuesses(data.guesses); setRemainingGuesses(data.remainingGuesses); setCurrentGuess(''); if (data.won) { setWon(true); setGameOver(true); setMessage('🎉 ' + data.message); } else if (data.gameOver) { setGameOver(true); setMessage(data.message); } } else { setMessage(data.error); setTimeout(() => setMessage(''), 2000); }
      } catch (e) { setMessage('Submission failed'); }
      setLoading(false);
    } else if (key === 'BACKSPACE') { setCurrentGuess(prev => prev.slice(0, -1)); } else if (currentGuess.length < wordLength && /^[A-Z]$/.test(key)) { setCurrentGuess(prev => prev + key); }
  };
  useEffect(() => {
    const handleKeyDown = (e) => { if (e.key === 'Enter') handleKeyPress('ENTER'); else if (e.key === 'Backspace') handleKeyPress('BACKSPACE'); else if (/^[a-zA-Z]$/.test(e.key)) handleKeyPress(e.key.toUpperCase()); };
    window.addEventListener('keydown', handleKeyDown); return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentGuess, gameOver, loading]);

  const getKeyColor = (key) => {
    let status = 'bg-gray-200';
    guesses.forEach(guess => { guess.word.split('').forEach((letter, i) => { if (letter === key) { if (guess.result[i] === 'correct') status = 'bg-green-500 text-white'; else if (guess.result[i] === 'present' && status !== 'bg-green-500 text-white') status = 'bg-yellow-500 text-white'; else if (guess.result[i] === 'absent' && status === 'bg-gray-200') status = 'bg-gray-400 text-white'; } }); });
    return status;
  };
  const renderGrid = () => {
    const rows = [];
    for (let i = 0; i < maxGuesses; i++) {
      const guess = guesses[i]; const isCurrent = i === guesses.length && !gameOver;
      rows.push(
        <div key={i} className="flex gap-1 justify-center">
          {[...Array(wordLength)].map((_, j) => {
            let letter = '', style = 'bg-white border-2 border-gray-300';
            if (guess) { letter = guess.word[j]; if (guess.result[j] === 'correct') style = 'bg-green-500 text-white border-green-500'; else if (guess.result[j] === 'present') style = 'bg-yellow-500 text-white border-yellow-500'; else style = 'bg-gray-400 text-white border-gray-400'; } else if (isCurrent && currentGuess[j]) { letter = currentGuess[j]; style = 'bg-white border-2 border-gray-500 animate-pulse'; }
            return <div key={j} className={`${wordLength >= 7 ? 'w-10 h-10 text-lg' : 'w-14 h-14 text-2xl'} flex items-center justify-center font-bold ${style} rounded transition-all`}>{letter}</div>;
          })}
        </div>
      );
    }
    return rows;
  };
  const keys = [['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'], ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'], ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'BACKSPACE']];

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center py-8 px-4">
      <div className="max-w-xl w-full bg-white p-6 rounded-xl shadow-lg relative">
        <button onClick={onBack} className="absolute top-6 left-6 p-2 text-gray-400 hover:text-gray-700" title="Back"><ArrowLeft size={24} /></button>
        <header className="flex flex-col items-center mb-6 border-b pb-4"><h1 className="text-3xl font-bold text-gray-800">Single Player</h1></header>
        <div className="flex justify-center gap-2 mb-6">{[4, 5, 6, 7].map(len => (<button key={len} onClick={() => !loading && setWordLength(len)} className={`px-4 py-2 rounded-lg font-bold transition-all text-sm ${wordLength === len ? 'bg-indigo-600 text-white scale-105' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}>{len} Letters</button>))}</div>
        {message && <div className="mb-4 p-3 bg-blue-50 text-blue-700 rounded-lg text-center font-medium animate-bounce">{message}</div>}
        <div className="space-y-2 mb-8 select-none">{renderGrid()}</div>
        <div className="flex flex-col gap-2 w-full">{keys.map((row, i) => (<div key={i} className="flex gap-1 justify-center w-full">{row.map(key => (<button key={key} onClick={() => handleKeyPress(key)} className={`h-14 rounded font-bold text-sm transition-colors flex items-center justify-center ${key === 'ENTER' || key === 'BACKSPACE' ? 'flex-[1.5] text-xs' : 'flex-1'} ${getKeyColor(key)}`}>{key === 'BACKSPACE' ? '⌫' : key}</button>))}</div>))}</div>
        <button onClick={() => startNewGame(wordLength)} className="mt-8 w-full py-3 bg-gray-800 text-white rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-gray-700"><RotateCcw size={20}/> New Game</button>
      </div>
    </div>
  );
};

// ==========================================
// 3. 競賽模式 (Competitive Mode)
// ==========================================
const CompetitiveMode = ({ onBack }) => {
  const [socket, setSocket] = useState(null);
  const [viewState, setViewState] = useState('lobby');
  
  // Lobby 
  const [roomCode, setRoomCode] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [selectedLength, setSelectedLength] = useState(5);
  const [errorMessage, setErrorMessage] = useState('');

  // 遊戲階段
  const [wordLength, setWordLength] = useState(5);
  const [currentRound, setCurrentRound] = useState(1);
  const [timeLeft, setTimeLeft] = useState(0);
  const [potentialPoints, setPotentialPoints] = useState(5);
  const [players, setPlayers] = useState({});
  const [hints, setHints] = useState([]);
  const [isTieBreaker, setIsTieBreaker] = useState(false);
  const [winnerInfo, setWinnerInfo] = useState(null);

  //得分版
  const [guesses, setGuesses] = useState([]);
  const [currentGuess, setCurrentGuess] = useState('');
  const [roundWinner, setRoundWinner] = useState(null);

  useEffect(() => {
    const newSocket = io(SOCKET_URL);
    setSocket(newSocket);

    newSocket.on('room_created', ({ roomCode }) => {
      setRoomCode(roomCode);
      setViewState('waiting');
    });

    newSocket.on('game_start', ({ wordLength, players }) => {
      setWordLength(wordLength);
      setPlayers(players);
      setViewState('playing');
      setHints([]);
    });

    newSocket.on('new_round', (data) => {
      setCurrentRound(data.round);
      setTimeLeft(data.timeLeft);
      setPotentialPoints(data.potentialPoints);
      setIsTieBreaker(data.isTieBreaker);
      setHints([]);
      setGuesses([]);
      setCurrentGuess('');
      setRoundWinner(null);
      setErrorMessage('');
    });

    newSocket.on('timer_update', (time) => {
      setTimeLeft(time);
    });

    newSocket.on('hint_reveal', (hint) => {
      setHints(prev => [...prev, hint]);
      setPotentialPoints(hint.currentPoints);
    });


    newSocket.on('guess_result', ({ guess, result }) => {
      setGuesses(prev => [...prev, { word: guess, result }]);
      setCurrentGuess(''); // 清空輸入框
    });

    newSocket.on('guess_error', (msg) => {
      setErrorMessage(msg);
      setTimeout(() => setErrorMessage(''), 1500);
    });

    newSocket.on('round_winner', (data) => {
      setPlayers(data.updatedPlayers);
      if (data.winnerId === newSocket.id) {
        setRoundWinner('me');
        setErrorMessage('🎉 You won this round! (+ ' + data.points + ' pts)');
      } else {
        setRoundWinner('opponent');
        setErrorMessage(`Opponent won! The word was ${data.word}`);
      }
    });

    newSocket.on('game_over', (data) => {
      setPlayers(data.players);
      setWinnerInfo(data.winner);
      setViewState('gameOver');
    });
    
    newSocket.on('error_message', (msg) => {
        setErrorMessage(msg);
    });

    return () => newSocket.close();
  }, []);

  const createRoom = () => {
    if (!socket) return;
    socket.emit('create_room', { wordLength: selectedLength });
  };

  const joinRoom = () => {
    if (!socket || joinCode.length !== 6) {
        setErrorMessage('Please enter a 6-character code');
        return;
    }
    setRoomCode(joinCode);
    socket.emit('join_room', { roomCode: joinCode });
  };

  const handleKeyPress = (key) => {
    if (viewState !== 'playing' || roundWinner) return;

    if (key === 'ENTER') {
      if (currentGuess.length !== wordLength) return;
      socket.emit('submit_guess_competitive', { roomCode, guess: currentGuess });
    } else if (key === 'BACKSPACE') {
      setCurrentGuess(prev => prev.slice(0, -1));
    } else if (currentGuess.length < wordLength && /^[A-Z]$/.test(key)) {
      setCurrentGuess(prev => prev + key);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (viewState !== 'playing') return;
      if (e.key === 'Enter') handleKeyPress('ENTER');
      else if (e.key === 'Backspace') handleKeyPress('BACKSPACE');
      else if (/^[a-zA-Z]$/.test(e.key)) handleKeyPress(e.key.toUpperCase());
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewState, currentGuess, roundWinner, roomCode]);

  // UI 
  if (viewState === 'lobby') {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-gray-800 p-8 rounded-2xl shadow-2xl relative">
          <button onClick={onBack} className="absolute top-4 left-4 p-2 text-gray-400 hover:text-white"><ArrowLeft size={24}/></button>
          <h2 className="text-3xl font-bold mb-8 text-center flex items-center justify-center gap-2"><Trophy className="text-orange-500"/> Competitive</h2>
          
          <div className="mb-8 p-4 bg-gray-700/50 rounded-xl border border-gray-600">
            <h3 className="font-bold mb-3 flex items-center gap-2 text-indigo-400"><User size={18}/> Create Room</h3>
            <div className="flex gap-2 mb-4 justify-center">
                {[4, 5, 6, 7].map(len => (
                    <button key={len} onClick={() => setSelectedLength(len)} className={`px-3 py-1 rounded border ${selectedLength === len ? 'bg-indigo-600 border-indigo-500' : 'bg-gray-800 border-gray-600 text-gray-400'}`}>{len}</button>
                ))}
            </div>
            <button onClick={createRoom} className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-bold transition-colors">Create & Wait</button>
          </div>

          <div className="p-4 bg-gray-700/50 rounded-xl border border-gray-600">
            <h3 className="font-bold mb-3 flex items-center gap-2 text-green-400"><Users size={18}/> Join Room</h3>
            <div className="flex gap-2">
                <input 
                    type="text" 
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value)}
                    placeholder="Enter Room Code"
                    className="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-center tracking-widest uppercase"
                    maxLength={6}
                />
                <button onClick={joinRoom} className="px-6 bg-green-600 hover:bg-green-700 rounded-lg font-bold">Join</button>
            </div>
          </div>
          {errorMessage && <p className="text-red-400 text-center mt-4">{errorMessage}</p>}
        </div>
      </div>
    );
  }

  if (viewState === 'waiting') {
    return (
        <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4">
            <div className="bg-gray-800 p-10 rounded-2xl text-center animate-pulse">
                <Hash size={48} className="mx-auto text-indigo-400 mb-4"/>
                <h2 className="text-2xl font-bold mb-2">Room Code</h2>
                <div className="text-5xl font-mono bg-gray-900 px-6 py-4 rounded-xl tracking-widest text-indigo-300 border border-indigo-500/50 select-all mb-6">
                    {roomCode}
                </div>
                <p className="text-gray-400 flex items-center justify-center gap-2">
                    <Users className="animate-bounce"/> Waiting for opponent...
                </p>
            </div>
        </div>
    );
  }

  if (viewState === 'playing') {
      const myScore = players[socket.id]?.score || 0;
      const opponentId = Object.keys(players).find(id => id !== socket.id);
      const opponentScore = players[opponentId]?.score || 0;

      const renderCompGrid = () => {
        const rows = [];
        for (let i = 0; i < 6; i++) {
            const guess = guesses[i];
            const isCurrent = i === guesses.length;
            
            rows.push(
                <div key={i} className="flex gap-1 justify-center">
                    {[...Array(wordLength)].map((_, j) => {
                        let letter = '';
                        let style = 'bg-gray-800 border-2 border-gray-600'; 
                        
                        const isHint = hints.find(h => h.index === j);

                        if (guess) {
                            letter = guess.word[j];
                            if (guess.result[j] === 'correct') style = 'bg-green-600 border-green-600 text-white';
                            else if (guess.result[j] === 'present') style = 'bg-yellow-600 border-yellow-600 text-white';
                            else style = 'bg-gray-600 border-gray-600 text-gray-300';
                        } else if (isCurrent && currentGuess[j]) {
                            letter = currentGuess[j];
                            style = 'bg-gray-700 border-2 border-gray-400 animate-pulse text-white';
                        } else if (!guess && isHint) {
                            letter = isHint.char;
                            style = 'bg-indigo-900/50 border-2 border-indigo-500 text-indigo-300';
                        }
                        return <div key={j} className={style + " w-12 h-12 flex items-center justify-center text-xl font-bold rounded"}>{letter}</div>;
                    })}
                </div>
            );
        }
        return rows;
      };
      
      const keys = [['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'], ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'], ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'BACKSPACE']];

      return (
        <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center py-4 px-2">
            <div className="w-full max-w-xl flex justify-between items-end mb-4 bg-gray-800 p-4 rounded-xl border border-gray-700">
                <div className="text-center">
                    <p className="text-xs text-gray-400">YOU</p>
                    <p className="text-3xl font-bold text-green-400">{myScore}</p>
                </div>
                <div className="flex flex-col items-center">
                    <div className="text-xs text-orange-400 mb-1 font-bold">
                        {isTieBreaker ? "SUDDEN DEATH" : `ROUND ${currentRound} / 5`}
                    </div>
                    <div className="text-4xl font-mono font-bold text-white bg-gray-900 px-4 py-1 rounded border border-gray-600 flex items-center gap-2">
                        <Clock size={24}/> {timeLeft}s
                    </div>
                    <p className="text-xs text-indigo-300 mt-1">Win: +{potentialPoints} pts</p>
                </div>
                <div className="text-center">
                    <p className="text-xs text-gray-400">OPPONENT</p>
                    <p className="text-3xl font-bold text-red-400">{opponentScore}</p>
                </div>
            </div>

            {errorMessage && <div className={`mb-4 px-4 py-2 rounded font-bold animate-bounce ${errorMessage.includes('won') ? 'bg-green-600 text-white' : 'bg-red-500 text-white'}`}>{errorMessage}</div>}

            <div className="space-y-2 mb-6 select-none relative">
                {roundWinner && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80 z-10 backdrop-blur-sm rounded-lg">
                        <div className="text-2xl font-bold">Waiting for next round...</div>
                    </div>
                )}
                {renderCompGrid()}
            </div>

            <div className="flex flex-col gap-2 w-full max-w-xl">
                {keys.map((row, i) => (
                    <div key={i} className="flex gap-1 justify-center w-full">
                        {row.map(key => (
                            <button
                                key={key}
                                onClick={() => handleKeyPress(key)}
                                className={`h-12 rounded font-bold text-sm flex items-center justify-center transition-colors bg-gray-700 hover:bg-gray-600 text-white border-b-2 border-gray-800 active:border-0 active:translate-y-1 ${key === 'ENTER' || key === 'BACKSPACE' ? 'flex-[1.5] text-xs' : 'flex-1'}`}
                            >
                                {key === 'BACKSPACE' ? '⌫' : key}
                            </button>
                        ))}
                    </div>
                ))}
            </div>
        </div>
      );
  }

  if (viewState === 'gameOver') {
      const myId = socket.id;
      const isWinner = winnerInfo === myId;
      const myScore = players[myId]?.score;
      const opponentId = Object.keys(players).find(id => id !== myId);
      const opponentScore = players[opponentId]?.score;

      return (
          <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4">
              <div className="max-w-md w-full bg-gray-800 p-8 rounded-2xl shadow-2xl text-center">
                  {isWinner ? (
                      <div className="text-green-500 mb-4"><Trophy size={64} className="mx-auto"/></div>
                  ) : (
                      <div className="text-gray-500 mb-4"><Swords size={64} className="mx-auto"/></div>
                  )}
                  <h2 className="text-4xl font-bold mb-2">{isWinner ? 'VICTORY!' : (winnerInfo === 'draw' ? 'DRAW!' : 'DEFEAT')}</h2>
                  <p className="text-gray-400 mb-8">Good Game!</p>
                  
                  <div className="flex justify-center gap-8 text-2xl font-bold mb-8">
                      <div className="text-center">
                          <div className="text-sm text-gray-500">YOU</div>
                          <div className={isWinner ? 'text-green-400' : 'text-gray-300'}>{myScore}</div>
                      </div>
                      <div className="text-gray-600">-</div>
                      <div className="text-center">
                          <div className="text-sm text-gray-500">OPPONENT</div>
                          <div className={!isWinner && winnerInfo !== 'draw' ? 'text-green-400' : 'text-gray-300'}>{opponentScore}</div>
                      </div>
                  </div>

                  <button onClick={() => window.location.reload()} className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-bold">Back to Menu</button>
              </div>
          </div>
      );
  }

  return null;
};

// ==========================================
// 4. Main App
// ==========================================
const App = () => {
  const [view, setView] = useState('home'); 
  return (
    <>
      {view === 'home' && <HomePage onSelectMode={(mode) => setView(mode)} />}
      {view === 'single' && <SinglePlayerGame onBack={() => setView('home')} />}
      {view === 'competitive' && <CompetitiveMode onBack={() => setView('home')} />}
    </>
  );
};

export default App;