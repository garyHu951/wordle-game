import React, { useState, useEffect, useRef } from 'react';
import { RotateCcw, Wifi, WifiOff, User, Swords, ArrowLeft, Trophy, Info, Clock, Users, Hash } from 'lucide-react';
import io from 'socket.io-client';

const API_URL = 'http://localhost:3001/api';
const SOCKET_URL = 'http://localhost:3001';

// 添加像素風格CSS
const customStyles = `
  /* 像素字體 */
  @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
  
  * {
    font-family: 'Press Start 2P', cursive !important;
    image-rendering: pixelated;
    image-rendering: -moz-crisp-edges;
    image-rendering: crisp-edges;
  }
  
  /* 像素風格動畫 */
  @keyframes strongImpactBounce {
    0% { transform: scale(1); }
    25% { transform: scale(1.3); }
    50% { transform: scale(1.1); }
    75% { transform: scale(1.2); }
    100% { transform: scale(1); }
  }
  
  @keyframes mediumImpactShake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-4px); }
    50% { transform: translateX(4px); }
    75% { transform: translateX(-2px); }
  }
  
  @keyframes weakImpactPulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.6; }
  }
  
  @keyframes pixelFadeIn {
    0% { opacity: 0; transform: scale(0.8); }
    100% { opacity: 1; transform: scale(1); }
  }
  
  @keyframes pixelBlink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.3; }
  }
  
  .wordle-cell.animate-strong-impact {
    animation: strongImpactBounce 0.6s steps(4) !important;
  }
  
  .wordle-cell.animate-medium-impact {
    animation: mediumImpactShake 0.5s steps(4) !important;
  }
  
  .wordle-cell.animate-weak-impact {
    animation: weakImpactPulse 0.4s steps(2) !important;
  }
  
  /* 像素風格邊框 */
  .pixel-border {
    box-shadow: 
      0 -2px 0 0 currentColor,
      2px 0 0 0 currentColor,
      0 2px 0 0 currentColor,
      -2px 0 0 0 currentColor,
      2px -2px 0 0 currentColor,
      2px 2px 0 0 currentColor,
      -2px 2px 0 0 currentColor,
      -2px -2px 0 0 currentColor;
  }
  
  /* 像素風格按鈕效果 */
  .pixel-button {
    position: relative;
    transition: none !important;
  }
  
  .pixel-button:active {
    transform: translate(2px, 2px);
  }
  
  .pixel-button::before {
    content: '';
    position: absolute;
    top: 4px;
    left: 4px;
    right: -4px;
    bottom: -4px;
    background: rgba(0, 0, 0, 0.3);
    z-index: -1;
  }
`;

// 注入CSS到頁面 - 確保CSS始終存在
const ensureAnimationStyles = () => {
  if (typeof document !== 'undefined') {
    // 先移除舊的樣式（如果存在）
    const existingStyle = document.getElementById('wordle-animations');
    if (existingStyle) {
      existingStyle.remove();
    }
    
    // 創建新的樣式
    const styleSheet = document.createElement('style');
    styleSheet.id = 'wordle-animations';
    styleSheet.textContent = customStyles;
    document.head.appendChild(styleSheet);
  }
};

// 立即執行一次
ensureAnimationStyles();

