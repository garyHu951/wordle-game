import React, { useState, useEffect } from 'react';
import { AlertCircle, RotateCcw, Server, Wifi, WifiOff } from 'lucide-react';

const API_URL = 'http://localhost:3001/api';

const WordleGame = () => {
  const [gameId, setGameId] = useState(null);
  const [guesses, setGuesses] = useState([]);
  const [currentGuess, setCurrentGuess] = useState('');
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [message, setMessage] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [serverConnected, setServerConnected] = useState(false);
  const [remainingGuesses, setRemainingGuesses] = useState(6);

  // Check server connection
  useEffect(() => {
    checkServerHealth();
  }, []);

  // Initialize game
  useEffect(() => {
    if (serverConnected) {
      startNewGame();
    }
  }, [serverConnected]);

  const checkServerHealth = async () => {
    try {
      const response = await fetch(`${API_URL}/health`);
      const data = await response.json();
      if (data.status === 'ok') {
        setServerConnected(true);
        setMessage('✅ Connected to server');
        setTimeout(() => setMessage(''), 2000);
      }
    } catch (error) {
      setServerConnected(false);
      setMessage('❌ Cannot connect to server, please ensure backend is running');
    }
  };

  const startNewGame = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/game/new`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      
      if (data.success) {
        setGameId(data.gameId);
        setGuesses([]);
        setCurrentGuess('');
        setGameOver(false);
        setWon(false);
        setMessage('');
        setAnswer('');
        setRemainingGuesses(6);
      } else {
        setMessage('Game creation failed: ' + data.error);
      }
    } catch (error) {
      setMessage('❌ Cannot connect to server');
      setServerConnected(false);
    }
    setLoading(false);
  };

  const handleKeyPress = async (key) => {
    if (gameOver || loading || !serverConnected) return;

    if (key === 'ENTER') {
      if (currentGuess.length !== 5) {
        setMessage('Word must be 5 letters');
        setTimeout(() => setMessage(''), 2000);
        return;
      }

      setLoading(true);
      try {
        const response = await fetch(`${API_URL}/game/${gameId}/guess`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ guess: currentGuess }),
        });
        
        const data = await response.json();
        
        if (data.success) {
          setGuesses(data.guesses);
          setRemainingGuesses(data.remainingGuesses);
          
          if (data.won) {
            setWon(true);
            setGameOver(true);
            setMessage('🎉 ' + data.message);
          } else if (data.gameOver) {
            setGameOver(true);
            setAnswer(data.answer);
            setMessage(data.message);
          }
          
          setCurrentGuess('');
        } else {
          setMessage(data.error);
          setTimeout(() => setMessage(''), 2000);
        }
      } catch (error) {
        setMessage('Submit failed, please check network connection');
        setServerConnected(false);
      }
      setLoading(false);
    } else if (key === 'BACKSPACE') {
      setCurrentGuess(prev => prev.slice(0, -1));
    } else if (currentGuess.length < 5 && /^[A-Z]$/.test(key)) {
      setCurrentGuess(prev => prev + key);
    }
  };

  const keys = [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'BACKSPACE']
  ];

  const getKeyColor = (key) => {
    let status = 'bg-gray-300';
    guesses.forEach(guess => {
      guess.word.split('').forEach((letter, i) => {
        if (letter === key) {
          if (guess.result[i] === 'correct') status = 'bg-green-500 text-white';
          else if (guess.result[i] === 'present' && status !== 'bg-green-500 text-white') 
            status = 'bg-yellow-500 text-white';
          else if (guess.result[i] === 'absent' && status === 'bg-gray-300') 
            status = 'bg-gray-500 text-white';
        }
      });
    });
    return status;
  };

  const renderGrid = () => {
    const rows = [];
    for (let i = 0; i < 6; i++) {
      const guess = guesses[i];
      const isCurrent = i === guesses.length && !gameOver;
      
      rows.push(
        <div key={i} className="flex gap-1 justify-center">
          {[...Array(5)].map((_, j) => {
            let letter = '';
            let bgColor = 'bg-white border-2 border-gray-300';
            
            if (guess) {
              letter = guess.word[j];
              if (guess.result[j] === 'correct') bgColor = 'bg-green-500 text-white border-green-500';
              else if (guess.result[j] === 'present') bgColor = 'bg-yellow-500 text-white border-yellow-500';
              else bgColor = 'bg-gray-400 text-white border-gray-400';
            } else if (isCurrent && currentGuess[j]) {
              letter = currentGuess[j];
              bgColor = 'bg-white border-2 border-gray-500';
            }
            
            return (
              <div
                key={j}
                className={`w-14 h-14 flex items-center justify-center text-2xl font-bold ${bgColor} transition-all duration-300`}
              >
                {letter}
              </div>
            );
          })}
        </div>
      );
    }
    return rows;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col items-center justify-center p-4">
      <div className="max-w-lg w-full bg-white rounded-2xl shadow-2xl p-8">
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">🎮 WORDLE</h1>
          <p className="text-gray-600">Guess the 5-letter English word</p>
          <div className={`mt-2 flex items-center justify-center gap-2 text-xs ${
            serverConnected ? 'text-green-600' : 'text-red-600'
          }`}>
            {serverConnected ? <Wifi size={14} /> : <WifiOff size={14} />}
            <span>{serverConnected ? 'Backend Connected' : 'Backend Disconnected'}</span>
          </div>
          {gameId && (
            <div className="mt-1 text-xs text-gray-500">
              Game ID: {gameId.slice(0, 20)}...
            </div>
          )}
        </div>

        {!serverConnected && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800 mb-2">
              ⚠️ Cannot connect to backend server
            </p>
            <p className="text-xs text-red-600 mb-2">
              Please ensure backend server is running at http://localhost:3001
            </p>
            <button
              onClick={checkServerHealth}
              className="text-xs bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
            >
              Reconnect
            </button>
          </div>
        )}

        {message && (
          <div className={`mb-4 p-3 rounded-lg text-center font-medium ${
            won ? 'bg-green-100 text-green-800' : 
            message.includes('❌') ? 'bg-red-100 text-red-800' :
            'bg-yellow-100 text-yellow-800'
          }`}>
            {message}
          </div>
        )}

        {loading && (
          <div className="mb-4 text-center text-gray-500">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
            <p className="text-xs mt-2">Processing...</p>
          </div>
        )}

        <div className="mb-4 flex justify-between text-sm text-gray-600">
          <span>Guessed: {guesses.length}/6</span>
          <span>Remaining: {remainingGuesses}</span>
        </div>

        <div className="mb-6 space-y-1">
          {renderGrid()}
        </div>

        <div className="space-y-2 mb-4">
          {keys.map((row, i) => (
            <div key={i} className="flex gap-1 justify-center">
              {row.map(key => (
                <button
                  key={key}
                  onClick={() => handleKeyPress(key)}
                  disabled={loading || !serverConnected}
                  className={`${
                    key === 'ENTER' || key === 'BACKSPACE' 
                      ? 'px-3 text-xs' 
                      : 'w-10'
                  } h-12 rounded font-bold ${getKeyColor(key)} hover:opacity-80 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {key === 'BACKSPACE' ? '←' : key}
                </button>
              ))}
            </div>
          ))}
        </div>

        <button
          onClick={startNewGame}
          disabled={loading || !serverConnected}
          className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RotateCcw size={20} />
          New Game
        </button>

        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-bold text-gray-700 mb-2 flex items-center gap-2">
            <AlertCircle size={18} />
            Game Rules
          </h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>🟩 <strong>Green</strong>: Correct letter in correct position</li>
            <li>🟨 <strong>Yellow</strong>: Correct letter in wrong position</li>
            <li>⬜ <strong>Gray</strong>: Letter not in the answer</li>
            <li>🎯 You have 6 chances to guess the correct answer</li>
          </ul>
        </div>

        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-xs text-blue-800">
            <strong>🔧 Tech Stack:</strong><br/>
            <Server className="inline" size={12} /> Backend: Node.js + Express (Port 3001)<br/>
            ⚛️ Frontend: React + Tailwind CSS<br/>
            🔗 API: RESTful Architecture
          </p>
        </div>
      </div>
    </div>
  );
};

export default WordleGame;