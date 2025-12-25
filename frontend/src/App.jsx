import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { RotateCcw, Wifi, WifiOff, User, Swords, ArrowLeft, Trophy, Info, Clock, Users, Hash } from 'lucide-react';
import io from 'socket.io-client';

// Environment-based API URLs
const API_URL = import.meta.env.PROD 
  ? 'https://wordle-game-backend-v2.onrender.com/api'
  : 'http://localhost:3001/api';

const SOCKET_URL = import.meta.env.PROD 
  ? 'https://wordle-game-backend-v2.onrender.com'
  : 'http://localhost:3001';

// ==========================================
// Audio Management System - Pixel Style
// ==========================================
class AudioManager {
  constructor() {
    this.sounds = {};
    this.isMuted = false;
    this.volume = 0.7;
    this.backgroundMusic = null;
    this.currentBgMusic = null;
    
    // Sound file mappings (Chinese filenames to English function names)
    this.soundFiles = {
      // Button and UI sounds
      buttonClick: './sounds/按鍵音效.mp3',
      buttonCancel: './sounds/取消按鍵音效.mp3',
      skipButton: './sounds/skip按鍵音效.mp3',
      
      // Cell color effects
      correctCell: './sounds/綠色方塊音效.mp3',    // Green cell (correct)
      presentCell: './sounds/黃色方塊音效.mp3',    // Yellow cell (present)
      absentCell: './sounds/灰色方塊音效.mp3',     // Gray cell (absent)
      
      // Game events
      scoreIncrease: './sounds/分數+5的音效.mp3',  // +5 points sound
      battleStart: './sounds/對戰開始的音效.mp3',   // Battle start sound
      
      // Background music
      homeMusic: './sounds/主頁面_等待頁面加入或創建房間頁面_背景音樂.mp3',
      singlePlayerMusic: './sounds/單人遊玩頁面_背景音樂.mp3',
      battleMusic: './sounds/對戰頁面_背景音樂.mp3'
    };
    
    this.preloadSounds();
  }
  
  preloadSounds() {
    // Preload all sound effects
    Object.entries(this.soundFiles).forEach(([key, path]) => {
      if (key !== 'homeMusic' && key !== 'singlePlayerMusic' && key !== 'battleMusic') {
        const audio = new Audio(path);
        audio.preload = 'auto';
        audio.volume = this.volume;
        this.sounds[key] = audio;
      }
    });
    
    // Preload background music separately
    this.sounds.homeMusic = new Audio(this.soundFiles.homeMusic);
    this.sounds.homeMusic.loop = true;
    this.sounds.homeMusic.volume = this.volume * 0.3; // Lower volume for background
    
    this.sounds.singlePlayerMusic = new Audio(this.soundFiles.singlePlayerMusic);
    this.sounds.singlePlayerMusic.loop = true;
    this.sounds.singlePlayerMusic.volume = this.volume * 0.3;
    
    this.sounds.battleMusic = new Audio(this.soundFiles.battleMusic);
    this.sounds.battleMusic.loop = true;
    this.sounds.battleMusic.volume = this.volume * 0.3;
  }
  
  play(soundName, options = {}) {
    if (this.isMuted) return;
    
    const sound = this.sounds[soundName];
    if (!sound) {
      console.warn(`Sound '${soundName}' not found`);
      return;
    }
    
    try {
      // Reset sound to beginning
      sound.currentTime = 0;
      
      // Apply volume
      const volume = options.volume !== undefined ? options.volume : this.volume;
      sound.volume = Math.max(0, Math.min(1, volume));
      
      // Play sound
      const playPromise = sound.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.warn(`Failed to play sound '${soundName}':`, error);
        });
      }
    } catch (error) {
      console.warn(`Error playing sound '${soundName}':`, error);
    }
  }
  
  playBackgroundMusic(musicName, forceRestart = false) {
    if (this.isMuted) return;
    
    // If the same music is already playing and we don't want to force restart, do nothing
    if (this.currentBgMusic && !this.currentBgMusic.paused && !this.currentBgMusic.ended) {
      // Check if it's the same music file
      const currentSrc = this.currentBgMusic.src;
      const targetSrc = this.soundFiles[musicName];
      if (currentSrc.includes(targetSrc.split('/').pop()) && !forceRestart) {
        console.log(`Background music '${musicName}' is already playing, not restarting`);
        return;
      }
    }
    
    // Stop current background music only if it's different
    if (this.currentBgMusic && this.currentBgMusic.src && 
        !this.currentBgMusic.src.includes(this.soundFiles[musicName].split('/').pop())) {
      this.stopBackgroundMusic();
    }
    
    const music = this.sounds[musicName];
    if (!music) {
      console.warn(`Background music '${musicName}' not found`);
      return;
    }
    
    try {
      if (forceRestart || !this.currentBgMusic || this.currentBgMusic.paused || this.currentBgMusic.ended) {
        if (forceRestart) {
          music.currentTime = 0;
        }
        music.volume = this.volume * 0.3; // Lower volume for background
        
        // Try to play immediately
        const playPromise = music.play();
        if (playPromise !== undefined) {
          playPromise.then(() => {
            console.log(`Background music '${musicName}' started successfully`);
            this.currentBgMusic = music;
          }).catch(error => {
            console.warn(`Autoplay blocked for '${musicName}', setting up user interaction handler:`, error);
            // Set up user interaction handler if autoplay is blocked
            this.setupUserInteractionHandler(musicName);
          });
        } else {
          // Older browsers that don't return a promise
          this.currentBgMusic = music;
        }
      }
    } catch (error) {
      console.warn(`Error playing background music '${musicName}':`, error);
      this.setupUserInteractionHandler(musicName);
    }
  }
  
  setupUserInteractionHandler(musicName) {
    const handleUserInteraction = () => {
      console.log('User interaction detected, attempting to play music:', musicName);
      if (!this.currentBgMusic || this.currentBgMusic.paused) {
        this.playBackgroundMusic(musicName);
      }
      // Remove listeners after first successful play
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('keydown', handleUserInteraction);
      document.removeEventListener('touchstart', handleUserInteraction);
    };
    
    // Add listeners for user interaction
    document.addEventListener('click', handleUserInteraction);
    document.addEventListener('keydown', handleUserInteraction);
    document.addEventListener('touchstart', handleUserInteraction);
    
    console.log('User interaction handlers set up for music:', musicName);
  }
  
  stopBackgroundMusic() {
    if (this.currentBgMusic) {
      this.currentBgMusic.pause();
      this.currentBgMusic.currentTime = 0;
      this.currentBgMusic = null;
    }
  }
  
  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume));
    
    // Update all sound volumes
    Object.values(this.sounds).forEach(sound => {
      if (sound.loop) {
        // Background music gets lower volume
        sound.volume = this.volume * 0.3;
      } else {
        sound.volume = this.volume;
      }
    });
  }
  
  toggleMute() {
    this.isMuted = !this.isMuted;
    
    if (this.isMuted) {
      this.stopBackgroundMusic();
    }
    
    return this.isMuted;
  }
  
  setMuted(muted) {
    this.isMuted = muted;
    if (muted) {
      this.stopBackgroundMusic();
    }
  }
}

// Create global audio manager instance
const audioManager = new AudioManager();

// Global music state to prevent restarts
let globalMusicState = {
  currentMusic: null,
  isPlaying: false
};

// Enhanced AudioManager with global state
audioManager.playBackgroundMusicGlobal = function(musicName, forceRestart = false) {
  // Check global state first
  if (globalMusicState.currentMusic === musicName && globalMusicState.isPlaying && !forceRestart) {
    console.log(`Global music state: '${musicName}' already playing, skipping`);
    return;
  }
  
  // Update global state
  globalMusicState.currentMusic = musicName;
  globalMusicState.isPlaying = true;
  
  // Call original method
  this.playBackgroundMusic(musicName, forceRestart);
};

audioManager.stopBackgroundMusicGlobal = function() {
  globalMusicState.currentMusic = null;
  globalMusicState.isPlaying = false;
  this.stopBackgroundMusic();
};

// React hook for audio management
const useAudio = () => {
  const [isMuted, setIsMuted] = useState(audioManager.isMuted);
  const [volume, setVolumeState] = useState(audioManager.volume);
  const [musicPlaying, setMusicPlaying] = useState(false);
  
  const toggleMute = () => {
    const newMutedState = audioManager.toggleMute();
    setIsMuted(newMutedState);
  };
  
  const setVolume = (newVolume) => {
    audioManager.setVolume(newVolume);
    setVolumeState(newVolume);
  };
  
  const playSound = (soundName, options) => {
    audioManager.play(soundName, options);
  };
  
  const playBackgroundMusic = (musicName, forceRestart = false) => {
    audioManager.playBackgroundMusicGlobal(musicName, forceRestart);
    setMusicPlaying(true);
  };
  
  const stopBackgroundMusic = () => {
    audioManager.stopBackgroundMusicGlobal();
    setMusicPlaying(false);
  };
  
  // Check if music is currently playing
  useEffect(() => {
    const checkMusicStatus = () => {
      const isPlaying = audioManager.currentBgMusic && !audioManager.currentBgMusic.paused;
      setMusicPlaying(isPlaying);
    };
    
    const interval = setInterval(checkMusicStatus, 1000);
    return () => clearInterval(interval);
  }, []);
  
  return {
    isMuted,
    volume,
    musicPlaying,
    toggleMute,
    setVolume,
    playSound,
    playBackgroundMusic,
    stopBackgroundMusic
  };
};