// ==========================================
// 0. 單字表組件 (Word List Component) - 像素風格
// ==========================================
const WordListSidebar = ({ isOpen, onClose, selectedLength, onLengthChange }) => {
  const [words, setWords] = useState({});
  const [loading, setLoading] = useState(false);

  const fetchWords = async (length) => {
    if (words[length]) return;
    
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/words/${length}`);
      const data = await response.json();
      if (data.success) {
        setWords(prev => ({ ...prev, [length]: data.words }));
      }
    } catch (error) {
      console.error('Failed to fetch words:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (isOpen) {
      fetchWords(selectedLength);
    }
  }, [isOpen, selectedLength]);

  return (
    <div className={`fixed top-0 right-0 h-full w-96 bg-gray-900 pixel-border transform transition-transform duration-500 ease-in-out z-50 ${
      isOpen ? 'translate-x-0' : 'translate-x-full'
    }`} style={{ boxShadow: '-8px 0 0 rgba(0,0,0,0.8)' }}>
      <div className="p-6 h-full flex flex-col text-white">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg text-yellow-400">WORD LIST</h3>
          <button 
            onClick={onClose}
            className="pixel-button p-2 bg-red-600 hover:bg-red-500 pixel-border text-white"
            style={{ boxShadow: '2px 2px 0 rgba(0,0,0,0.6)' }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="flex gap-2 mb-6">
          {[4, 5, 6, 7].map(len => (
            <button
              key={len}
              onClick={() => {
                onLengthChange(len);
                fetchWords(len);
              }}
              className={`pixel-button px-3 py-2 text-xs font-bold transition-none pixel-border ${
                selectedLength === len 
                  ? 'bg-yellow-400 text-gray-900' 
                  : 'bg-gray-700 text-white hover:bg-gray-600'
              }`}
              style={{ boxShadow: '2px 2px 0 rgba(0,0,0,0.6)' }}
            >
              {len}
            </button>
          ))}
        </div>
        
        <div className="flex-1 overflow-y-auto bg-gray-800 p-4 pixel-border" style={{ boxShadow: 'inset 4px 4px 0 rgba(0,0,0,0.5)' }}>
          {loading ? (
            <div className="text-center text-green-400 py-8 animate-pulse text-xs">LOADING...</div>
          ) : words[selectedLength] ? (
            <div className="space-y-4">
              {Array.from({length: 26}, (_, i) => String.fromCharCode(65 + i)).map(letter => {
                const wordsStartingWithLetter = words[selectedLength].filter(word => 
                  word.toUpperCase().startsWith(letter)
                );
                
                if (wordsStartingWithLetter.length === 0) return null;
                
                return (
                  <div key={letter} className="mb-4">
                    <h4 className="text-sm font-bold text-yellow-400 mb-2 sticky top-0 bg-gray-800 py-1 border-b-2 border-yellow-400">
                      {letter} ({wordsStartingWithLetter.length})
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      {wordsStartingWithLetter.map((word, index) => (
                        <div key={index} className="px-2 py-2 bg-gray-700 pixel-border text-center text-xs text-green-400 hover:bg-gray-600 transition-none" style={{ boxShadow: '2px 2px 0 rgba(0,0,0,0.4)' }}>
                          {word}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
              <div className="text-center text-gray-500 text-xs mt-4 py-4 border-t-2 border-gray-700">
                TOTAL: {words[selectedLength].length} WORDS
              </div>
            </div>
          ) : (
            <div className="text-center text-red-400 py-8 text-xs">ERROR: CANNOT LOAD</div>
          )}
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 1. 首頁選單 (Home Page) - 像素風格
// ==========================================
const HomePage = ({ onSelectMode }) => {
  const [showWordList, setShowWordList] = useState(false);
  const [selectedLength, setSelectedLength] = useState(5);

  const handleWordListToggle = () => {
    setShowWordList(true);
  };

  const handleWordListClose = () => {
    setShowWordList(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 via-blue-900 to-indigo-900 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* 像素風格背景點陣 */}
      <div className="absolute inset-0 opacity-10">
        <div className="w-full h-full" style={{
          backgroundImage: `
            radial-gradient(circle at 25% 25%, #fff 2px, transparent 2px),
            radial-gradient(circle at 75% 75%, #fff 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px'
        }}></div>
      </div>
      
      <div className={`transition-transform duration-500 ease-in-out ${showWordList ? '-translate-x-48' : 'translate-x-0'} relative z-10`}>
        <div className="bg-gray-800 p-8 pixel-border text-white max-w-md w-full text-center" style={{
          boxShadow: '8px 8px 0px rgba(0,0,0,0.8)'
        }}>
          {/* 像素風格標題 */}
          <div className="mb-8">
            <h1 className="text-4xl text-yellow-400 mb-2 animate-pulse">WORDLE+</h1>
            <div className="text-xs text-green-400 pixel-blink">PIXEL EDITION</div>
          </div>
          
          <div className="space-y-4">
            {/* 單人模式按鈕 */}
            <button 
              onClick={() => onSelectMode('single')} 
              className="pixel-button w-full p-4 bg-blue-600 hover:bg-blue-500 text-white pixel-border transition-none flex items-center gap-4 text-left text-xs"
              style={{ boxShadow: '4px 4px 0px rgba(0,0,0,0.6)' }}
            >
              <div className="w-8 h-8 bg-yellow-400 pixel-border flex items-center justify-center text-blue-900">
                <User size={16} />
              </div>
              <div>
                <h3 className="text-sm font-bold mb-1">SINGLE PLAYER</h3>
                <p className="text-xs text-blue-200">CLASSIC MODE (4-7 LETTERS)</p>
              </div>
            </button>
            
            {/* 競賽模式按鈕 */}
            <button 
              onClick={() => onSelectMode('competitive')} 
              className="pixel-button w-full p-4 bg-red-600 hover:bg-red-500 text-white pixel-border transition-none flex items-center gap-4 text-left text-xs"
              style={{ boxShadow: '4px 4px 0px rgba(0,0,0,0.6)' }}
            >
              <div className="w-8 h-8 bg-yellow-400 pixel-border flex items-center justify-center text-red-900">
                <Swords size={16} />
              </div>
              <div>
                <h3 className="text-sm font-bold mb-1">COMPETITIVE</h3>
                <p className="text-xs text-red-200">CREATE OR JOIN ROOM</p>
              </div>
            </button>
            
            {/* 單字表按鈕 */}
            <button 
              onClick={handleWordListToggle}
              className="pixel-button w-full p-4 bg-green-600 hover:bg-green-500 text-white pixel-border transition-none flex items-center gap-4 text-left text-xs"
              style={{ boxShadow: '4px 4px 0px rgba(0,0,0,0.6)' }}
            >
              <div className="w-8 h-8 bg-yellow-400 pixel-border flex items-center justify-center text-green-900">
                <Info size={16} />
              </div>
              <div>
                <h3 className="text-sm font-bold mb-1">WORD LIST</h3>
                <p className="text-xs text-green-200">VIEW AVAILABLE WORDS</p>
              </div>
            </button>
          </div>
          
          {/* 像素風格版本信息 */}
          <div className="mt-8 pt-6 border-t-2 border-gray-600 text-xs text-gray-400">
            <div className="flex justify-center items-center gap-2">
              <div className="w-2 h-2 bg-green-400 animate-pulse"></div>
              <span>v2.1.0 • PIXEL EDITION</span>
              <div className="w-2 h-2 bg-green-400 animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
      
      <WordListSidebar 
        isOpen={showWordList}
        onClose={handleWordListClose}
        selectedLength={selectedLength}
        onLengthChange={setSelectedLength}
      />
      
      {/* 背景遮罩 */}
      {showWordList && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 transition-opacity duration-500"
          onClick={handleWordListClose}
        />
      )}
    </div>
  );
};