// Add pixel-style CSS
const customStyles = `
  /* Pixel font */
  @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
  
  * {
    font-family: 'Press Start 2P', cursive !important;
    image-rendering: pixelated;
    image-rendering: -moz-crisp-edges;
    image-rendering: crisp-edges;
  }
  
  /* Pixel-style animations */
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
  
  /* Pixel-style borders */
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
  
  /* Pixel-style button effects */
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

// Inject CSS to page - ensure CSS always exists
const ensureAnimationStyles = () => {
  if (typeof document !== 'undefined') {
    // Remove old styles (if exists)
    const existingStyle = document.getElementById('wordle-animations');
    if (existingStyle) {
      existingStyle.remove();
    }
    
    // Create new styles
    const styleSheet = document.createElement('style');
    styleSheet.id = 'wordle-animations';
    styleSheet.textContent = customStyles;
    document.head.appendChild(styleSheet);
  }
};

// Execute immediately once
ensureAnimationStyles();

// ==========================================
// 0. Game Instructions Modal - Pixel Style
// ==========================================
const GameInstructionsModal = ({ isOpen, onClose }) => {
  const { playSound } = useAudio();

  const handleClose = () => {
    playSound('buttonCancel');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-gray-900 pixel-border text-white max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-modal-slide-in" style={{ boxShadow: '8px 8px 0 rgba(0,0,0,0.8)' }}>
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl text-yellow-400 font-bold no-select">GAME INSTRUCTIONS</h2>
            <button 
              onClick={handleClose}
              className="pixel-button p-2 bg-red-600 hover:bg-red-500 pixel-border text-white transition-smooth hover-scale cursor-pointer"
              style={{ boxShadow: '2px 2px 0 rgba(0,0,0,0.6)' }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="space-y-6 text-sm">
            {/* How to Play */}
            <div className="bg-gray-800 p-4 pixel-border" style={{ boxShadow: '4px 4px 0 rgba(0,0,0,0.6)' }}>
              <h3 className="text-green-400 font-bold mb-3 no-select">HOW TO PLAY</h3>
              <ul className="space-y-2 text-gray-300">
                <li>• GUESS THE WORDLE IN 6 TRIES</li>
                <li>• EACH GUESS MUST BE A VALID WORD</li>
                <li>• PRESS ENTER TO SUBMIT YOUR GUESS</li>
                <li>• COLORS WILL SHOW HOW CLOSE YOUR GUESS WAS</li>
              </ul>
            </div>

            {/* Color Guide */}
            <div className="bg-gray-800 p-4 pixel-border" style={{ boxShadow: '4px 4px 0 rgba(0,0,0,0.6)' }}>
              <h3 className="text-green-400 font-bold mb-3 no-select">COLOR GUIDE</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-600 pixel-border flex items-center justify-center text-white font-bold" style={{ boxShadow: '2px 2px 0 rgba(0,0,0,0.6)' }}>W</div>
                  <span className="text-gray-300">GREEN = CORRECT LETTER IN CORRECT POSITION</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-yellow-600 pixel-border flex items-center justify-center text-white font-bold" style={{ boxShadow: '2px 2px 0 rgba(0,0,0,0.6)' }}>O</div>
                  <span className="text-gray-300">YELLOW = CORRECT LETTER IN WRONG POSITION</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-600 pixel-border flex items-center justify-center text-white font-bold" style={{ boxShadow: '2px 2px 0 rgba(0,0,0,0.6)' }}>R</div>
                  <span className="text-gray-300">GRAY = LETTER NOT IN THE WORD</span>
                </div>
              </div>
            </div>

            {/* Game Modes */}
            <div className="bg-gray-800 p-4 pixel-border" style={{ boxShadow: '4px 4px 0 rgba(0,0,0,0.6)' }}>
              <h3 className="text-green-400 font-bold mb-3 no-select">GAME MODES</h3>
              <div className="space-y-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <User size={16} className="text-blue-400" />
                    <span className="text-blue-400 font-bold">SINGLE PLAYER</span>
                  </div>
                  <p className="text-gray-300 text-xs ml-6">CLASSIC WORDLE EXPERIENCE WITH 4-7 LETTER WORDS</p>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Swords size={16} className="text-red-400" />
                    <span className="text-red-400 font-bold">COMPETITIVE</span>
                  </div>
                  <p className="text-gray-300 text-xs ml-6">RACE AGAINST OTHER PLAYERS • FIRST TO 30 POINTS WINS</p>
                  <p className="text-gray-300 text-xs ml-6">+5 POINTS PER ROUND WIN • 0 POINTS IF YOU VIEW ANSWER</p>
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="bg-gray-800 p-4 pixel-border" style={{ boxShadow: '4px 4px 0 rgba(0,0,0,0.6)' }}>
              <h3 className="text-green-400 font-bold mb-3 no-select">CONTROLS</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-yellow-400 font-bold">KEYBOARD:</span>
                  <ul className="text-gray-300 mt-1 space-y-1">
                    <li>• TYPE LETTERS TO GUESS</li>
                    <li>• ENTER = SUBMIT GUESS</li>
                    <li>• BACKSPACE = DELETE LETTER</li>
                  </ul>
                </div>
                <div>
                  <span className="text-yellow-400 font-bold">BUTTONS:</span>
                  <ul className="text-gray-300 mt-1 space-y-1">
                    <li>• SHOW ANSWER = VIEW CURRENT WORD</li>
                    <li>• PAUSE = PAUSE GAME</li>
                    <li>• SKIP = SKIP ROUND (COMPETITIVE)</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Tips */}
            <div className="bg-gray-800 p-4 pixel-border" style={{ boxShadow: '4px 4px 0 rgba(0,0,0,0.6)' }}>
              <h3 className="text-green-400 font-bold mb-3 no-select">TIPS & STRATEGIES</h3>
              <ul className="space-y-2 text-gray-300 text-xs">
                <li>• START WITH WORDS CONTAINING COMMON VOWELS (A, E, I, O, U)</li>
                <li>• USE COMMON CONSONANTS LIKE R, S, T, L, N</li>
                <li>• PAY ATTENTION TO LETTER FREQUENCY IN ENGLISH</li>
                <li>• ELIMINATE LETTERS SYSTEMATICALLY</li>
                <li>• IN COMPETITIVE MODE: SPEED MATTERS, BUT ACCURACY IS KEY</li>
                <li>• VIEWING ANSWERS GIVES 0 POINTS - USE WISELY!</li>
              </ul>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-6 pt-4 border-t-2 border-gray-700 text-center">
            <button 
              onClick={handleClose}
              className="pixel-button px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold pixel-border transition-smooth hover-scale cursor-pointer"
              style={{ boxShadow: '4px 4px 0 rgba(0,0,0,0.6)' }}
            >
              GOT IT!
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 0. Word List Component - Pixel Style
// ==========================================
// Search Component - Optimized for performance
const WordSearch = React.memo(({ onSearch, placeholder = "Search words..." }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const debounceRef = useRef(null);

  const handleSearch = useCallback((value) => {
    setSearchTerm(value);
    
    // 清除之前的防抖定時器
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    // 設置新的防抖定時器
    debounceRef.current = setTimeout(() => {
      onSearch(value.toLowerCase().trim());
    }, 300);
  }, [onSearch]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return (
    <div className="mb-4 animate-slide-up animate-delay-150">
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => handleSearch(e.target.value)}
        placeholder={placeholder}
        className="w-full p-2 bg-gray-700 pixel-border text-white text-xs placeholder-gray-400 focus:bg-gray-600 transition-smooth"
        style={{ boxShadow: '2px 2px 0 rgba(0,0,0,0.6)' }}
      />
    </div>
  );
});

WordSearch.displayName = 'WordSearch';

// Word Item Component - Memoized for performance
const WordItem = React.memo(({ word, index, letterIndex }) => {
  return (
    <div 
      className="px-2 py-2 bg-gray-700 pixel-border text-center text-xs text-green-400 hover:bg-gray-600 transition-smooth hover-lift selectable cursor-text" 
      style={{ 
        boxShadow: '2px 2px 0 rgba(0,0,0,0.4)'
      }}
    >
      {word}
    </div>
  );
});

WordItem.displayName = 'WordItem';

// Letter Group Component - Memoized for performance
const LetterGroup = React.memo(({ 
  letter, 
  letterWords, 
  totalWords, 
  onLoadMore, 
  letterIndex 
}) => {
  const hasMore = onLoadMore && totalWords > letterWords.length;
  
  return (
    <div className="mb-4" style={{ animationDelay: `${letterIndex * 0.02}s` }}>
      <h4 className="text-sm font-bold text-yellow-400 mb-2 sticky top-0 bg-gray-800 py-1 border-b-2 border-yellow-400 z-10">
        {letter} ({letterWords.length}
        {hasMore && ` / ${totalWords}`})
      </h4>
      <div className="grid grid-cols-2 gap-2">
        {letterWords.map((word, index) => (
          <WordItem 
            key={`${letter}-${index}`}
            word={word}
            index={index}
            letterIndex={letterIndex}
          />
        ))}
      </div>
      
      {hasMore && (
        <button
          onClick={onLoadMore}
          className="w-full mt-2 p-2 bg-blue-600 hover:bg-blue-500 pixel-border text-white text-xs font-bold transition-smooth hover-scale cursor-pointer"
          style={{ boxShadow: '2px 2px 0 rgba(0,0,0,0.6)' }}
        >
          LOAD MORE {letter} WORDS (+{Math.min(100, totalWords - letterWords.length)})
        </button>
      )}
    </div>
  );
});

LetterGroup.displayName = 'LetterGroup';

const WordListSidebar = ({ isOpen, onClose, selectedLength, onLengthChange }) => {
  const [words, setWords] = useState({});
  const [loading, setLoading] = useState(false);
  const [displayedWords, setDisplayedWords] = useState({}); // 當前顯示的單字
  const [loadedLetters, setLoadedLetters] = useState(new Set()); // 已加載的字母
  const [letterGroups, setLetterGroups] = useState({}); // 緩存字母分組
  const [searchTerm, setSearchTerm] = useState(''); // 搜索詞
  const [filteredWords, setFilteredWords] = useState({}); // 過濾後的單字
  const { playSound } = useAudio();

  // 配置常數
  const WORDS_PER_LETTER_LIMIT = 100;
  const INITIAL_LETTERS_TO_LOAD = 5;
  const LETTERS_PER_LOAD = 3;
  const SEARCH_RESULTS_LIMIT = 200; // 搜索結果限制

  // 使用 useMemo 緩存字母分組，避免重複計算
  const getLetterGroups = useMemo(() => {
    return (allWords) => {
      const groups = {};
      const letters = [];
      
      for (let i = 0; i < 26; i++) {
        const letter = String.fromCharCode(65 + i);
        const wordsForLetter = allWords.filter(word => 
          word.toUpperCase().startsWith(letter)
        );
        if (wordsForLetter.length > 0) {
          groups[letter] = wordsForLetter;
          letters.push(letter);
        }
      }
      
      return { groups, letters };
    };
  }, []);

  // 搜索功能
  const handleSearch = useCallback((term) => {
    setSearchTerm(term);
    
    if (!term || !words[selectedLength]) {
      setFilteredWords({});
      return;
    }

    const allWords = words[selectedLength];
    const matchedWords = allWords
      .filter(word => word.toLowerCase().includes(term))
      .slice(0, SEARCH_RESULTS_LIMIT); // 限制搜索結果數量

    // 按字母分組搜索結果
    const searchGroups = {};
    matchedWords.forEach(word => {
      const firstLetter = word.charAt(0).toUpperCase();
      if (!searchGroups[firstLetter]) {
        searchGroups[firstLetter] = [];
      }
      searchGroups[firstLetter].push(word);
    });

    setFilteredWords({ [selectedLength]: searchGroups });
  }, [words, selectedLength, SEARCH_RESULTS_LIMIT]);

  const fetchWords = useCallback(async (length) => {
    if (words[length]) {
      // 如果已經有數據，直接使用緩存的分組
      if (!displayedWords[length] && !searchTerm) {
        const { groups, letters } = letterGroups[length] || getLetterGroups(words[length]);
        loadInitialLettersFromGroups(groups, letters, length);
      }
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/words/${length}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setWords(prev => ({ ...prev, [length]: data.words }));
        
        // 計算並緩存字母分組
        const { groups, letters } = getLetterGroups(data.words);
        setLetterGroups(prev => ({ ...prev, [length]: { groups, letters } }));
        
        // 重置顯示狀態
        setDisplayedWords(prev => ({ ...prev, [length]: {} }));
        setLoadedLetters(new Set());
        setSearchTerm('');
        setFilteredWords({});
        
        // 初始加載前幾個字母
        loadInitialLettersFromGroups(groups, letters, length);
      } else {
        console.error('API returned success: false', data);
      }
    } catch (error) {
      console.error('Failed to fetch words:', error);
    }
    setLoading(false);
  }, [words, displayedWords, letterGroups, getLetterGroups, searchTerm]);

  // 從緩存的分組中加載初始字母
  const loadInitialLettersFromGroups = useCallback((groups, letters, length) => {
    const initialLetters = letters.slice(0, INITIAL_LETTERS_TO_LOAD);
    const initialDisplayed = {};
    
    initialLetters.forEach(letter => {
      const wordsForLetter = groups[letter];
      initialDisplayed[letter] = wordsForLetter.slice(0, WORDS_PER_LETTER_LIMIT);
    });

    setDisplayedWords(prev => ({ ...prev, [length]: initialDisplayed }));
    setLoadedLetters(new Set(initialLetters));
  }, [INITIAL_LETTERS_TO_LOAD, WORDS_PER_LETTER_LIMIT]);

  // 使用 useCallback 優化函數，避免不必要的重新創建
  const loadMoreLetters = useCallback(() => {
    if (!letterGroups[selectedLength] || searchTerm) return;

    const { groups, letters } = letterGroups[selectedLength];
    const currentDisplayed = displayedWords[selectedLength] || {};
    
    // 找到下一批要加載的字母
    const nextLetters = letters.filter(letter => !loadedLetters.has(letter));
    const lettersToLoad = nextLetters.slice(0, LETTERS_PER_LOAD);

    if (lettersToLoad.length === 0) return;

    const newDisplayed = { ...currentDisplayed };
    lettersToLoad.forEach(letter => {
      const wordsForLetter = groups[letter];
      newDisplayed[letter] = wordsForLetter.slice(0, WORDS_PER_LETTER_LIMIT);
    });

    setDisplayedWords(prev => ({ ...prev, [selectedLength]: newDisplayed }));
    setLoadedLetters(prev => new Set([...prev, ...lettersToLoad]));
  }, [selectedLength, letterGroups, displayedWords, loadedLetters, searchTerm, LETTERS_PER_LOAD, WORDS_PER_LETTER_LIMIT]);

  // 為特定字母加載更多單字
  const loadMoreWordsForLetter = useCallback((letter) => {
    if (!letterGroups[selectedLength] || searchTerm) return;

    const { groups } = letterGroups[selectedLength];
    const currentDisplayed = displayedWords[selectedLength] || {};
    const currentWordsForLetter = currentDisplayed[letter] || [];
    
    const allWordsForLetter = groups[letter];
    const nextWords = allWordsForLetter.slice(
      currentWordsForLetter.length, 
      currentWordsForLetter.length + WORDS_PER_LETTER_LIMIT
    );

    if (nextWords.length === 0) return;

    setDisplayedWords(prev => ({
      ...prev,
      [selectedLength]: {
        ...prev[selectedLength],
        [letter]: [...currentWordsForLetter, ...nextWords]
      }
    }));
  }, [selectedLength, letterGroups, displayedWords, searchTerm, WORDS_PER_LETTER_LIMIT]);

  // 清除搜索
  const clearSearch = useCallback(() => {
    setSearchTerm('');
    setFilteredWords({});
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchWords(selectedLength);
    }
  }, [isOpen, selectedLength, fetchWords]);

  const handleLengthChange = useCallback((len) => {
    playSound('buttonClick');
    onLengthChange(len);
    clearSearch(); // 切換長度時清除搜索
  }, [playSound, onLengthChange, clearSearch]);

  const handleClose = useCallback(() => {
    playSound('buttonCancel');
    clearSearch(); // 關閉時清除搜索
    onClose();
  }, [playSound, onClose, clearSearch]);

  // 使用 useMemo 緩存統計數據
  const stats = useMemo(() => {
    if (!words[selectedLength]) {
      return { displayed: 0, total: 0, isSearching: false };
    }
    
    const total = words[selectedLength].length;
    const isSearching = !!searchTerm;
    
    if (isSearching && filteredWords[selectedLength]) {
      const searchDisplayed = Object.values(filteredWords[selectedLength]).reduce(
        (sum, letterWords) => sum + letterWords.length, 0
      );
      return { displayed: searchDisplayed, total, isSearching };
    }
    
    if (displayedWords[selectedLength]) {
      const displayed = Object.values(displayedWords[selectedLength]).reduce(
        (sum, letterWords) => sum + letterWords.length, 0
      );
      return { displayed, total, isSearching };
    }
    
    return { displayed: 0, total, isSearching };
  }, [words, displayedWords, filteredWords, selectedLength, searchTerm]);

  // 使用 useMemo 緩存字母組列表
  const letterGroupsList = useMemo(() => {
    const isSearching = !!searchTerm;
    const sourceData = isSearching ? filteredWords[selectedLength] : displayedWords[selectedLength];
    
    if (!sourceData) return [];

    if (isSearching) {
      // 搜索模式：顯示所有匹配的結果
      return Object.entries(sourceData).map(([letter, letterWords], index) => ({
        letter,
        letterWords,
        totalWords: letterWords.length, // 搜索模式下不顯示總數
        index,
        isSearchResult: true
      }));
    } else {
      // 正常模式：顯示分頁加載的結果
      if (!letterGroups[selectedLength]) return [];
      
      const { groups } = letterGroups[selectedLength];
      return Object.entries(sourceData).map(([letter, letterWords], index) => ({
        letter,
        letterWords,
        totalWords: groups[letter]?.length || 0,
        index,
        isSearchResult: false
      }));
    }
  }, [displayedWords, filteredWords, letterGroups, selectedLength, searchTerm]);

  const hasMoreLetters = useMemo(() => {
    if (searchTerm || !letterGroups[selectedLength]) return false;
    return loadedLetters.size < letterGroups[selectedLength].letters.length;
  }, [letterGroups, selectedLength, loadedLetters, searchTerm]);

  return (
    <div className={`fixed top-0 right-0 h-full w-96 bg-gray-900 pixel-border transform transition-all duration-500 ease-in-out z-50 ${
      isOpen ? 'translate-x-0' : 'translate-x-full'
    }`} style={{ boxShadow: '-8px 0 0 rgba(0,0,0,0.8)' }}>
      <div className="p-6 h-full flex flex-col text-white">
        <div className="flex justify-between items-center mb-6 animate-slide-in-top">
          <h3 className="text-lg text-yellow-400 no-select">WORD LIST</h3>
          <button 
            onClick={handleClose}
            className="pixel-button p-2 bg-red-600 hover:bg-red-500 pixel-border text-white transition-smooth hover-scale cursor-pointer"
            style={{ boxShadow: '2px 2px 0 rgba(0,0,0,0.6)' }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="flex gap-2 mb-6 animate-slide-up animate-delay-100">
          {[4, 5, 6, 7].map((len, index) => (
            <button
              key={len}
              onClick={() => handleLengthChange(len)}
              className={`pixel-button px-3 py-2 text-xs font-bold transition-smooth pixel-border hover-scale ${
                selectedLength === len 
                  ? 'bg-yellow-400 text-gray-900' 
                  : 'bg-gray-700 text-white hover:bg-gray-600'
              }`}
              style={{ 
                boxShadow: '2px 2px 0 rgba(0,0,0,0.6)',
                animationDelay: `${(index + 1) * 0.1}s`
              }}
            >
              {len}
            </button>
          ))}
        </div>

        {/* 搜索框 */}
        <WordSearch 
          onSearch={handleSearch}
          placeholder={`Search ${selectedLength}-letter words...`}
        />

        {/* 顯示統計信息 */}
        {stats.total > 0 && (
          <div className="mb-4 p-2 bg-gray-800 pixel-border text-center text-xs animate-fade-in" style={{ boxShadow: '2px 2px 0 rgba(0,0,0,0.4)' }}>
            <div className="text-green-400 font-bold">
              {stats.isSearching ? (
                <>FOUND: {stats.displayed.toLocaleString()} MATCHES</>
              ) : (
                <>SHOWING: {stats.displayed.toLocaleString()} / {stats.total.toLocaleString()} WORDS</>
              )}
            </div>
            {!stats.isSearching && stats.displayed < stats.total && (
              <div className="text-yellow-400 mt-1">
                {((stats.displayed / stats.total) * 100).toFixed(1)}% LOADED
              </div>
            )}
            {stats.isSearching && searchTerm && (
              <div className="text-blue-400 mt-1">
                SEARCH: "{searchTerm}"
                <button 
                  onClick={clearSearch}
                  className="ml-2 text-red-400 hover:text-red-300 cursor-pointer"
                >
                  ✕
                </button>
              </div>
            )}
          </div>
        )}
        
        <div className="flex-1 overflow-y-auto bg-gray-800 p-4 pixel-border animate-fade-in-scale animate-delay-200" style={{ boxShadow: 'inset 4px 4px 0 rgba(0,0,0,0.5)' }}>
          {loading ? (
            <div className="text-center text-green-400 py-8 text-xs">
              <div className="animate-spin w-6 h-6 border-2 border-green-400 border-t-transparent rounded-full mx-auto mb-2"></div>
              LOADING...
            </div>
          ) : letterGroupsList.length > 0 ? (
            <div className="space-y-4">
              {letterGroupsList.map(({ letter, letterWords, totalWords, index, isSearchResult }) => (
                <LetterGroup
                  key={`${letter}-${isSearchResult ? 'search' : 'normal'}`}
                  letter={letter}
                  letterWords={letterWords}
                  totalWords={isSearchResult ? letterWords.length : totalWords}
                  onLoadMore={isSearchResult ? null : () => loadMoreWordsForLetter(letter)}
                  letterIndex={index}
                />
              ))}
              
              {/* 加載更多字母的按鈕 */}
              {hasMoreLetters && (
                <div className="text-center py-4">
                  <button
                    onClick={loadMoreLetters}
                    className="pixel-button px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold transition-smooth hover-scale cursor-pointer"
                    style={{ boxShadow: '2px 2px 0 rgba(0,0,0,0.6)' }}
                  >
                    LOAD MORE LETTERS ({letterGroups[selectedLength]?.letters.length - loadedLetters.size} LEFT)
                  </button>
                </div>
              )}
              
              <div className="text-center text-gray-500 text-xs mt-4 py-4 border-t-2 border-gray-700 animate-fade-in animate-delay-500">
                TOTAL: {stats.total.toLocaleString()} WORDS
              </div>
            </div>
          ) : stats.isSearching ? (
            <div className="text-center text-yellow-400 py-8 text-xs">
              NO MATCHES FOUND FOR "{searchTerm}"
            </div>
          ) : (
            <div className="text-center text-red-400 py-8 text-xs animate-error-shake">ERROR: CANNOT LOAD</div>
          )}
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 1. Home Page - Pixel Style
// ==========================================
const HomePage = ({ onSelectMode }) => {
  const [showWordList, setShowWordList] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [selectedLength, setSelectedLength] = useState(5);
  const { playSound, playBackgroundMusic, stopBackgroundMusic } = useAudio();

  // No longer manage music in HomePage - handled by App component
  useEffect(() => {
    // Set up user interaction handler for autoplay fallback
    const handleFirstInteraction = () => {
      console.log('First user interaction on homepage, ensuring music');
      playBackgroundMusic('homeMusic');
      // Remove listener after first interaction
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('keydown', handleFirstInteraction);
      document.removeEventListener('touchstart', handleFirstInteraction);
    };
    
    // Add listeners immediately
    document.addEventListener('click', handleFirstInteraction);
    document.addEventListener('keydown', handleFirstInteraction);
    document.addEventListener('touchstart', handleFirstInteraction);
    
    // Cleanup: remove listeners only
    return () => {
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('keydown', handleFirstInteraction);
      document.removeEventListener('touchstart', handleFirstInteraction);
    };
  }, []);

  const handleWordListToggle = () => {
    playSound('buttonClick');
    setShowWordList(true);
  };

  const handleWordListClose = () => {
    playSound('buttonCancel');
    setShowWordList(false);
  };

  const handleInstructionsToggle = () => {
    playSound('buttonClick');
    setShowInstructions(true);
  };

  const handleInstructionsClose = () => {
    playSound('buttonCancel');
    setShowInstructions(false);
  };

  const handleModeSelect = (mode) => {
    playSound('buttonClick');
    // Only stop music when going to single player mode
    // Keep music playing when going to competitive mode
    if (mode === 'single') {
      stopBackgroundMusic();
    }
    onSelectMode(mode);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 via-blue-900 to-indigo-900 flex flex-col items-center justify-center p-4 relative overflow-hidden animate-fade-in">
      
      {/* Pixel-style background dots */}
      <div className="absolute inset-0 opacity-10">
        <div className="w-full h-full" style={{
          backgroundImage: `
            radial-gradient(circle at 25% 25%, #fff 2px, transparent 2px),
            radial-gradient(circle at 75% 75%, #fff 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px'
        }}></div>
      </div>
      
      <div className={`transition-all duration-500 ease-in-out ${showWordList ? '-translate-x-48' : 'translate-x-0'} relative z-10`}>
        <div className="bg-gray-800 p-8 pixel-border text-white max-w-md w-full text-center animate-bounce-in" style={{
          boxShadow: '8px 8px 0px rgba(0,0,0,0.8)'
        }}>
          {/* Pixel-style title */}
          <div className="mb-8 animate-slide-in-top">
            <h1 className="text-4xl text-yellow-400 mb-2 animate-pulse">WORDLE+</h1>
            <div className="text-xs text-green-400 pixel-blink">PIXEL EDITION</div>
          </div>
          
          <div className="space-y-4">
            {/* Single Player Button */}
            <button 
              onClick={() => handleModeSelect('single')} 
              className="pixel-button w-full p-4 bg-blue-600 hover:bg-blue-500 text-white pixel-border transition-smooth flex items-center gap-4 text-left text-xs hover-lift animate-slide-up animate-delay-100"
              style={{ boxShadow: '4px 4px 0px rgba(0,0,0,0.6)' }}
            >
              <div className="w-8 h-8 bg-yellow-400 pixel-border flex items-center justify-center text-blue-900 transition-smooth hover-scale">
                <User size={16} />
              </div>
              <div>
                <h3 className="text-sm font-bold mb-1">SINGLE PLAYER</h3>
                <p className="text-xs text-blue-200">CLASSIC MODE<br />(4-7 LETTERS)</p>
              </div>
            </button>
            
            {/* Competitive Mode Button */}
            <button 
              onClick={() => handleModeSelect('competitive')} 
              className="pixel-button w-full p-4 bg-red-600 hover:bg-red-500 text-white pixel-border transition-smooth flex items-center gap-4 text-left text-xs hover-lift animate-slide-up animate-delay-200"
              style={{ boxShadow: '4px 4px 0px rgba(0,0,0,0.6)' }}
            >
              <div className="w-8 h-8 bg-yellow-400 pixel-border flex items-center justify-center text-red-900 transition-smooth hover-scale">
                <Swords size={16} />
              </div>
              <div>
                <h3 className="text-sm font-bold mb-1">COMPETITIVE</h3>
                <p className="text-xs text-red-200">CREATE OR JOIN ROOM</p>
              </div>
            </button>
            
            {/* Word List Button */}
            <button 
              onClick={handleWordListToggle}
              className="pixel-button w-full p-4 bg-green-600 hover:bg-green-500 text-white pixel-border transition-smooth flex items-center gap-4 text-left text-xs hover-lift animate-slide-up animate-delay-300"
              style={{ boxShadow: '4px 4px 0px rgba(0,0,0,0.6)' }}
            >
              <div className="w-8 h-8 bg-yellow-400 pixel-border flex items-center justify-center text-green-900 transition-smooth hover-scale">
                <Info size={16} />
              </div>
              <div>
                <h3 className="text-sm font-bold mb-1">WORD LIST</h3>
                <p className="text-xs text-green-200">VIEW AVAILABLE WORDS</p>
              </div>
            </button>
          </div>
          
          {/* Pixel-style version info */}
          <div className="mt-8 pt-6 border-t-2 border-gray-600 text-xs text-gray-400 animate-slide-up animate-delay-400">
            <div className="flex justify-center items-center gap-2">
              <div className="w-2 h-2 bg-green-400 animate-pulse"></div>
              <span>v2.1.0 • PIXEL EDITION</span>
              <div className="w-2 h-2 bg-green-400 animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Right top corner game instructions button */}
      <div className="fixed top-4 right-4 z-30 animate-slide-in-right animate-delay-300">
        <button 
          onClick={handleInstructionsToggle}
          className="pixel-button p-3 bg-orange-600 hover:bg-orange-500 text-white pixel-border transition-smooth hover-scale cursor-pointer"
          style={{ boxShadow: '4px 4px 0 rgba(0,0,0,0.8)' }}
          title="Game Instructions"
        >
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-xs font-bold">HELP</span>
          </div>
        </button>
      </div>

      {/* Right bottom corner links */}
      <div className="fixed bottom-4 right-4 z-30 animate-slide-in-right animate-delay-500">
        <div className="bg-gray-800 p-4 pixel-border text-white text-xs space-y-2" style={{ boxShadow: '4px 4px 0 rgba(0,0,0,0.8)' }}>
          <div className="text-yellow-400 font-bold mb-3 text-center">LINKS</div>
          
          {/* 前端遊戲網站 */}
          <a 
            href="https://garyHu951.github.io/wordle-game" 
            target="_blank" 
            rel="noopener noreferrer"
            className="pixel-button block p-2 bg-blue-600 hover:bg-blue-500 text-white pixel-border transition-smooth hover-scale cursor-pointer text-center"
            style={{ boxShadow: '2px 2px 0 rgba(0,0,0,0.6)' }}
          >
            🎮 GAME SITE
          </a>
          
          {/* 後端API */}
          <a 
            href="https://wordle-game-backend-v2.onrender.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="pixel-button block p-2 bg-green-600 hover:bg-green-500 text-white pixel-border transition-smooth hover-scale cursor-pointer text-center"
            style={{ boxShadow: '2px 2px 0 rgba(0,0,0,0.6)' }}
          >
            🔧 API
          </a>
          
          {/* GitHub源代碼 */}
          <a 
            href="https://github.com/garyHu951/wordle-game" 
            target="_blank" 
            rel="noopener noreferrer"
            className="pixel-button block p-2 bg-purple-600 hover:bg-purple-500 text-white pixel-border transition-smooth hover-scale cursor-pointer text-center"
            style={{ boxShadow: '2px 2px 0 rgba(0,0,0,0.6)' }}
          >
            📁 GITHUB
          </a>
          
          {/* 期末報告下載 */}
          <a 
            href="./Group25_Final_Project_Report-01157123+01257004.pdf" 
            download="(第25組) 期末專案成果-01157123+01257004.pdf"
            className="pixel-button block p-2 bg-red-600 hover:bg-red-500 text-white pixel-border transition-smooth hover-scale cursor-pointer text-center"
            style={{ boxShadow: '2px 2px 0 rgba(0,0,0,0.6)' }}
          >
            📄 REPORT
          </a>
        </div>
      </div>
      
      <WordListSidebar 
        isOpen={showWordList}
        onClose={handleWordListClose}
        selectedLength={selectedLength}
        onLengthChange={setSelectedLength}
      />
      
      <GameInstructionsModal 
        isOpen={showInstructions}
        onClose={handleInstructionsClose}
      />
      
      {/* Background overlay */}
      {(showWordList || showInstructions) && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 transition-opacity duration-500 animate-fade-in"
          onClick={showWordList ? handleWordListClose : handleInstructionsClose}
        />
      )}
    </div>
  );
};