// ==========================================
// 1.5. 字母狀態追蹤組件 (Letter Status Tracker) - 像素風格
// ==========================================
const LetterStatusTracker = ({ guesses }) => {
  const getLetterStatus = () => {
    const correct = new Set();
    const present = new Set();
    const absent = new Set();

    guesses.forEach(guess => {
      guess.word.split('').forEach((letter, i) => {
        if (guess.result[i] === 'correct') {
          correct.add(letter);
          present.delete(letter);
        } else if (guess.result[i] === 'present' && !correct.has(letter)) {
          present.add(letter);
        } else if (guess.result[i] === 'absent' && !correct.has(letter) && !present.has(letter)) {
          absent.add(letter);
        }
      });
    });

    return { correct: Array.from(correct), present: Array.from(present), absent: Array.from(absent) };
  };

  const { correct, present, absent } = getLetterStatus();

  return (
    <div className="bg-gray-900 p-4 pixel-border w-full max-w-xs text-white" style={{ boxShadow: '4px 4px 0 rgba(0,0,0,0.8)' }}>
      <h3 className="text-yellow-400 font-bold mb-4 text-center text-sm">LETTER STATUS</h3>
      
      {correct.length > 0 && (
        <div className="mb-4">
          <div className="text-green-400 text-xs font-bold mb-2">CORRECT</div>
          <div className="flex flex-wrap gap-2">
            {correct.map(letter => (
              <div key={letter} className="w-8 h-8 bg-green-600 text-white pixel-border flex items-center justify-center text-xs font-bold" style={{ boxShadow: '2px 2px 0 rgba(0,0,0,0.6)' }}>
                {letter}
              </div>
            ))}
          </div>
        </div>
      )}

      {present.length > 0 && (
        <div className="mb-4">
          <div className="text-yellow-400 text-xs font-bold mb-2">WRONG POS</div>
          <div className="flex flex-wrap gap-2">
            {present.map(letter => (
              <div key={letter} className="w-8 h-8 bg-yellow-600 text-white pixel-border flex items-center justify-center text-xs font-bold" style={{ boxShadow: '2px 2px 0 rgba(0,0,0,0.6)' }}>
                {letter}
              </div>
            ))}
          </div>
        </div>
      )}

      {absent.length > 0 && (
        <div className="mb-4">
          <div className="text-gray-400 text-xs font-bold mb-2">NOT FOUND</div>
          <div className="flex flex-wrap gap-2">
            {absent.map(letter => (
              <div key={letter} className="w-8 h-8 bg-gray-600 text-gray-300 pixel-border flex items-center justify-center text-xs font-bold" style={{ boxShadow: '2px 2px 0 rgba(0,0,0,0.6)' }}>
                {letter}
              </div>
            ))}
          </div>
        </div>
      )}

      {correct.length === 0 && present.length === 0 && absent.length === 0 && (
        <div className="text-center text-gray-500 py-8 text-xs">
          START GUESSING
        </div>
      )}
    </div>
  );
};

// ==========================================
// 1.7. 結算彈窗組件 (Result Modal Component) - 像素風格
// ==========================================
const ResultModal = ({ show, type }) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-gray-900 p-8 pixel-border text-center text-white animate-pulse" style={{ boxShadow: '8px 8px 0 rgba(0,0,0,0.8)' }}>
        {type === 'win' ? (
          <>
            <div className="text-4xl mb-4">🏆</div>
            <h2 className="text-xl font-bold text-green-400 mb-2">VICTORY!</h2>
            <p className="text-gray-300 text-xs">NEXT ROUND...</p>
          </>
        ) : (
          <>
            <div className="text-4xl mb-4">💀</div>
            <h2 className="text-xl font-bold text-red-400 mb-2">DEFEAT!</h2>
            <p className="text-gray-300 text-xs">NEXT ROUND...</p>
          </>
        )}
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
    try { const res = await fetch(`${API_URL}/health`); if (res.ok) setServerConnected(true); } catch { setServerConnected(false); setMessage('ERROR: NO SERVER'); }
  };
  const startNewGame = async (length = 5) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/game/new`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ length }), });
      const data = await response.json();
      if (data.success) { setGameId(data.gameId); setGuesses([]); setCurrentGuess(''); setGameOver(false); setWon(false); setMessage(''); setMaxGuesses(data.maxGuesses); setRemainingGuesses(data.maxGuesses); } else { setMessage(data.error); }
    } catch (e) { setMessage('ERROR: CONNECTION FAILED'); }
    setLoading(false);
  };
  const handleKeyPress = async (key) => {
    if (gameOver || loading || !serverConnected) return;
    if (key === 'ENTER') {
      if (currentGuess.length !== wordLength) { setMessage(`NEED ${wordLength} LETTERS`); setTimeout(() => setMessage(''), 1500); return; }
      setLoading(true);
      try {
        const response = await fetch(`${API_URL}/game/${gameId}/guess`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ guess: currentGuess }), });
        const data = await response.json();
        if (data.success) { setGuesses(data.guesses); setRemainingGuesses(data.remainingGuesses); setCurrentGuess(''); if (data.won) { setWon(true); setGameOver(true); setMessage('VICTORY! ' + data.message); } else if (data.gameOver) { setGameOver(true); setMessage(data.message); } } else { setMessage(data.error); setTimeout(() => setMessage(''), 2000); }
      } catch (e) { setMessage('SUBMIT FAILED'); }
      setLoading(false);
    } else if (key === 'BACKSPACE') { setCurrentGuess(prev => prev.slice(0, -1)); } else if (currentGuess.length < wordLength && /^[A-Z]$/.test(key)) { setCurrentGuess(prev => prev + key); }
  };
  useEffect(() => {
    const handleKeyDown = (e) => { if (e.key === 'Enter') handleKeyPress('ENTER'); else if (e.key === 'Backspace') handleKeyPress('BACKSPACE'); else if (/^[a-zA-Z]$/.test(e.key)) handleKeyPress(e.key.toUpperCase()); };
    window.addEventListener('keydown', handleKeyDown); return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentGuess, gameOver, loading]);

  const getKeyColor = (key) => {
    let status = 'bg-gray-600 text-white';
    guesses.forEach(guess => { guess.word.split('').forEach((letter, i) => { if (letter === key) { if (guess.result[i] === 'correct') status = 'bg-green-600 text-white'; else if (guess.result[i] === 'present' && status !== 'bg-green-600 text-white') status = 'bg-yellow-600 text-white'; else if (guess.result[i] === 'absent' && status === 'bg-gray-600 text-white') status = 'bg-gray-800 text-gray-400'; } }); });
    return status;
  };
  
  const renderGrid = () => {
    const rows = [];
    for (let i = 0; i < maxGuesses; i++) {
      const guess = guesses[i]; const isCurrent = i === guesses.length && !gameOver;
      rows.push(
        <div key={i} className="flex gap-1 justify-center">
          {[...Array(wordLength)].map((_, j) => {
            let letter = '', style = 'bg-gray-800 text-white pixel-border';
            if (guess) { 
              letter = guess.word[j]; 
              if (guess.result[j] === 'correct') style = 'bg-green-600 text-white pixel-border'; 
              else if (guess.result[j] === 'present') style = 'bg-yellow-600 text-white pixel-border'; 
              else style = 'bg-gray-600 text-white pixel-border'; 
            } else if (isCurrent && currentGuess[j]) { 
              letter = currentGuess[j]; 
              style = 'bg-blue-600 text-white pixel-border animate-pulse'; 
            }
            return <div key={j} className={`wordle-cell ${wordLength >= 7 ? 'w-10 h-10 text-sm' : 'w-12 h-12 text-lg'} flex items-center justify-center font-bold ${style} transition-none`} style={{ boxShadow: '2px 2px 0 rgba(0,0,0,0.6)' }}>{letter}</div>;
          })}
        </div>
      );
    }
    return rows;
  };
  
  const keys = [['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'], ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'], ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'BACKSPACE']];

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 via-blue-900 to-indigo-900 flex flex-col items-center py-8 px-4">
      <div className="max-w-xl w-full bg-gray-900 p-6 pixel-border text-white relative" style={{ boxShadow: '8px 8px 0 rgba(0,0,0,0.8)' }}>
        <button onClick={onBack} className="pixel-button absolute top-6 left-6 p-2 bg-red-600 hover:bg-red-500 pixel-border" style={{ boxShadow: '2px 2px 0 rgba(0,0,0,0.6)' }} title="Back">
          <ArrowLeft size={16} />
        </button>
        
        <header className="flex flex-col items-center mb-6 border-b-2 border-gray-700 pb-4">
          <h1 className="text-xl font-bold text-yellow-400">SINGLE PLAYER</h1>
        </header>
        
        <div className="flex justify-center gap-2 mb-6">
          {[4, 5, 6, 7].map(len => (
            <button 
              key={len} 
              onClick={() => !loading && setWordLength(len)} 
              className={`pixel-button px-3 py-2 font-bold transition-none text-xs pixel-border ${
                wordLength === len ? 'bg-yellow-400 text-gray-900' : 'bg-gray-700 text-white hover:bg-gray-600'
              }`}
              style={{ boxShadow: '2px 2px 0 rgba(0,0,0,0.6)' }}
            >
              {len}
            </button>
          ))}
        </div>
        
        {message && (
          <div className="mb-4 p-3 bg-blue-600 text-white pixel-border text-center font-bold animate-pulse text-xs" style={{ boxShadow: '2px 2px 0 rgba(0,0,0,0.6)' }}>
            {message}
          </div>
        )}
        
        <div className="space-y-2 mb-8 select-none">{renderGrid()}</div>
        
        <div className="flex flex-col gap-2 w-full">
          {keys.map((row, i) => (
            <div key={i} className="flex gap-1 justify-center w-full">
              {row.map(key => (
                <button 
                  key={key} 
                  onClick={() => handleKeyPress(key)} 
                  className={`pixel-button h-10 font-bold text-xs transition-none flex items-center justify-center pixel-border ${
                    key === 'ENTER' || key === 'BACKSPACE' ? 'flex-[1.5] text-xs' : 'flex-1'
                  } ${getKeyColor(key)}`}
                  style={{ boxShadow: '2px 2px 0 rgba(0,0,0,0.6)' }}
                >
                  {key === 'BACKSPACE' ? '⌫' : key}
                </button>
              ))}
            </div>
          ))}
        </div>
        
        <button 
          onClick={() => startNewGame(wordLength)} 
          className="pixel-button mt-8 w-full py-3 bg-green-600 hover:bg-green-500 text-white font-bold flex items-center justify-center gap-2 pixel-border"
          style={{ boxShadow: '4px 4px 0 rgba(0,0,0,0.6)' }}
        >
          <RotateCcw size={16}/> NEW GAME
        </button>
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
  
  // 確保動畫CSS已載入
  useEffect(() => {
    ensureAnimationStyles();
  }, []);
  
  // Lobby 
  const [roomCode, setRoomCode] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [selectedLength, setSelectedLength] = useState(5);
  const [errorMessage, setErrorMessage] = useState('');

  // 遊戲階段
  const [wordLength, setWordLength] = useState(5);
  const [myRound, setMyRound] = useState(1);
  const [opponentRound, setOpponentRound] = useState(1);
  const [potentialPoints, setPotentialPoints] = useState(5);
  const [players, setPlayers] = useState({});
  const [hints, setHints] = useState([]);
  const [winnerInfo, setWinnerInfo] = useState(null);
  const [gameStartCountdown, setGameStartCountdown] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [canSkip, setCanSkip] = useState(false);

  //得分版
  const [guesses, setGuesses] = useState([]);
  const [currentGuess, setCurrentGuess] = useState('');
  const [roundWinner, setRoundWinner] = useState(null);
  const [animatingRow, setAnimatingRow] = useState(-1); // 追蹤正在動畫的行
  const [animatedCells, setAnimatedCells] = useState(new Set()); // 追蹤已經動畫過的方塊
  const [guessHistory, setGuessHistory] = useState([]); // 所有猜測歷史
  const [showResultModal, setShowResultModal] = useState(false);
  const [resultModalType, setResultModalType] = useState(''); // 'win' or 'lose'

  useEffect(() => {
    // 創建socket連接的函數
    const createSocket = () => {
      const newSocket = io(SOCKET_URL);
      setSocket(newSocket);

      newSocket.on('room_created', ({ roomCode }) => {
        setRoomCode(roomCode);
        setViewState('waiting');
      });

      newSocket.on('game_start', ({ wordLength, players }) => {
        setWordLength(wordLength);
        setPlayers(players);
        setGameStartCountdown(3);
        setViewState('countdown');
        
        // 3秒倒數
        let count = 3;
        const countdownInterval = setInterval(() => {
          count--;
          setGameStartCountdown(count);
          if (count <= 0) {
            clearInterval(countdownInterval);
            setViewState('playing');
          }
        }, 1000);
      });

      newSocket.on('new_round', (data) => {
        setMyRound(data.myRound);
        setOpponentRound(data.opponentRound);
        setPotentialPoints(5);
        setHints([]);
        setGuesses([]);
        setCurrentGuess('');
        setRoundWinner(null);
        setErrorMessage('');
        setCanSkip(true); // 隨時可以跳過
        setShowResultModal(false);
        setAnimatingRow(-1);
        setAnimatedCells(new Set()); // 重置動畫追蹤
      });



      newSocket.on('player_left', ({ message }) => {
        setErrorMessage(message);
        setTimeout(() => {
          setViewState('lobby');
          setRoomCode('');
        }, 3000);
      });

      newSocket.on('hint_reveal', (hint) => {
        setHints(prev => [...prev, hint]);
        setPotentialPoints(hint.currentPoints);
      });

      newSocket.on('guess_result', ({ guess, result, isCorrect, gameOver }) => {
        // 先更新猜測
        setGuesses(prev => {
          const newGuesses = [...prev, { word: guess, result }];
          const currentRowIndex = newGuesses.length - 1; // 使用更新後的長度計算行索引
          
          // 在狀態更新後觸發動畫
          setTimeout(() => {
            console.log(`Triggering DOM animation for row ${currentRowIndex}`);
            console.log(`Total guesses after update: ${newGuesses.length}`);
            
            // 使用更精確的方法找到對應行的方塊
            const gridContainer = document.querySelector('.space-y-2');
            if (gridContainer) {
              const rows = gridContainer.children;
              console.log(`Total rows found: ${rows.length}`);
              const targetRow = rows[currentRowIndex];
              
              if (targetRow) {
                const cellsInRow = targetRow.querySelectorAll('.wordle-cell');
                console.log(`Found ${cellsInRow.length} cells in row ${currentRowIndex}`);
                
                for (let j = 0; j < guess.length && j < cellsInRow.length; j++) {
                  const cell = cellsInRow[j];
                  
                  if (cell) {
                    // 移除現有動畫類別
                    cell.classList.remove('animate-strong-impact', 'animate-medium-impact', 'animate-weak-impact');
                    
                    // 強制重繪
                    cell.offsetHeight;
                    
                    // 根據結果添加對應動畫
                    let animationClass = '';
                    if (result[j] === 'correct') {
                      animationClass = 'animate-strong-impact';
                    } else if (result[j] === 'present') {
                      animationClass = 'animate-medium-impact';
                    } else {
                      animationClass = 'animate-weak-impact';
                    }
                    
                    console.log(`Adding ${animationClass} to cell ${j} in row ${currentRowIndex}`);
                    cell.classList.add(animationClass);
                    
                    // 動畫完成後移除類別
                    setTimeout(() => {
                      cell.classList.remove(animationClass);
                    }, 1000);
                  }
                }
              } else {
                console.log(`Could not find row ${currentRowIndex}`);
              }
            } else {
              console.log('Could not find grid container');
            }
          }, 200);
          
          return newGuesses;
        });
        
        setGuessHistory(prev => [...prev, { word: guess, result }]);
        setCurrentGuess(''); // 清空輸入框
        
        // 檢查是否猜對或遊戲結束
        if (isCorrect) {
          setResultModalType('win');
          setShowResultModal(true);
          setTimeout(() => {
            setShowResultModal(false);
            // 後端會自動開始下一回合
          }, 1000);
        } else if (gameOver) {
          setResultModalType('lose');
          setShowResultModal(true);
          setTimeout(() => {
            setShowResultModal(false);
            // 後端會自動開始下一回合
          }, 1000);
        }
      });

      newSocket.on('guess_error', (msg) => {
        setErrorMessage(msg);
        setTimeout(() => setErrorMessage(''), 1500);
      });

      // 新增：對手猜對的通知
      newSocket.on('opponent_won_round', ({ opponentName, word, points }) => {
        setErrorMessage(`🎉 對手猜對了！答案是 "${word}" (+${points} 分)`);
        setTimeout(() => setErrorMessage(''), 3000);
      });

      newSocket.on('round_winner', (data) => {
        // 只更新分數，不影響當前玩家的遊戲流程
        setPlayers(data.updatedPlayers);
        
        // 檢查是否有人達到30分
        const myScore = data.updatedPlayers[newSocket.id]?.score || 0;
        const opponentId = Object.keys(data.updatedPlayers).find(id => id !== newSocket.id);
        const opponentScore = data.updatedPlayers[opponentId]?.score || 0;
        
        if (myScore >= 30 || opponentScore >= 30) {
          setTimeout(() => {
            const winner = myScore >= 30 ? newSocket.id : opponentId;
            setWinnerInfo(winner);
            setViewState('gameOver');
          }, 2000);
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

      return newSocket;
    };

    // 初始創建socket
    const initialSocket = createSocket();
    
    // 清理函數
    return () => {
      if (initialSocket) {
        initialSocket.close();
      }
    };
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

  const exitGame = () => {
    if (socket) {
      socket.emit('leave_room', { roomCode });
      socket.disconnect();
    }
    resetGameState();
  };

  const resetGameState = () => {
    // 重置所有狀態
    setViewState('lobby');
    setRoomCode('');
    setJoinCode('');
    setErrorMessage('');
    setWordLength(5);
    setMyRound(1);
    setOpponentRound(1);
    setPotentialPoints(5);
    setPlayers({});
    setHints([]);
    setWinnerInfo(null);
    setGameStartCountdown(0);
    setIsPaused(false);
    setCanSkip(false);
    setGuesses([]);
    setCurrentGuess('');
    setRoundWinner(null);
    setAnimatingRow(-1);
    setGuessHistory([]);
    setShowResultModal(false);
    setResultModalType('');
    setAnimatedCells(new Set());
    
    // 重新建立socket連接
    const newSocket = io(SOCKET_URL);
    setSocket(newSocket);

    // 重新綁定所有事件監聽器
    newSocket.on('room_created', ({ roomCode }) => {
      setRoomCode(roomCode);
      setViewState('waiting');
    });

    newSocket.on('game_start', ({ wordLength, players }) => {
      setWordLength(wordLength);
      setPlayers(players);
      setGameStartCountdown(3);
      setViewState('countdown');
      
      let count = 3;
      const countdownInterval = setInterval(() => {
        count--;
        setGameStartCountdown(count);
        if (count <= 0) {
          clearInterval(countdownInterval);
          setViewState('playing');
        }
      }, 1000);
    });

    newSocket.on('new_round', (data) => {
      setMyRound(data.myRound);
      setOpponentRound(data.opponentRound);
      setPotentialPoints(5);
      setHints([]);
      setGuesses([]);
      setCurrentGuess('');
      setRoundWinner(null);
      setErrorMessage('');
      setCanSkip(true);
      setAnimatedCells(new Set()); // 重置動畫追蹤
    });

    newSocket.on('player_left', ({ message }) => {
      setErrorMessage(message);
      setTimeout(() => {
        resetGameState();
      }, 3000);
    });

    newSocket.on('hint_reveal', (hint) => {
      setHints(prev => [...prev, hint]);
      setPotentialPoints(hint.currentPoints);
    });

    newSocket.on('guess_result', ({ guess, result, isCorrect, gameOver }) => {
      // 先更新猜測
      setGuesses(prev => {
        const newGuesses = [...prev, { word: guess, result }];
        const currentRowIndex = newGuesses.length - 1; // 使用更新後的長度計算行索引
        
        // 在狀態更新後觸發動畫
        setTimeout(() => {
          console.log(`Triggering DOM animation for row ${currentRowIndex} (reset)`);
          console.log(`Total guesses after update: ${newGuesses.length} (reset)`);
          
          // 使用更精確的方法找到對應行的方塊
          const gridContainer = document.querySelector('.space-y-2');
          if (gridContainer) {
            const rows = gridContainer.children;
            console.log(`Total rows found: ${rows.length} (reset)`);
            const targetRow = rows[currentRowIndex];
            
            if (targetRow) {
              const cellsInRow = targetRow.querySelectorAll('.wordle-cell');
              console.log(`Found ${cellsInRow.length} cells in row ${currentRowIndex} (reset)`);
              
              for (let j = 0; j < guess.length && j < cellsInRow.length; j++) {
                const cell = cellsInRow[j];
                
                if (cell) {
                  // 移除現有動畫類別
                  cell.classList.remove('animate-strong-impact', 'animate-medium-impact', 'animate-weak-impact');
                  
                  // 強制重繪
                  cell.offsetHeight;
                  
                  // 根據結果添加對應動畫
                  let animationClass = '';
                  if (result[j] === 'correct') {
                    animationClass = 'animate-strong-impact';
                  } else if (result[j] === 'present') {
                    animationClass = 'animate-medium-impact';
                  } else {
                    animationClass = 'animate-weak-impact';
                  }
                  
                  console.log(`Adding ${animationClass} to cell ${j} in row ${currentRowIndex} (reset)`);
                  cell.classList.add(animationClass);
                  
                  // 動畫完成後移除類別
                  setTimeout(() => {
                    cell.classList.remove(animationClass);
                  }, 1000);
                }
              }
            } else {
              console.log(`Could not find row ${currentRowIndex} (reset)`);
            }
          } else {
            console.log('Could not find grid container (reset)');
          }
        }, 200);
        
        return newGuesses;
      });
      
      setGuessHistory(prev => [...prev, { word: guess, result }]);
      setCurrentGuess('');
      
      // 檢查是否猜對或遊戲結束
      if (isCorrect) {
        setResultModalType('win');
        setShowResultModal(true);
        setTimeout(() => {
          setShowResultModal(false);
          // 後端會自動開始下一回合
        }, 1000);
      } else if (gameOver) {
        setResultModalType('lose');
        setShowResultModal(true);
        setTimeout(() => {
          setShowResultModal(false);
          // 後端會自動開始下一回合
        }, 1000);
      }
    });

    newSocket.on('guess_error', (msg) => {
      setErrorMessage(msg);
      setTimeout(() => setErrorMessage(''), 1500);
    });

    // 新增：對手猜對的通知
    newSocket.on('opponent_won_round', ({ opponentName, word, points }) => {
      setErrorMessage(`🎉 對手猜對了！答案是 "${word}" (+${points} 分)`);
      setTimeout(() => setErrorMessage(''), 3000);
    });

    newSocket.on('round_winner', (data) => {
      // 只更新分數，不影響當前玩家的遊戲流程
      setPlayers(data.updatedPlayers);
      
      // 檢查是否有人達到30分
      const myScore = data.updatedPlayers[newSocket.id]?.score || 0;
      const opponentId = Object.keys(data.updatedPlayers).find(id => id !== newSocket.id);
      const opponentScore = data.updatedPlayers[opponentId]?.score || 0;
      
      if (myScore >= 30 || opponentScore >= 30) {
        setTimeout(() => {
          const winner = myScore >= 30 ? newSocket.id : opponentId;
          setWinnerInfo(winner);
          setViewState('gameOver');
        }, 2000);
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
  };

  const togglePause = () => {
    // 移除暫停功能，因為沒有計時器
  };

  const skipRound = () => {
    if (socket && roomCode && canSkip) {
      socket.emit('skip_round', { roomCode });
    }
  };

  const handleKeyPress = (key) => {
    if (viewState !== 'playing' || roundWinner || showResultModal) return;

    if (key === 'ENTER') {
      if (currentGuess.length !== wordLength) return;
      
      // 檢查是否在當前回合重複輸入（只檢查當前回合的guesses，不檢查guessHistory）
      const isDuplicate = guesses.some(guess => guess.word === currentGuess);
      if (isDuplicate) {
        setErrorMessage('這個單字在本回合已經猜過了！');
        setTimeout(() => setErrorMessage(''), 1500);
        return;
      }
      
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
      <div className="min-h-screen bg-gradient-to-b from-purple-900 via-blue-900 to-indigo-900 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-gray-900 p-8 pixel-border text-white relative" style={{ boxShadow: '8px 8px 0 rgba(0,0,0,0.8)' }}>
          <button onClick={onBack} className="pixel-button absolute top-4 left-4 p-2 bg-red-600 hover:bg-red-500 pixel-border" style={{ boxShadow: '2px 2px 0 rgba(0,0,0,0.6)' }}>
            <ArrowLeft size={16}/>
          </button>
          <h2 className="text-xl font-bold mb-8 text-center flex items-center justify-center gap-2 text-yellow-400">
            <Trophy className="text-orange-400"/> COMPETITIVE
          </h2>
          
          <div className="mb-8 p-4 bg-gray-800 pixel-border" style={{ boxShadow: 'inset 2px 2px 0 rgba(0,0,0,0.5)' }}>
            <h3 className="font-bold mb-3 flex items-center gap-2 text-blue-400 text-sm">
              <User size={16}/> CREATE ROOM
            </h3>
            <div className="flex gap-2 mb-4 justify-center">
                {[4, 5, 6, 7].map(len => (
                    <button 
                      key={len} 
                      onClick={() => setSelectedLength(len)} 
                      className={`pixel-button px-3 py-1 text-xs font-bold transition-none pixel-border ${
                        selectedLength === len ? 'bg-yellow-400 text-gray-900' : 'bg-gray-700 text-white hover:bg-gray-600'
                      }`}
                      style={{ boxShadow: '2px 2px 0 rgba(0,0,0,0.6)' }}
                    >
                      {len}
                    </button>
                ))}
            </div>
            <button 
              onClick={createRoom} 
              className="pixel-button w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold transition-none pixel-border text-xs"
              style={{ boxShadow: '2px 2px 0 rgba(0,0,0,0.6)' }}
            >
              CREATE & WAIT
            </button>
          </div>

          <div className="p-4 bg-gray-800 pixel-border" style={{ boxShadow: 'inset 2px 2px 0 rgba(0,0,0,0.5)' }}>
            <h3 className="font-bold mb-3 flex items-center gap-2 text-green-400 text-sm">
              <Users size={16}/> JOIN ROOM
            </h3>
            <div className="flex gap-2">
                <input 
                    type="text" 
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value)}
                    placeholder="ROOM CODE"
                    className="flex-1 bg-gray-700 pixel-border px-3 py-2 text-center tracking-widest uppercase text-white text-xs"
                    style={{ boxShadow: 'inset 2px 2px 0 rgba(0,0,0,0.5)' }}
                    maxLength={6}
                />
                <button 
                  onClick={joinRoom} 
                  className="pixel-button px-4 bg-green-600 hover:bg-green-500 text-white font-bold pixel-border text-xs"
                  style={{ boxShadow: '2px 2px 0 rgba(0,0,0,0.6)' }}
                >
                  JOIN
                </button>
            </div>
          </div>
          {errorMessage && (
            <p className="text-red-400 text-center mt-4 text-xs animate-pulse bg-red-900/30 p-2 pixel-border">
              {errorMessage}
            </p>
          )}
        </div>
      </div>
    );
  }

  if (viewState === 'waiting') {
    const exitWaiting = () => {
      if (socket) {
        socket.emit('leave_room', { roomCode });
        socket.disconnect();
      }
      resetGameState();
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-purple-900 via-blue-900 to-indigo-900 flex flex-col items-center justify-center p-4">
            <div className="bg-gray-900 p-10 pixel-border text-center animate-pulse relative text-white" style={{ boxShadow: '8px 8px 0 rgba(0,0,0,0.8)' }}>
                <Hash size={32} className="mx-auto text-yellow-400 mb-4"/>
                <h2 className="text-lg font-bold mb-2 text-yellow-400">ROOM CODE</h2>
                <div className="text-3xl bg-gray-800 px-6 py-4 pixel-border tracking-widest text-green-400 select-all mb-6" style={{ boxShadow: 'inset 4px 4px 0 rgba(0,0,0,0.5)' }}>
                    {roomCode}
                </div>
                <p className="text-gray-400 flex items-center justify-center gap-2 mb-6 text-xs">
                    <Users className="animate-bounce" size={16}/> WAITING FOR OPPONENT...
                </p>
                <button 
                  onClick={exitWaiting}
                  className="pixel-button px-6 py-2 bg-red-600 hover:bg-red-500 text-white font-bold pixel-border text-xs"
                  style={{ boxShadow: '2px 2px 0 rgba(0,0,0,0.6)' }}
                >
                  EXIT WAITING
                </button>
            </div>
        </div>
    );
  }

  if (viewState === 'countdown') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-900 via-blue-900 to-indigo-900 flex flex-col items-center justify-center p-4">
        <div className="bg-gray-900 p-16 pixel-border text-center text-white" style={{ boxShadow: '8px 8px 0 rgba(0,0,0,0.8)' }}>
          <h2 className="text-xl font-bold mb-8 text-yellow-400">GET READY!</h2>
          <div className="text-6xl font-bold text-green-400 animate-pulse mb-8">
            {gameStartCountdown || 'GO!'}
          </div>
          <p className="text-gray-400 text-xs">GAME STARTING...</p>
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
                        let style = 'bg-gray-800 pixel-border text-white'; 
                        
                        const isHint = hints.find(h => h.index === j);

                        if (guess) {
                            letter = guess.word[j];
                            if (guess.result[j] === 'correct') {
                              style = 'bg-green-600 pixel-border text-white';
                            } else if (guess.result[j] === 'present') {
                              style = 'bg-yellow-600 pixel-border text-white';
                            } else {
                              style = 'bg-gray-600 pixel-border text-gray-300';
                            }
                        } else if (isCurrent && currentGuess[j]) {
                            letter = currentGuess[j];
                            style = 'bg-blue-600 pixel-border animate-pulse text-white';
                        } else if (!guess && isHint) {
                            letter = isHint.char;
                            style = 'bg-purple-600 pixel-border text-purple-300';
                        }
                        
                        return (
                          <div 
                            key={j} 
                            className={`wordle-cell ${style} w-12 h-12 flex items-center justify-center text-lg font-bold transition-none`}
                            style={{ boxShadow: '2px 2px 0 rgba(0,0,0,0.6)' }}
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
      
      const keys = [['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'], ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'], ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'BACKSPACE']];

      return (
        <div className="min-h-screen bg-gradient-to-b from-purple-900 via-blue-900 to-indigo-900 text-white flex items-center justify-center py-4 px-2">
          <div className="flex gap-6 w-full max-w-6xl">
            {/* 中間：主要遊戲區域 */}
            <div className="flex-1 flex flex-col items-center">
              {/* 控制按鈕區域 */}
              <div className="w-full max-w-xl flex justify-between items-center mb-4">
                  <button 
                    onClick={exitGame}
                    className="pixel-button px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold transition-none pixel-border text-xs"
                    style={{ boxShadow: '2px 2px 0 rgba(0,0,0,0.6)' }}
                  >
                    EXIT GAME
                  </button>
                  <div className="flex gap-2">
                    {canSkip && (
                      <button 
                        onClick={skipRound}
                        className="pixel-button px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold transition-none pixel-border text-xs"
                        style={{ boxShadow: '2px 2px 0 rgba(0,0,0,0.6)' }}
                      >
                        SKIP ROUND
                      </button>
                    )}
                  </div>
              </div>

              <div className="w-full max-w-xl flex justify-between items-end mb-4 bg-gray-900 p-4 pixel-border" style={{ boxShadow: '4px 4px 0 rgba(0,0,0,0.8)' }}>
                  <div className="text-center">
                      <p className="text-xs text-gray-400">YOU</p>
                      <p className="text-2xl font-bold text-green-400">{myScore}</p>
                      <p className="text-xs text-gray-500">ROUND {myRound}</p>
                  </div>
                  <div className="flex flex-col items-center">
                      <div className="text-xs text-orange-400 mb-1 font-bold">
                          BATTLE MODE
                      </div>
                      <div className="text-lg bg-gray-800 px-4 py-2 pixel-border text-white" style={{ boxShadow: '2px 2px 0 rgba(0,0,0,0.6)' }}>
                          NO TIME LIMIT
                      </div>
                      <p className="text-xs text-yellow-300 mt-1">WIN: +{potentialPoints} PTS | FIRST TO 30 WINS!</p>
                  </div>
                  <div className="text-center">
                      <p className="text-xs text-gray-400">OPPONENT</p>
                      <p className="text-2xl font-bold text-red-400">{opponentScore}</p>
                      <p className="text-xs text-gray-500">ROUND {opponentRound}</p>
                  </div>
              </div>

              {errorMessage && (
                <div className={`mb-4 px-4 py-2 pixel-border font-bold animate-pulse text-xs ${
                  errorMessage.includes('won') || errorMessage.includes('對手猜對了') ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                }`} style={{ boxShadow: '2px 2px 0 rgba(0,0,0,0.6)' }}>
                  {errorMessage}
                </div>
              )}

              <div className="space-y-2 mb-6 select-none relative">
                  {roundWinner && (
                      <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80 z-10 backdrop-blur-sm pixel-border">
                          <div className="text-lg font-bold text-yellow-400">WAITING FOR NEXT ROUND...</div>
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
                                  className={`pixel-button h-10 font-bold text-xs flex items-center justify-center transition-none bg-gray-700 hover:bg-gray-600 text-white pixel-border ${
                                    key === 'ENTER' || key === 'BACKSPACE' ? 'flex-[1.5] text-xs' : 'flex-1'
                                  }`}
                                  style={{ boxShadow: '2px 2px 0 rgba(0,0,0,0.6)' }}
                              >
                                  {key === 'BACKSPACE' ? '⌫' : key}
                              </button>
                          ))}
                      </div>
                  ))}
              </div>
            </div>
            
            {/* 右側：字母狀態 */}
            <div className="flex-shrink-0">
              <LetterStatusTracker guesses={guesses} />
            </div>
          </div>
          
          {/* 結算彈窗 */}
          <ResultModal show={showResultModal} type={resultModalType} />
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
          <div className="min-h-screen bg-gradient-to-b from-purple-900 via-blue-900 to-indigo-900 text-white flex flex-col items-center justify-center p-4">
              <div className="max-w-md w-full bg-gray-900 p-8 pixel-border text-center" style={{ boxShadow: '8px 8px 0 rgba(0,0,0,0.8)' }}>
                  {isWinner ? (
                      <div className="text-yellow-400 mb-4"><Trophy size={48} className="mx-auto"/></div>
                  ) : (
                      <div className="text-gray-500 mb-4"><Swords size={48} className="mx-auto"/></div>
                  )}
                  <h2 className="text-2xl font-bold mb-2 text-yellow-400">
                    {isWinner ? 'VICTORY!' : (winnerInfo === 'draw' ? 'DRAW!' : 'DEFEAT!')}
                  </h2>
                  <p className="text-gray-400 mb-8 text-xs">GOOD GAME!</p>
                  
                  <div className="flex justify-center gap-8 text-xl font-bold mb-8">
                      <div className="text-center">
                          <div className="text-xs text-gray-500">YOU</div>
                          <div className={isWinner ? 'text-green-400' : 'text-gray-300'}>{myScore}</div>
                      </div>
                      <div className="text-gray-600">-</div>
                      <div className="text-center">
                          <div className="text-xs text-gray-500">OPPONENT</div>
                          <div className={!isWinner && winnerInfo !== 'draw' ? 'text-green-400' : 'text-gray-300'}>{opponentScore}</div>
                      </div>
                  </div>

                  <button 
                    onClick={resetGameState} 
                    className="pixel-button w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold pixel-border text-xs"
                    style={{ boxShadow: '4px 4px 0 rgba(0,0,0,0.6)' }}
                  >
                    BACK TO MENU
                  </button>
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