// ==========================================
// 1.5. Letter Status Tracker Component - Pixel Style
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
    <div className="bg-gray-900 p-4 pixel-border w-full max-w-xs text-white animate-fade-in-scale" style={{ boxShadow: '4px 4px 0 rgba(0,0,0,0.8)' }}>
      <h3 className="text-yellow-400 font-bold mb-4 text-center text-sm animate-slide-in-top no-select">LETTER STATUS</h3>
      
      {correct.length > 0 && (
        <div className="mb-4 animate-slide-up animate-delay-100">
          <div className="text-green-400 text-xs font-bold mb-2 no-select">CORRECT</div>
          <div className="flex flex-wrap gap-2">
            {correct.map((letter, index) => (
              <div 
                key={letter} 
                className="w-8 h-8 bg-green-600 text-white pixel-border flex items-center justify-center text-xs font-bold transition-smooth hover-scale animate-bounce-in no-select cursor-help" 
                style={{ 
                  boxShadow: '2px 2px 0 rgba(0,0,0,0.6)',
                  animationDelay: `${index * 0.1}s`
                }}
              >
                {letter}
              </div>
            ))}
          </div>
        </div>
      )}

      {present.length > 0 && (
        <div className="mb-4 animate-slide-up animate-delay-200">
          <div className="text-yellow-400 text-xs font-bold mb-2 no-select">WRONG POS</div>
          <div className="flex flex-wrap gap-2">
            {present.map((letter, index) => (
              <div 
                key={letter} 
                className="w-8 h-8 bg-yellow-600 text-white pixel-border flex items-center justify-center text-xs font-bold transition-smooth hover-scale animate-fade-in no-select cursor-help" 
                style={{ 
                  boxShadow: '2px 2px 0 rgba(0,0,0,0.6)',
                  animationDelay: `${index * 0.1}s`
                }}
              >
                {letter}
              </div>
            ))}
          </div>
        </div>
      )}

      {absent.length > 0 && (
        <div className="mb-4 animate-slide-up animate-delay-300">
          <div className="text-gray-400 text-xs font-bold mb-2 no-select">NOT FOUND</div>
          <div className="flex flex-wrap gap-2">
            {absent.map((letter, index) => (
              <div 
                key={letter} 
                className="w-8 h-8 bg-gray-600 text-gray-300 pixel-border flex items-center justify-center text-xs font-bold transition-smooth hover-scale animate-fade-in no-select cursor-help" 
                style={{ 
                  boxShadow: '2px 2px 0 rgba(0,0,0,0.6)',
                  animationDelay: `${index * 0.05}s`
                }}
              >
                {letter}
              </div>
            ))}
          </div>
        </div>
      )}

      {correct.length === 0 && present.length === 0 && absent.length === 0 && (
        <div className="text-center text-gray-500 py-8 text-xs animate-pulse no-select">
          START GUESSING
        </div>
      )}
    </div>
  );
};

// ==========================================
// 1.7. Result Modal Component - Pixel Style
// ==========================================
const ResultModal = ({ show, type, mode = 'competitive' }) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-gray-900 p-8 pixel-border text-center text-white animate-modal-slide-in" style={{ boxShadow: '8px 8px 0 rgba(0,0,0,0.8)' }}>
        {type === 'win' ? (
          <>
            <div className="text-4xl mb-4 animate-success-bounce">🏆</div>
            <h2 className="text-xl font-bold text-green-400 mb-2 animate-slide-up">VICTORY!</h2>
            <p className="text-gray-300 text-xs animate-fade-in animate-delay-200">
              {mode === 'single' ? 'CLICK NEW GAME TO PLAY AGAIN' : 'NEXT ROUND...'}
            </p>
          </>
        ) : (
          <>
            <div className="text-4xl mb-4 animate-error-shake">💀</div>
            <h2 className="text-xl font-bold text-red-400 mb-2 animate-slide-up">DEFEAT!</h2>
            <p className="text-gray-300 text-xs animate-fade-in animate-delay-200">
              {mode === 'single' ? 'CLICK NEW GAME TO TRY AGAIN' : 'NEXT ROUND...'}
            </p>
          </>
        )}
      </div>
    </div>
  );
};

// ==========================================
// 2. Single Player Mode
// ==========================================
const SinglePlayerGame = ({ onBack }) => {
  const [gameId, setGameId] = useState(null);
  const [wordLength, setWordLength] = useState(5);
  const [maxGuesses, setMaxGuesses] = useState(6); // Fixed to 6 guesses
  const [guesses, setGuesses] = useState([]);
  const [currentGuess, setCurrentGuess] = useState('');
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [serverConnected, setServerConnected] = useState(false);
  const [remainingGuesses, setRemainingGuesses] = useState(6); // Fixed to 6 guesses
  const [showResultModal, setShowResultModal] = useState(false);
  const [resultModalType, setResultModalType] = useState(''); // 'win' or 'lose'
  const [isPaused, setIsPaused] = useState(false);
  const [pauseCountdown, setPauseCountdown] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false); // 答案顯示狀態
  const [currentAnswer, setCurrentAnswer] = useState(''); // 當前答案
  const { playSound, playBackgroundMusic, stopBackgroundMusic } = useAudio();

  useEffect(() => { checkServerHealth(); }, []);
  useEffect(() => { if (serverConnected) startNewGame(wordLength); }, [serverConnected, wordLength]);

  // Start single player background music when component mounts
  useEffect(() => {
    playBackgroundMusic('singlePlayerMusic'); // Use dedicated single player music
    
    // Cleanup: stop music when component unmounts
    return () => {
      stopBackgroundMusic();
    };
  }, []);

  const checkServerHealth = async () => {
    try { const res = await fetch(`${API_URL}/health`); if (res.ok) setServerConnected(true); } catch { setServerConnected(false); setMessage('ERROR: NO SERVER'); }
  };
  
  const startNewGame = async (length = 5) => {
    playSound('buttonClick');
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/game/new`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ length }), });
      const data = await response.json();
      console.log('Game creation response:', data); // 調試日誌
      if (data.success) { 
        setGameId(data.gameId); 
        console.log('Game ID set to:', data.gameId); // 調試日誌 
        setGuesses([]); 
        setCurrentGuess(''); 
        setGameOver(false); 
        setWon(false); 
        setMessage(''); 
        setMaxGuesses(6); // Always use 6 guesses
        setRemainingGuesses(6); // Always use 6 guesses
        setShowResultModal(false);
        setResultModalType('');
        setShowAnswer(false); // 重置答案顯示
        setCurrentAnswer(''); // 清空當前答案
      } else { 
        setMessage(data.error); 
      }
    } catch (e) { 
      setMessage('ERROR: CONNECTION FAILED'); 
    }
    setLoading(false);
  };
  
  const handleKeyPress = async (key) => {
    if (gameOver || loading || !serverConnected || isPaused || pauseCountdown > 0) return;
    
    if (key === 'ENTER') {
      if (currentGuess.length !== wordLength) { 
        playSound('buttonCancel');
        setMessage(`NEED ${wordLength} LETTERS`); 
        setTimeout(() => setMessage(''), 1500); 
        return; 
      }
      
      // Check for duplicate word input
      const isDuplicate = guesses.some(guess => guess.word === currentGuess);
      if (isDuplicate) {
        playSound('buttonCancel');
        setMessage('WORD ALREADY GUESSED!');
        setTimeout(() => setMessage(''), 1500);
        return;
      }
      
      playSound('buttonClick');
      setLoading(true);
      try {
        const response = await fetch(`${API_URL}/game/${gameId}/guess`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ guess: currentGuess }), });
        const data = await response.json();
        
        // 檢查不雅詞彙檢測
        if (data.profanityDetected) {
          alert(data.message);
          // 開啟新頁面播放 RickRoll
          window.open(data.url, '_blank');
          // 強制結束遊戲
          setGameOver(true);
          setMessage(data.message);
          setLoading(false);
          return;
        }
        
        // 檢查特殊詞彙檢測 (rickrol)
        if (data.specialWordDetected) {
          alert(data.message);
          // 開啟新頁面播放特殊 RickRoll
          window.open(data.url, '_blank');
          // 暫停遊戲
          setIsPaused(true);
          setMessage(data.message);
          setLoading(false);
          return;
        }
        
        if (data.success) { 
          const newGuesses = data.guesses;
          const latestGuess = newGuesses[newGuesses.length - 1];
          
          setGuesses(newGuesses); 
          setRemainingGuesses(data.remainingGuesses); 
          setCurrentGuess(''); 
          
          // Play single cell sound effect based on word result priority
          setTimeout(() => {
            const hasCorrect = latestGuess.result.includes('correct');
            const hasPresent = latestGuess.result.includes('present');
            
            if (hasCorrect) {
              playSound('correctCell'); // Green sound if any correct letters
            } else if (hasPresent) {
              playSound('presentCell'); // Yellow sound if any present letters (but no correct)
            } else {
              playSound('absentCell'); // Gray sound if all letters are absent
            }
          }, 200);
          
          // Add cell animations
          setTimeout(() => {
            const currentRowIndex = newGuesses.length - 1;
            console.log(`Triggering DOM animation for row ${currentRowIndex} in single player`);
            
            const gridContainer = document.querySelector('.space-y-2');
            if (gridContainer) {
              const rows = gridContainer.children;
              const targetRow = rows[currentRowIndex];
              
              if (targetRow) {
                const cellsInRow = targetRow.querySelectorAll('.wordle-cell');
                console.log(`Found ${cellsInRow.length} cells in row ${currentRowIndex}`);
                
                for (let j = 0; j < latestGuess.word.length && j < cellsInRow.length; j++) {
                  const cell = cellsInRow[j];
                  
                  if (cell) {
                    // Remove existing animation classes
                    cell.classList.remove('animate-strong-impact', 'animate-medium-impact', 'animate-weak-impact');
                    
                    // Force repaint
                    cell.offsetHeight;
                    
                    // Add corresponding animation based on result
                    let animationClass = '';
                    if (latestGuess.result[j] === 'correct') {
                      animationClass = 'animate-strong-impact';
                    } else if (latestGuess.result[j] === 'present') {
                      animationClass = 'animate-medium-impact';
                    } else {
                      animationClass = 'animate-weak-impact';
                    }
                    
                    console.log(`Adding ${animationClass} to cell ${j} in row ${currentRowIndex}`);
                    cell.classList.add(animationClass);
                    
                    // Remove class after animation completes
                    setTimeout(() => {
                      cell.classList.remove(animationClass);
                    }, 1000);
                  }
                }
              }
            }
          }, 300);
          
          if (data.won) { 
            setTimeout(() => {
              playSound('scoreIncrease');
            }, latestGuess.result.length * 100 + 500);
            setWon(true); 
            setGameOver(true); 
            setResultModalType('win');
            setShowResultModal(true);
            setCurrentAnswer(data.answer); // 保存答案
            setMessage('VICTORY! ' + data.message); 
            
            // Auto-hide modal after 3 seconds
            setTimeout(() => {
              setShowResultModal(false);
            }, 3000);
          } else if (data.gameOver) { 
            setGameOver(true); 
            setResultModalType('lose');
            setShowResultModal(true);
            setCurrentAnswer(data.answer); // 保存答案
            setMessage(data.message); 
            
            // Auto-hide modal after 3 seconds
            setTimeout(() => {
              setShowResultModal(false);
            }, 3000);
          } 
        } else { 
          playSound('buttonCancel');
          setMessage(data.error); 
          setTimeout(() => setMessage(''), 2000); 
        }
      } catch (e) { 
        playSound('buttonCancel');
        setMessage('SUBMIT FAILED'); 
      }
      setLoading(false);
    } else if (key === 'BACKSPACE') { 
      if (currentGuess.length > 0) {
        playSound('buttonCancel');
      }
      setCurrentGuess(prev => prev.slice(0, -1)); 
    } else if (currentGuess.length < wordLength && /^[A-Z]$/.test(key)) { 
      playSound('buttonClick');
      setCurrentGuess(prev => prev + key); 
    }
  };
  
  // Add pause/resume handlers for single player
  const handleSinglePlayerPause = () => {
    if (!isPaused && !gameOver) {
      playSound('buttonClick');
      setIsPaused(true);
      setMessage('GAME PAUSED - Click START to resume');
    }
  };

  const handleSinglePlayerResume = () => {
    if (isPaused) {
      playSound('buttonClick');
      // 3 second countdown
      let countdown = 3;
      setPauseCountdown(countdown);
      setMessage(`RESUMING IN ${countdown}...`);
      
      const countdownInterval = setInterval(() => {
        countdown--;
        if (countdown > 0) {
          setPauseCountdown(countdown);
          setMessage(`RESUMING IN ${countdown}...`);
        } else {
          clearInterval(countdownInterval);
          setIsPaused(false);
          setPauseCountdown(0);
          setMessage('GAME RESUMED!');
          setTimeout(() => setMessage(''), 1000);
        }
      }, 1000);
    }
  };

  // 顯示答案功能 - 從API獲取答案
  const handleShowAnswer = async () => {
    if (!gameId) return;
    
    playSound('buttonClick');
    
    if (showAnswer) {
      // 如果已經顯示，則隱藏
      setShowAnswer(false);
    } else {
      // 如果未顯示，則從API獲取答案
      try {
        const response = await fetch(`${API_URL}/game/${gameId}/answer`);
        const data = await response.json();
        
        if (data.success) {
          setCurrentAnswer(data.answer);
          setShowAnswer(true);
        } else {
          setMessage('Failed to get answer');
          setTimeout(() => setMessage(''), 2000);
        }
      } catch (error) {
        console.error('Error fetching answer:', error);
        setMessage('Error getting answer');
        setTimeout(() => setMessage(''), 2000);
      }
    }
  };
  
  useEffect(() => {
    const handleKeyDown = (e) => { 
      if (isPaused || pauseCountdown > 0) return;
      
      if (e.key === 'Enter') handleKeyPress('ENTER'); 
      else if (e.key === 'Backspace') handleKeyPress('BACKSPACE'); 
      else if (/^[a-zA-Z]$/.test(e.key)) handleKeyPress(e.key.toUpperCase()); 
    };
    window.addEventListener('keydown', handleKeyDown); 
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentGuess, gameOver, loading, isPaused, pauseCountdown]);

  const handleBack = () => {
    playSound('buttonCancel');
    stopBackgroundMusic(); // Stop single player music
    onBack();
  };

  const handleWordLengthChange = (len) => {
    if (!loading) {
      playSound('buttonClick');
      setWordLength(len);
    }
  };

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
        <div key={i} className={`flex gap-1 justify-center animate-slide-up`} style={{ animationDelay: `${i * 0.1}s` }}>
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
            return <div key={j} className={`wordle-cell w-12 h-12 text-lg flex items-center justify-center font-bold ${style} transition-smooth hover-scale no-select cursor-help`} style={{ boxShadow: '2px 2px 0 rgba(0,0,0,0.6)' }}>{letter}</div>;
          })}
        </div>
      );
    }
    return rows;
  };
  
  const keys = [['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'], ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'], ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'BACKSPACE']];

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 via-blue-900 to-indigo-900 flex flex-col items-center py-8 px-4 animate-slide-in-right">
      
      <div className="max-w-6xl w-full flex flex-col lg:flex-row gap-6 items-start animate-bounce-in">
        {/* Main game area */}
        <div className="flex-1 w-full bg-gray-900 p-6 pixel-border text-white relative" style={{ boxShadow: '8px 8px 0 rgba(0,0,0,0.8)' }}>
          <button onClick={handleBack} className="pixel-button absolute top-6 left-6 p-2 bg-red-600 hover:bg-red-500 pixel-border transition-smooth hover-scale cursor-pointer" style={{ boxShadow: '2px 2px 0 rgba(0,0,0,0.6)' }} title="Back">
            <ArrowLeft size={16} />
          </button>
          
          <header className="flex flex-col items-center mb-6 border-b-2 border-gray-700 pb-4 animate-slide-in-top">
            <h1 className="text-xl font-bold text-yellow-400 no-select">SINGLE PLAYER</h1>
          </header>
          
          <div className="flex justify-center gap-2 mb-6 animate-slide-up animate-delay-100">
            {[4, 5, 6, 7].map((len, index) => (
              <button 
                key={len} 
                onClick={() => handleWordLengthChange(len)} 
                className={`pixel-button px-3 py-2 font-bold transition-smooth text-xs pixel-border hover-scale animate-fade-in ${
                  wordLength === len ? 'bg-yellow-400 text-gray-900' : 'bg-gray-700 text-white hover:bg-gray-600'
                }`}
                style={{ 
                  boxShadow: '2px 2px 0 rgba(0,0,0,0.6)',
                  animationDelay: `${(index + 1) * 0.1}s`
                }}
              >
                {len}
              </button>
            ))}
          </div>
          
          {message && (
            <div className={`mb-4 p-3 pixel-border text-center font-bold text-xs animate-modal-slide-in ${
              message.includes('VICTORY') ? 'bg-green-600 text-white animate-success-bounce' : 
              message.includes('ERROR') || message.includes('ALREADY') ? 'bg-red-600 text-white animate-error-shake' : 
              'bg-blue-600 text-white animate-pulse'
            }`} style={{ boxShadow: '2px 2px 0 rgba(0,0,0,0.6)' }}>
              {message}
            </div>
          )}
          
          <div className="space-y-2 mb-8 select-none animate-fade-in-scale animate-delay-200">{renderGrid()}</div>
          
          {/* 答案顯示區域 */}
          {showAnswer && currentAnswer && (
            <div className="mb-6 p-4 bg-gray-800 pixel-border text-center animate-modal-slide-in" style={{ boxShadow: '4px 4px 0 rgba(0,0,0,0.8)' }}>
              <div className="text-sm text-gray-400 mb-2">ANSWER</div>
              <div className="text-2xl font-bold text-yellow-400 tracking-wider">{currentAnswer}</div>
            </div>
          )}
          
          <div className="flex flex-col gap-2 w-full animate-slide-in-bottom animate-delay-300">
            {keys.map((row, i) => (
              <div key={i} className="flex gap-1 justify-center w-full">
                {row.map((key, keyIndex) => (
                  <button 
                    key={key} 
                    onClick={() => handleKeyPress(key)} 
                    className={`pixel-button h-10 font-bold text-xs transition-smooth flex items-center justify-center pixel-border hover-scale animate-fade-in cursor-pointer ${
                      key === 'ENTER' || key === 'BACKSPACE' ? 'flex-[1.5] text-xs' : 'flex-1'
                    } ${getKeyColor(key)}`}
                    style={{ 
                      boxShadow: '2px 2px 0 rgba(0,0,0,0.6)',
                      animationDelay: `${(i * 0.1) + (keyIndex * 0.02)}s`
                    }}
                  >
                    {key === 'BACKSPACE' ? '⌫' : key}
                  </button>
                ))}
              </div>
            ))}
          </div>
          
          <div className="flex gap-2 mt-8 w-full">
            <button 
              onClick={isPaused ? handleSinglePlayerResume : handleSinglePlayerPause}
              disabled={gameOver}
              className={`pixel-button flex-1 py-3 bg-yellow-600 hover:bg-yellow-500 text-white font-bold flex items-center justify-center gap-2 pixel-border transition-smooth hover-lift animate-slide-up animate-delay-400 cursor-pointer ${gameOver ? 'opacity-50 cursor-not-allowed' : ''}`}
              style={{ boxShadow: '4px 4px 0 rgba(0,0,0,0.6)' }}
            >
              ⏸️ PAUSE
            </button>
            {gameId && (
              <button 
                onClick={handleShowAnswer}
                className={`pixel-button flex-1 py-3 ${showAnswer ? 'bg-red-600 hover:bg-red-500' : 'bg-blue-600 hover:bg-blue-500'} text-white font-bold flex items-center justify-center gap-2 pixel-border transition-smooth hover-lift animate-slide-up animate-delay-450 cursor-pointer`}
                style={{ boxShadow: '4px 4px 0 rgba(0,0,0,0.6)' }}
              >
                {showAnswer ? '🙈 HIDE ANSWER' : '👁️ SHOW ANSWER'}
              </button>
            )}
            {/* 調試信息 - 臨時添加 */}
            {!gameId && (
              <div className="text-xs text-red-400 p-2">
                Debug: gameId is {gameId ? gameId : 'null'}
              </div>
            )}
            <button 
              onClick={() => startNewGame(wordLength)} 
              className="pixel-button flex-1 py-3 bg-green-600 hover:bg-green-500 text-white font-bold flex items-center justify-center gap-2 pixel-border transition-smooth hover-lift animate-slide-up animate-delay-500 cursor-pointer"
              style={{ boxShadow: '4px 4px 0 rgba(0,0,0,0.6)' }}
            >
              <RotateCcw size={16}/> NEW GAME
            </button>
          </div>
        </div>
        
        {/* Right side: Letter status */}
        <div className="flex-shrink-0 w-full lg:w-auto animate-slide-in-right animate-delay-500">
          <LetterStatusTracker guesses={guesses} />
        </div>
      </div>
      
      {/* Pause overlay for single player */}
      {(isPaused || pauseCountdown > 0) && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-gray-900 p-8 pixel-border text-center text-white animate-modal-slide-in" style={{ boxShadow: '8px 8px 0 rgba(0,0,0,0.8)' }}>
            {pauseCountdown > 0 ? (
              <>
                <div className="text-4xl mb-4 animate-bounce">⏰</div>
                <h2 className="text-xl font-bold text-yellow-400 mb-2">RESUMING IN</h2>
                <div className="text-6xl font-bold text-green-400 animate-pulse">{pauseCountdown}</div>
              </>
            ) : (
              <>
                <div className="text-4xl mb-4">⏸️</div>
                <h2 className="text-xl font-bold text-yellow-400 mb-2">GAME PAUSED</h2>
                <p className="text-gray-300 text-xs mb-4">Click START to continue</p>
                <button 
                  onClick={handleSinglePlayerResume}
                  className="pixel-button px-6 py-3 bg-green-600 hover:bg-green-500 text-white font-bold transition-smooth pixel-border text-sm hover-scale cursor-pointer"
                  style={{ boxShadow: '4px 4px 0 rgba(0,0,0,0.6)' }}
                >
                  ▶️ START
                </button>
              </>
            )}
          </div>
        </div>
      )}
      
      {/* Result Modal */}
      <ResultModal show={showResultModal} type={resultModalType} mode="single" />
    </div>
  );
};

// ==========================================
// 3. Competitive Mode
// ==========================================
const CompetitiveMode = ({ onBack }) => {
  const [socket, setSocket] = useState(null);
  const [viewState, setViewState] = useState('lobby');
  const { playSound, playBackgroundMusic, stopBackgroundMusic } = useAudio();

  // Ensure animation CSS is loaded
  useEffect(() => {
    ensureAnimationStyles();
  }, []);

  // Music is now managed by App component - no need to manage here
  
  // Lobby 
  const [roomCode, setRoomCode] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [selectedLength, setSelectedLength] = useState(5);
  const [errorMessage, setErrorMessage] = useState('');

  // Game stage
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
  const [resumeCountdown, setResumeCountdown] = useState(0);
  const [skipAnswerModal, setSkipAnswerModal] = useState({ show: false, answer: '', round: 0, playerName: '' });

  // Scoreboard
  const [guesses, setGuesses] = useState([]);
  const [currentGuess, setCurrentGuess] = useState('');
  const [roundWinner, setRoundWinner] = useState(null);
  const [animatingRow, setAnimatingRow] = useState(-1); // Track animating row
  const [animatedCells, setAnimatedCells] = useState(new Set()); // Track animated cells
  const [guessHistory, setGuessHistory] = useState([]); // All guess history
  const [showResultModal, setShowResultModal] = useState(false);
  const [resultModalType, setResultModalType] = useState(''); // 'win' or 'lose'
  const [currentAnswer, setCurrentAnswer] = useState(''); // Current round answer
  const [showAnswer, setShowAnswer] = useState(false); // Show answer toggle

  useEffect(() => {
    // Create socket connection function
    const createSocket = () => {
      const newSocket = io(SOCKET_URL);
      setSocket(newSocket);

      newSocket.on('room_created', ({ roomCode }) => {
        setRoomCode(roomCode);
        setViewState('waiting');
      });

      newSocket.on('game_start', ({ wordLength, players }) => {
        playSound('battleStart');
        playBackgroundMusic('battleMusic');
        setWordLength(wordLength);
        setPlayers(players);
        setGameStartCountdown(3);
        setViewState('countdown');
        
        // 3 second countdown
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
        setCanSkip(true); // Can skip anytime
        setShowResultModal(false);
        setAnimatingRow(-1);
        setAnimatedCells(new Set()); // Reset animation tracking
        setShowAnswer(false); // Reset answer display
        setCurrentAnswer(''); // Clear current answer
        
        // Focus on input after new round starts
        setTimeout(() => {
          const gameContainer = document.querySelector('.space-y-2');
          if (gameContainer) {
            gameContainer.focus();
          }
        }, 100);
      });

      // Add new socket event handlers for pause/resume and skip answer
      newSocket.on('round_skipped_answer', ({ answer, round, playerName }) => {
        setSkipAnswerModal({ show: true, answer, round, playerName });
        setTimeout(() => {
          setSkipAnswerModal({ show: false, answer: '', round: 0, playerName: '' });
        }, 2000);
      });

      newSocket.on('game_paused', ({ message, pausedBy }) => {
        setIsPaused(true);
        setErrorMessage(message);
        setTimeout(() => setErrorMessage(''), 2000);
      });

      newSocket.on('resume_countdown', ({ countdown }) => {
        setResumeCountdown(countdown);
      });

      newSocket.on('game_resumed', ({ message }) => {
        setIsPaused(false);
        setResumeCountdown(0);
        setErrorMessage(message);
        setTimeout(() => setErrorMessage(''), 2000);
      });

      newSocket.on('guess_error', (message) => {
        setErrorMessage(message);
        setTimeout(() => setErrorMessage(''), 2000);
      });



      newSocket.on('player_left', ({ message }) => {
        setErrorMessage(message);
        // Switch back to home music when opponent leaves
        playBackgroundMusic('homeMusic');
        setTimeout(() => {
          setViewState('lobby');
          setRoomCode('');
        }, 3000);
      });

      newSocket.on('hint_reveal', (hint) => {
        setHints(prev => [...prev, hint]);
        setPotentialPoints(hint.currentPoints);
      });

      // 處理不雅詞彙檢測
      newSocket.on('profanity_detected', ({ message, url, title }) => {
        alert(message);
        // 開啟新頁面播放 RickRoll
        window.open(url, '_blank');
        // 返回主頁
        setTimeout(() => {
          resetGameState();
          onBack();
        }, 1000);
      });

      // 處理對手被踢出
      newSocket.on('opponent_kicked', ({ message }) => {
        setErrorMessage(message);
        setTimeout(() => {
          resetGameState();
          onBack();
        }, 3000);
      });

      // 處理特殊詞彙檢測 (rickrol)
      newSocket.on('special_word_detected', ({ message, url, title }) => {
        alert(message);
        // 開啟新頁面播放特殊 RickRoll
        window.open(url, '_blank');
      });

      newSocket.on('guess_result', ({ guess, result, isCorrect, gameOver }) => {
        // Play single cell sound effect based on word result priority
        setTimeout(() => {
          const hasCorrect = result.includes('correct');
          const hasPresent = result.includes('present');
          
          if (hasCorrect) {
            playSound('correctCell'); // Green sound if any correct letters
          } else if (hasPresent) {
            playSound('presentCell'); // Yellow sound if any present letters (but no correct)
          } else {
            playSound('absentCell'); // Gray sound if all letters are absent
          }
        }, 200);
        
        // Update guesses first
        setGuesses(prev => {
          const newGuesses = [...prev, { word: guess, result }];
          const currentRowIndex = newGuesses.length - 1; // Calculate row index using updated length
          
          // Trigger animation after state update
          setTimeout(() => {
            console.log(`Triggering DOM animation for row ${currentRowIndex}`);
            console.log(`Total guesses after update: ${newGuesses.length}`);
            
            // Use more precise method to find corresponding row cells
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
                    // Remove existing animation classes
                    cell.classList.remove('animate-strong-impact', 'animate-medium-impact', 'animate-weak-impact');
                    
                    // Force repaint
                    cell.offsetHeight;
                    
                    // Add corresponding animation based on result
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
                    
                    // Remove class after animation completes
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
        setCurrentGuess(''); // Clear input box
        
        // Check if guessed correctly or game over
        if (isCorrect) {
          setTimeout(() => {
            playSound('scoreIncrease');
          }, result.length * 100 + 500);
          setResultModalType('win');
          setShowResultModal(true);
          setTimeout(() => {
            setShowResultModal(false);
            // Backend will automatically start next round
          }, 1000);
        } else if (gameOver) {
          setResultModalType('lose');
          setShowResultModal(true);
          setTimeout(() => {
            setShowResultModal(false);
            // Backend will automatically start next round
          }, 1000);
        }
      });

      newSocket.on('guess_error', (msg) => {
        setErrorMessage(msg);
        setTimeout(() => setErrorMessage(''), 1500);
      });

      // Add: Opponent won notification
      newSocket.on('opponent_won_round', ({ opponentName, word, points, viewedAnswer }) => {
        const answerInfo = viewedAnswer ? ' (ANSWER VIEWED, 0 PTS)' : '';
        setErrorMessage(`🎉 OPPONENT WON! Answer: "${word}" (+${points} PTS)${answerInfo}`);
        setTimeout(() => setErrorMessage(''), 3000);
      });

      newSocket.on('round_winner', (data) => {
        // Only update scores, don't affect current player's game flow
        setPlayers(data.updatedPlayers);
        
        // 如果獲勝者查看了答案，顯示相關信息
        if (data.viewedAnswer && data.winnerId === newSocket.id) {
          setMessage('🏆 ROUND WON! BUT 0 PTS (ANSWER VIEWED)');
          setTimeout(() => setMessage(''), 3000);
        }
        
        // Check if anyone reached 30 points
        const myScore = data.updatedPlayers[newSocket.id]?.score || 0;
        const opponentId = Object.keys(data.updatedPlayers).find(id => id !== newSocket.id);
        const opponentScore = data.updatedPlayers[opponentId]?.score || 0;
        
        if (myScore >= 30 || opponentScore >= 30) {
          setTimeout(() => {
            const winner = myScore >= 30 ? newSocket.id : opponentId;
            setWinnerInfo(winner);
            setViewState('gameOver');
            // Switch back to home music when game ends
            playBackgroundMusic('homeMusic');
          }, 2000);
        }
      });

      newSocket.on('game_over', (data) => {
        setPlayers(data.players);
        setWinnerInfo(data.winner);
        setViewState('gameOver');
        // Switch back to home music when game is over
        playBackgroundMusic('homeMusic');
      });
      
      newSocket.on('error_message', (msg) => {
          setErrorMessage(msg);
      });

      newSocket.on('current_answer', ({ answer, scoreWarning }) => {
        setCurrentAnswer(answer);
        setShowAnswer(true);
        
        // 如果有得分警告，顯示提示信息
        if (scoreWarning) {
          setMessage('⚠️ ANSWER VIEWED! ROUND SCORE: 0 PTS');
          setTimeout(() => setMessage(''), 3000);
        }
      });

      return newSocket;
    };

    // Initial socket creation
    const initialSocket = createSocket();
    
    // Cleanup function
    return () => {
      if (initialSocket) {
        initialSocket.close();
      }
    };
  }, []);

  const createRoom = () => {
    if (!socket) return;
    playSound('buttonClick');
    socket.emit('create_room', { wordLength: selectedLength });
  };

  const joinRoom = () => {
    if (!socket || joinCode.length !== 6) {
        playSound('buttonCancel');
        setErrorMessage('Please enter a 6-character code');
        return;
    }
    playSound('buttonClick');
    setRoomCode(joinCode);
    socket.emit('join_room', { roomCode: joinCode });
  };

  const exitGame = () => {
    playSound('buttonCancel');
    // Switch back to home music immediately when user exits
    playBackgroundMusic('homeMusic');
    if (socket) {
      socket.emit('leave_room', { roomCode });
      socket.disconnect();
    }
    resetGameState();
  };

  const resetGameState = () => {
    // Switch back to home music when resetting game state
    playBackgroundMusic('homeMusic');
    
    // Reset all states
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
    setShowAnswer(false); // Reset answer display
    setCurrentAnswer(''); // Clear current answer
    
    // Re-establish socket connection
    const newSocket = io(SOCKET_URL);
    setSocket(newSocket);

    // Re-bind all event listeners
    newSocket.on('room_created', ({ roomCode }) => {
      setRoomCode(roomCode);
      setViewState('waiting');
    });

    newSocket.on('game_start', ({ wordLength, players }) => {
      playSound('battleStart');
      playBackgroundMusic('battleMusic');
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
      console.log('new_round event received:', data);
      console.log('Current showResultModal before reset:', showResultModal);
      
      // 立即重置關鍵狀態以確保鍵盤輸入不被阻塞
      setShowResultModal(false); // 立即重置結果模態框
      setRoundWinner(null);
      setResultModalType(''); // 重置模態框類型
      
      // 延遲一點時間重置其他狀態
      setTimeout(() => {
        console.log('Resetting remaining states after new_round delay');
        setMyRound(data.myRound);
        setOpponentRound(data.opponentRound);
        setPotentialPoints(5);
        setHints([]);
        setGuesses([]);
        setCurrentGuess('');
        setErrorMessage('');
        setCanSkip(true);
        setAnimatedCells(new Set()); // Reset animation tracking
        setShowAnswer(false); // Reset answer display
        setCurrentAnswer(''); // Clear current answer
        console.log('All states reset');
      }, 500); // 給玩家0.5秒時間看結果
    });

    newSocket.on('player_left', ({ message }) => {
      setErrorMessage(message);
      // Switch back to home music when opponent leaves
      playBackgroundMusic('homeMusic');
      setTimeout(() => {
        resetGameState();
      }, 3000);
    });

    newSocket.on('hint_reveal', (hint) => {
      setHints(prev => [...prev, hint]);
      setPotentialPoints(hint.currentPoints);
    });

    // 處理不雅詞彙檢測
    newSocket.on('profanity_detected', ({ message, url, title }) => {
      alert(message);
      // 開啟新頁面播放 RickRoll
      window.open(url, '_blank');
      // 返回主頁
      setTimeout(() => {
        resetGameState();
        onBack();
      }, 1000);
    });

    // 處理對手被踢出
    newSocket.on('opponent_kicked', ({ message }) => {
      setErrorMessage(message);
      setTimeout(() => {
        resetGameState();
        onBack();
      }, 3000);
    });

    // 處理特殊詞彙檢測 (rickrol)
    newSocket.on('special_word_detected', ({ message, url, title }) => {
      alert(message);
      // 開啟新頁面播放特殊 RickRoll
      window.open(url, '_blank');
    });

    newSocket.on('guess_result', ({ guess, result, isCorrect, gameOver }) => {
      // Play single cell sound effect based on word result priority
      setTimeout(() => {
        const hasCorrect = result.includes('correct');
        const hasPresent = result.includes('present');
        
        if (hasCorrect) {
          playSound('correctCell'); // Green sound if any correct letters
        } else if (hasPresent) {
          playSound('presentCell'); // Yellow sound if any present letters (but no correct)
        } else {
          playSound('absentCell'); // Gray sound if all letters are absent
        }
      }, 200);
      
      // Update guesses first
      setGuesses(prev => {
        const newGuesses = [...prev, { word: guess, result }];
        const currentRowIndex = newGuesses.length - 1; // Calculate row index using updated length
        
        // Trigger animation after state update
        setTimeout(() => {
          console.log(`Triggering DOM animation for row ${currentRowIndex} (reset)`);
          console.log(`Total guesses after update: ${newGuesses.length} (reset)`);
          
          // Use more precise method to find corresponding row cells
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
                  // Remove existing animation classes
                  cell.classList.remove('animate-strong-impact', 'animate-medium-impact', 'animate-weak-impact');
                  
                  // Force repaint
                  cell.offsetHeight;
                  
                  // Add corresponding animation based on result
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
                  
                  // Remove class after animation completes
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
      
      // Check if guessed correctly or game over
      if (isCorrect) {
        setTimeout(() => {
          playSound('scoreIncrease');
        }, result.length * 100 + 500);
        setResultModalType('win');
        setShowResultModal(true);
        // 移除自動隱藏，讓 new_round 事件來重置狀態
      } else if (gameOver) {
        setResultModalType('lose');
        setShowResultModal(true);
        // 移除自動隱藏，讓 new_round 事件來重置狀態
      }
    });

    newSocket.on('guess_error', (msg) => {
      setErrorMessage(msg);
      setTimeout(() => setErrorMessage(''), 1500);
    });

    // Add: Opponent won notification
    newSocket.on('opponent_won_round', ({ opponentName, word, points, viewedAnswer }) => {
      const answerInfo = viewedAnswer ? ' (ANSWER VIEWED, 0 PTS)' : '';
      setErrorMessage(`🎉 OPPONENT WON! Answer: "${word}" (+${points} PTS)${answerInfo}`);
      setTimeout(() => setErrorMessage(''), 3000);
    });

    newSocket.on('round_winner', (data) => {
      // Only update scores, don't affect current player's game flow
      setPlayers(data.updatedPlayers);
      
      // 如果獲勝者查看了答案，顯示相關信息
      if (data.viewedAnswer && data.winnerId === socket.id) {
        setMessage('🏆 ROUND WON! BUT 0 PTS (ANSWER VIEWED)');
        setTimeout(() => setMessage(''), 3000);
      }
      
      // Check if anyone reached 30 points
      const myScore = data.updatedPlayers[newSocket.id]?.score || 0;
      const opponentId = Object.keys(data.updatedPlayers).find(id => id !== newSocket.id);
      const opponentScore = data.updatedPlayers[opponentId]?.score || 0;
      
      if (myScore >= 30 || opponentScore >= 30) {
        setTimeout(() => {
          const winner = myScore >= 30 ? newSocket.id : opponentId;
          setWinnerInfo(winner);
          setViewState('gameOver');
          // Switch back to home music when game ends
          playBackgroundMusic('homeMusic');
        }, 2000);
      }
    });

    newSocket.on('game_over', (data) => {
      setPlayers(data.players);
      setWinnerInfo(data.winner);
      setViewState('gameOver');
      // Switch back to home music when game is over
      playBackgroundMusic('homeMusic');
    });
    
    newSocket.on('error_message', (msg) => {
      setErrorMessage(msg);
    });

    newSocket.on('current_answer', ({ answer, scoreWarning }) => {
      setCurrentAnswer(answer);
      setShowAnswer(true);
      
      // 如果有得分警告，顯示提示信息
      if (scoreWarning) {
        setMessage('⚠️ ANSWER VIEWED! ROUND SCORE: 0 PTS');
        setTimeout(() => setMessage(''), 3000);
      }
    });
  };

  const togglePause = () => {
    // Remove pause function, no timer available
  };

  const skipRound = () => {
    if (socket && roomCode && canSkip) {
      playSound('skipButton');
      socket.emit('skip_round', { roomCode });
    }
  };

  const getAnswer = () => {
    if (socket && roomCode) {
      playSound('buttonClick');
      socket.emit('get_current_answer', { roomCode });
    }
  };

  const hideAnswer = () => {
    playSound('buttonCancel');
    setShowAnswer(false);
    setCurrentAnswer('');
  };

  const handleKeyPress = (key) => {
    console.log('handleKeyPress called with key:', key);
    console.log('Current state:', {viewState, roundWinner, showResultModal, isPaused, resumeCountdown});
    
    if (viewState !== 'playing' || roundWinner || showResultModal || isPaused || resumeCountdown > 0) {
      console.log('handleKeyPress blocked by conditions');
      return;
    }
    
    console.log('handleKeyPress proceeding with key:', key);

    if (key === 'ENTER') {
      if (currentGuess.length !== wordLength) return;
      
      // Check for duplicate input in current round (only check current round guesses, not guessHistory)
      const isDuplicate = guesses.some(guess => guess.word === currentGuess);
      if (isDuplicate) {
        playSound('buttonCancel');
        setErrorMessage('WORD ALREADY GUESSED THIS ROUND!');
        setTimeout(() => setErrorMessage(''), 1500);
        return;
      }
      
      playSound('buttonClick');
      socket.emit('submit_guess_competitive', { roomCode, guess: currentGuess });
    } else if (key === 'BACKSPACE') {
      if (currentGuess.length > 0) {
        playSound('buttonCancel');
      }
      setCurrentGuess(prev => prev.slice(0, -1));
    } else if (currentGuess.length < wordLength && /^[A-Z]$/.test(key)) {
      playSound('buttonClick');
      setCurrentGuess(prev => prev + key);
    }
  };

  // Add pause/resume handlers
  const handlePause = () => {
    console.log('Pause button clicked, isPaused:', isPaused, 'socket:', !!socket, 'roomCode:', roomCode);
    if (socket && !isPaused && roomCode) {
      playSound('buttonClick');
      console.log('Emitting pause_game event');
      socket.emit('pause_game', { roomCode });
    }
  };

  const handleResume = () => {
    console.log('Resume button clicked, isPaused:', isPaused, 'socket:', !!socket, 'roomCode:', roomCode);
    if (socket && isPaused && roomCode) {
      playSound('buttonClick');
      console.log('Emitting resume_game event');
      socket.emit('resume_game', { roomCode });
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (viewState !== 'playing') return;
      
      if (isPaused || resumeCountdown > 0) return;
      
      if (e.key === 'Enter') handleKeyPress('ENTER');
      else if (e.key === 'Backspace') handleKeyPress('BACKSPACE');
      else if (/^[a-zA-Z]$/.test(e.key)) handleKeyPress(e.key.toUpperCase());
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewState, currentGuess, roundWinner, roomCode, isPaused, resumeCountdown]);

  // UI 
  if (viewState === 'lobby') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-900 via-blue-900 to-indigo-900 flex flex-col items-center justify-center p-4 animate-fade-in">
        
        <div className="max-w-md w-full bg-gray-900 p-8 pixel-border text-white relative animate-bounce-in" style={{ boxShadow: '8px 8px 0 rgba(0,0,0,0.8)' }}>
          <button onClick={() => { playSound('buttonCancel'); playBackgroundMusic('homeMusic'); onBack(); }} className="pixel-button absolute top-4 left-4 p-2 bg-red-600 hover:bg-red-500 pixel-border transition-smooth hover-scale cursor-pointer" style={{ boxShadow: '2px 2px 0 rgba(0,0,0,0.6)' }}>
            <ArrowLeft size={16}/>
          </button>
          <h2 className="text-xl font-bold mb-8 text-center flex items-center justify-center gap-2 text-yellow-400 animate-slide-in-top no-select">
            <Trophy className="text-orange-400 animate-bounce"/> COMPETITIVE
          </h2>
          
          <div className="mb-8 p-4 bg-gray-800 pixel-border animate-slide-up animate-delay-100" style={{ boxShadow: 'inset 2px 2px 0 rgba(0,0,0,0.5)' }}>
            <h3 className="font-bold mb-3 flex items-center gap-2 text-blue-400 text-sm no-select">
              <User size={16}/> CREATE ROOM
            </h3>
            <div className="flex gap-2 mb-4 justify-center">
                {[4, 5, 6, 7].map((len, index) => (
                    <button 
                      key={len} 
                      onClick={() => { playSound('buttonClick'); setSelectedLength(len); }} 
                      className={`pixel-button px-3 py-1 text-xs font-bold transition-smooth pixel-border hover-scale animate-fade-in ${
                        selectedLength === len ? 'bg-yellow-400 text-gray-900' : 'bg-gray-700 text-white hover:bg-gray-600'
                      }`}
                      style={{ 
                        boxShadow: '2px 2px 0 rgba(0,0,0,0.6)',
                        animationDelay: `${index * 0.1}s`
                      }}
                    >
                      {len}
                    </button>
                ))}
            </div>
            <button 
              onClick={createRoom} 
              className="pixel-button w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold transition-smooth pixel-border text-xs hover-lift animate-slide-up animate-delay-200 cursor-pointer"
              style={{ boxShadow: '2px 2px 0 rgba(0,0,0,0.6)' }}
            >
              CREATE & WAIT
            </button>
          </div>

          <div className="p-4 bg-gray-800 pixel-border animate-slide-up animate-delay-300" style={{ boxShadow: 'inset 2px 2px 0 rgba(0,0,0,0.5)' }}>
            <h3 className="font-bold mb-3 flex items-center gap-2 text-green-400 text-sm no-select">
              <Users size={16}/> JOIN ROOM
            </h3>
            <div className="flex gap-2">
                <input 
                    type="text" 
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value)}
                    placeholder="ROOM CODE"
                    className="flex-1 bg-gray-700 pixel-border px-3 py-2 text-center tracking-widest uppercase text-white text-xs transition-smooth focus:bg-gray-600 focus:outline-none cursor-text"
                    style={{ boxShadow: 'inset 2px 2px 0 rgba(0,0,0,0.5)' }}
                    maxLength={6}
                />
                <button 
                  onClick={joinRoom} 
                  className="pixel-button px-4 bg-green-600 hover:bg-green-500 text-white font-bold pixel-border text-xs transition-smooth hover-scale cursor-pointer"
                  style={{ boxShadow: '2px 2px 0 rgba(0,0,0,0.6)' }}
                >
                  JOIN
                </button>
            </div>
          </div>
          {errorMessage && (
            <p className="text-red-400 text-center mt-4 text-xs bg-red-900/30 p-2 pixel-border animate-error-shake">
              {errorMessage}
            </p>
          )}
        </div>
      </div>
    );
  }

  if (viewState === 'waiting') {
    const exitWaiting = () => {
      playSound('buttonCancel');
      // Ensure home music is playing when exiting waiting room
      playBackgroundMusic('homeMusic');
      if (socket) {
        socket.emit('leave_room', { roomCode });
        socket.disconnect();
      }
      resetGameState();
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-purple-900 via-blue-900 to-indigo-900 flex flex-col items-center justify-center p-4 animate-fade-in">
            <div className="bg-gray-900 p-10 pixel-border text-center relative text-white animate-bounce-in" style={{ boxShadow: '8px 8px 0 rgba(0,0,0,0.8)' }}>
                <Hash size={32} className="mx-auto text-yellow-400 mb-4 animate-pulse no-select"/>
                <h2 className="text-lg font-bold mb-2 text-yellow-400 animate-slide-in-top no-select">ROOM CODE</h2>
                <div className="text-3xl bg-gray-800 px-6 py-4 pixel-border tracking-widest text-green-400 select-all mb-6 animate-fade-in-scale animate-delay-200 selectable cursor-text" style={{ boxShadow: 'inset 4px 4px 0 rgba(0,0,0,0.5)' }}>
                    {roomCode}
                </div>
                <p className="text-gray-400 flex items-center justify-center gap-2 mb-6 text-xs animate-slide-up animate-delay-300 no-select">
                    <Users className="animate-bounce" size={16}/> WAITING FOR OPPONENT...
                </p>
                <button 
                  onClick={exitWaiting}
                  className="pixel-button px-6 py-2 bg-red-600 hover:bg-red-500 text-white font-bold pixel-border text-xs transition-smooth hover-lift animate-slide-up animate-delay-400 cursor-pointer"
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
      <div className="min-h-screen bg-gradient-to-b from-purple-900 via-blue-900 to-indigo-900 flex flex-col items-center justify-center p-4 animate-fade-in">
        <div className="bg-gray-900 p-16 pixel-border text-center text-white animate-modal-slide-in" style={{ boxShadow: '8px 8px 0 rgba(0,0,0,0.8)' }}>
          <h2 className="text-xl font-bold mb-8 text-yellow-400 animate-slide-in-top no-select">GET READY!</h2>
          <div className="text-6xl font-bold text-green-400 mb-8 animate-countdown-pulse no-select">
            {gameStartCountdown || 'GO!'}
          </div>
          <p className="text-gray-400 text-xs animate-fade-in animate-delay-500 no-select">GAME STARTING...</p>
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
                <div key={i} className={`flex gap-1 justify-center animate-slide-up`} style={{ animationDelay: `${i * 0.1}s` }}>
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
                            style = 'bg-purple-600 pixel-border text-purple-300 animate-bounce-in';
                        }
                        
                        return (
                          <div 
                            key={j} 
                            className={`wordle-cell ${style} w-12 h-12 flex items-center justify-center text-lg font-bold transition-smooth hover-scale no-select cursor-help`}
                            style={{ 
                              boxShadow: '2px 2px 0 rgba(0,0,0,0.6)',
                              animationDelay: `${(i * 0.1) + (j * 0.05)}s`
                            }}
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
        <div className="min-h-screen bg-gradient-to-b from-purple-900 via-blue-900 to-indigo-900 text-white flex items-center justify-center py-4 px-2 animate-fade-in">
          
          <div className="flex gap-6 w-full max-w-6xl">
            {/* Center: Main game area */}
            <div className="flex-1 flex flex-col items-center">
              {/* Control buttons area */}
              <div className="w-full max-w-xl flex justify-between items-center mb-4 animate-slide-in-top">
                  <button 
                    onClick={exitGame}
                    className="pixel-button px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold transition-smooth pixel-border text-xs hover-scale cursor-pointer"
                    style={{ boxShadow: '2px 2px 0 rgba(0,0,0,0.6)' }}
                  >
                    EXIT GAME
                  </button>
                  <div className="flex gap-2">
                    <button 
                      onClick={isPaused ? handleResume : handlePause}
                      className={`pixel-button px-4 py-2 bg-yellow-600 hover:bg-yellow-500 text-white font-bold transition-smooth pixel-border text-xs hover-scale cursor-pointer`}
                      style={{ boxShadow: '2px 2px 0 rgba(0,0,0,0.6)' }}
                    >
                      PAUSE
                    </button>
                    {canSkip && (
                      <button 
                        onClick={skipRound}
                        className="pixel-button px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold transition-smooth pixel-border text-xs hover-scale animate-bounce-in cursor-pointer"
                        style={{ boxShadow: '2px 2px 0 rgba(0,0,0,0.6)' }}
                      >
                        SKIP ROUND
                      </button>
                    )}
                    <button 
                      onClick={showAnswer ? hideAnswer : getAnswer}
                      className={`pixel-button px-4 py-2 ${showAnswer ? 'bg-orange-600 hover:bg-orange-500' : 'bg-purple-600 hover:bg-purple-500'} text-white font-bold transition-smooth pixel-border text-xs hover-scale cursor-pointer`}
                      style={{ boxShadow: '2px 2px 0 rgba(0,0,0,0.6)' }}
                    >
                      {showAnswer ? 'HIDE ANSWER' : 'SHOW ANSWER'}
                    </button>
                  </div>
              </div>

              <div className="w-full max-w-xl flex justify-between items-end mb-4 bg-gray-900 p-4 pixel-border animate-slide-up animate-delay-100" style={{ boxShadow: '4px 4px 0 rgba(0,0,0,0.8)' }}>
                  <div className="text-center animate-slide-in-left">
                      <p className="text-xs text-gray-400 no-select">YOU</p>
                      <p className="text-2xl font-bold text-green-400 no-select">{myScore}</p>
                      <p className="text-xs text-gray-500 no-select">ROUND {myRound}</p>
                  </div>
                  <div className="flex flex-col items-center animate-fade-in-scale animate-delay-200">
                      <div className="text-xs text-orange-400 mb-1 font-bold no-select">
                          BATTLE MODE
                      </div>
                      <div className="text-lg bg-gray-800 px-4 py-2 pixel-border text-white no-select" style={{ boxShadow: '2px 2px 0 rgba(0,0,0,0.6)' }}>
                          NO TIME LIMIT
                      </div>
                      <div className="text-xs text-yellow-300 mt-1 no-select text-center">
                        <div>WIN: +{potentialPoints} PTS</div>
                        <div>FIRST TO 30 WINS!</div>
                      </div>
                  </div>
                  <div className="text-center animate-slide-in-right">
                      <p className="text-xs text-gray-400 no-select">OPPONENT</p>
                      <p className="text-2xl font-bold text-red-400 no-select">{opponentScore}</p>
                      <p className="text-xs text-gray-500 no-select">ROUND {opponentRound}</p>
                  </div>
              </div>

              {errorMessage && (
                <div className={`mb-4 px-4 py-2 pixel-border font-bold text-xs animate-modal-slide-in ${
                  errorMessage.includes('won') || errorMessage.includes('OPPONENT WON') ? 'bg-green-600 text-white animate-success-bounce' : 'bg-red-600 text-white animate-error-shake'
                }`} style={{ boxShadow: '2px 2px 0 rgba(0,0,0,0.6)' }}>
                  {errorMessage}
                </div>
              )}

              {/* Answer display area */}
              {showAnswer && currentAnswer && (
                <div className="mb-4 p-4 bg-purple-900 pixel-border text-center animate-modal-slide-in" style={{ boxShadow: '4px 4px 0 rgba(0,0,0,0.8)' }}>
                  <div className="text-xs text-purple-300 mb-2 font-bold no-select">CURRENT ANSWER</div>
                  <div className="flex justify-center gap-1">
                    {currentAnswer.split('').map((letter, index) => (
                      <div 
                        key={index}
                        className="w-10 h-10 bg-purple-600 text-white pixel-border flex items-center justify-center text-lg font-bold animate-bounce-in no-select"
                        style={{ 
                          boxShadow: '2px 2px 0 rgba(0,0,0,0.6)',
                          animationDelay: `${index * 0.1}s`
                        }}
                      >
                        {letter}
                      </div>
                    ))}
                  </div>
                  <div className="text-xs text-purple-300 mt-2 no-select">This is your target word for this round</div>
                  <div className="text-xs text-red-400 mt-2 font-bold animate-pulse no-select">
                    ⚠️ ROUND SCORE: 0 PTS (ANSWER VIEWED)
                  </div>
                </div>
              )}

              <div className="space-y-2 mb-6 select-none relative animate-fade-in-scale animate-delay-300 no-select">
                  {roundWinner && (
                      <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80 z-10 backdrop-blur-sm pixel-border animate-fade-in">
                          <div className="text-lg font-bold text-yellow-400 animate-pulse no-select">WAITING FOR NEXT ROUND...</div>
                      </div>
                  )}
                  {renderCompGrid()}
              </div>

              <div className="flex flex-col gap-2 w-full max-w-xl animate-slide-in-bottom animate-delay-400">
                  {keys.map((row, i) => (
                      <div key={i} className="flex gap-1 justify-center w-full">
                          {row.map((key, keyIndex) => (
                              <button
                                  key={key}
                                  onClick={() => handleKeyPress(key)}
                                  className={`pixel-button h-10 font-bold text-xs flex items-center justify-center transition-smooth bg-gray-700 hover:bg-gray-600 text-white pixel-border hover-scale animate-fade-in cursor-pointer ${
                                    key === 'ENTER' || key === 'BACKSPACE' ? 'flex-[1.5] text-xs' : 'flex-1'
                                  }`}
                                  style={{ 
                                    boxShadow: '2px 2px 0 rgba(0,0,0,0.6)',
                                    animationDelay: `${(i * 0.1) + (keyIndex * 0.02)}s`
                                  }}
                              >
                                  {key === 'BACKSPACE' ? '⌫' : key}
                              </button>
                          ))}
                      </div>
                  ))}
              </div>
            </div>
            
            {/* Right side: Letter status */}
            <div className="flex-shrink-0 animate-slide-in-right animate-delay-500">
              <LetterStatusTracker guesses={guesses} />
            </div>
          </div>
          
          {/* Pause overlay */}
          {(isPaused || resumeCountdown > 0) && (
            <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 animate-fade-in">
              <div className="bg-gray-900 p-8 pixel-border text-center text-white animate-modal-slide-in" style={{ boxShadow: '8px 8px 0 rgba(0,0,0,0.8)' }}>
                {resumeCountdown > 0 ? (
                  <>
                    <div className="text-4xl mb-4 animate-bounce">⏰</div>
                    <h2 className="text-xl font-bold text-yellow-400 mb-2">RESUMING IN</h2>
                    <div className="text-6xl font-bold text-green-400 animate-pulse">{resumeCountdown}</div>
                  </>
                ) : (
                  <>
                    <div className="text-4xl mb-4">⏸️</div>
                    <h2 className="text-xl font-bold text-yellow-400 mb-2">GAME PAUSED</h2>
                    <p className="text-gray-300 text-xs mb-4">Click START to continue</p>
                    <button 
                      onClick={handleResume}
                      className="pixel-button px-6 py-3 bg-green-600 hover:bg-green-500 text-white font-bold transition-smooth pixel-border text-sm hover-scale cursor-pointer"
                      style={{ boxShadow: '4px 4px 0 rgba(0,0,0,0.6)' }}
                    >
                      ▶️ START
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Skip answer modal */}
          {skipAnswerModal.show && (
            <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 animate-fade-in">
              <div className="bg-gray-900 p-8 pixel-border text-center text-white animate-modal-slide-in" style={{ boxShadow: '8px 8px 0 rgba(0,0,0,0.8)' }}>
                <div className="text-4xl mb-4">📝</div>
                <h2 className="text-xl font-bold text-blue-400 mb-2">{skipAnswerModal.playerName} SKIPPED ROUND {skipAnswerModal.round}</h2>
                <div className="text-lg text-gray-300 mb-2">Answer was:</div>
                <div className="text-3xl font-bold text-yellow-400 mb-4 tracking-wider">{skipAnswerModal.answer}</div>
                <p className="text-gray-300 text-xs">Starting next round...</p>
              </div>
            </div>
          )}
          
          {/* Result modal */}
          <ResultModal show={showResultModal} type={resultModalType} mode="competitive" />
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
          <div className="min-h-screen bg-gradient-to-b from-purple-900 via-blue-900 to-indigo-900 text-white flex flex-col items-center justify-center p-4 animate-fade-in">
              <div className="max-w-md w-full bg-gray-900 p-8 pixel-border text-center animate-bounce-in" style={{ boxShadow: '8px 8px 0 rgba(0,0,0,0.8)' }}>
                  {isWinner ? (
                      <div className="text-yellow-400 mb-4 animate-success-bounce"><Trophy size={48} className="mx-auto"/></div>
                  ) : (
                      <div className="text-gray-500 mb-4 animate-error-shake"><Swords size={48} className="mx-auto"/></div>
                  )}
                  <h2 className="text-2xl font-bold mb-2 text-yellow-400 animate-slide-in-top no-select">
                    {isWinner ? 'VICTORY!' : (winnerInfo === 'draw' ? 'DRAW!' : 'DEFEAT!')}
                  </h2>
                  <p className="text-gray-400 mb-8 text-xs animate-fade-in animate-delay-200 no-select">GOOD GAME!</p>
                  
                  <div className="flex justify-center gap-8 text-xl font-bold mb-8 animate-slide-up animate-delay-300">
                      <div className="text-center">
                          <div className="text-xs text-gray-500 no-select">YOU</div>
                          <div className={`${isWinner ? 'text-green-400 animate-success-bounce' : 'text-gray-300'} no-select`}>{myScore}</div>
                      </div>
                      <div className="text-gray-600 no-select">-</div>
                      <div className="text-center">
                          <div className="text-xs text-gray-500 no-select">OPPONENT</div>
                          <div className={`${!isWinner && winnerInfo !== 'draw' ? 'text-green-400 animate-success-bounce' : 'text-gray-300'} no-select`}>{opponentScore}</div>
                      </div>
                  </div>

                  <button 
                    onClick={() => { playSound('buttonClick'); playBackgroundMusic('homeMusic'); resetGameState(); }} 
                    className="pixel-button w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold pixel-border text-xs transition-smooth hover-lift animate-slide-up animate-delay-500 cursor-pointer"
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
  const [isTransitioning, setIsTransitioning] = useState(false);
  const { playBackgroundMusic, stopBackgroundMusic } = useAudio();

  // Start home music when app loads and maintain it across home/competitive views
  useEffect(() => {
    playBackgroundMusic('homeMusic');
  }, []);

  const handleViewChange = (newView) => {
    setIsTransitioning(true);
    
    // Handle music transitions
    if (newView === 'single') {
      // Stop home music and start single player music
      stopBackgroundMusic();
      setTimeout(() => {
        playBackgroundMusic('singlePlayerMusic');
      }, 100);
    } else if (newView === 'home' && view === 'single') {
      // Coming back from single player, start home music
      stopBackgroundMusic();
      setTimeout(() => {
        playBackgroundMusic('homeMusic');
      }, 100);
    }
    // For home <-> competitive, don't change music at all
    
    setTimeout(() => {
      setView(newView);
      setIsTransitioning(false);
    }, 300);
  };

  return (
    <div className={`transition-opacity duration-300 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
      {view === 'home' && <HomePage onSelectMode={handleViewChange} />}
      {view === 'single' && <SinglePlayerGame onBack={() => handleViewChange('home')} />}
      {view === 'competitive' && <CompetitiveMode onBack={() => handleViewChange('home')} />}
    </div>
  );
};

export default App;