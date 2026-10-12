import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { RotateCcw, Play, Trophy, LogOut, ChevronLeft, Settings, Volume2, VolumeX, Music } from 'lucide-react';
import { GameEngine, COLOR_MAP } from '../lib/GameEngine';
import { SoundManager } from '../lib/SoundManager';

interface BubbleShooterProps {
  username: string;
  initialLevel: number;
  onLevelComplete: (level: number) => void;
  onExit: () => void;
  onLogout: () => void;
}

export default function BubbleShooter({ username, initialLevel, onLevelComplete, onExit, onLogout }: BubbleShooterProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [engine, setEngine] = useState<GameEngine | null>(null);
  
  const [score, setScore] = useState(0);
  const [nextColor, setNextColor] = useState('cyan');
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'gameover' | 'win'>('idle');
  const [level, setLevel] = useState(initialLevel);
  const [highScore, setHighScore] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [soundOn, setSoundOn] = useState(SoundManager.soundEnabled);
  const [musicOn, setMusicOn] = useState(SoundManager.musicEnabled);

  useEffect(() => {
    const saved = localStorage.getItem(`neon_burst_hs_${username}`);
    if (saved) setHighScore(parseInt(saved, 10));
  }, [username]);

  useEffect(() => {
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem(`neon_burst_hs_${username}`, score.toString());
    }
  }, [score, highScore, username]);

  // Unlock level on win
  useEffect(() => {
    if (gameState === 'win') {
      onLevelComplete(level);
    }
  }, [gameState, level, onLevelComplete]);

  // Initialize engine only once
  useEffect(() => {
    if (!canvasRef.current) return;
    const newEngine = new GameEngine(canvasRef.current, {
      onScoreChange: (s) => setScore(s),
      onGameOver: () => setGameState('gameover'),
      onWin: () => setGameState('win'),
      onNextColorChange: (c) => setNextColor(c),
    });
    newEngine.init(initialLevel, false);
    setEngine(newEngine);
    setGameState('idle'); // Wait for Start

    return () => {
      newEngine.cleanup();
    };
  }, [initialLevel]);

  const handleRestart = () => {
    if (engine) {
      setScore(0);
      engine.init(level, true);
      setGameState('playing');
    }
  };

  const handleNextLevel = () => {
    if (engine) {
      if (level < 30) {
        const next = level + 1;
        setLevel(next);
        engine.init(next, true);
        setGameState('playing');
      } else {
        onExit(); // Max level reached, return to map
      }
    }
  };
  
  const handleStartGame = () => {
    if (engine) {
      engine.setGameState('playing');
      setGameState('playing');
    }
  };

  const handleToggleSound = () => {
    const nextVal = !soundOn;
    setSoundOn(nextVal);
    SoundManager.toggleSound(nextVal);
    if (nextVal) {
      SoundManager.playPop();
    }
  };

  const handleToggleMusic = () => {
    const nextVal = !musicOn;
    setMusicOn(nextVal);
    SoundManager.toggleMusic(nextVal);
  };

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col h-[100dvh] max-h-[1000px] relative z-10">
      
      {/* Header UI */}
      <header className="flex items-start justify-between px-8 pt-8 pb-4 shrink-0 relative z-10 mt-4 sm:mt-0">
        <div className="flex flex-col">
          <div className="flex items-center gap-3 mb-2">
            <button 
              onClick={onExit} 
              className="text-[10px] tracking-[0.4em] uppercase font-bold text-slate-500 hover:text-cyan-400 transition-colors flex items-center gap-1 bg-slate-900/50 px-3 py-1.5 rounded-full border border-slate-800 cursor-pointer"
            >
              <ChevronLeft className="w-3 h-3 -ml-1" /> MAP
            </button>
            <button 
              onClick={() => {
                if (soundOn) SoundManager.playBounce();
                setShowSettings(true);
              }} 
              className="text-[10px] tracking-[0.4em] uppercase font-bold text-slate-500 hover:text-cyan-400 transition-colors flex items-center gap-1 bg-slate-900/50 px-3 py-1.5 rounded-full border border-slate-800 cursor-pointer"
            >
              <Settings className="w-3 h-3" /> SETTINGS
            </button>
            <span className="text-[10px] tracking-[0.4em] uppercase font-bold text-slate-500 flex items-center gap-2">
              Pilot: <span className="text-cyan-400">{username}</span>
              <button onClick={onLogout} className="ml-2 hover:text-white transition-colors sm:hidden" title="Logout">
                <LogOut className="w-3 h-3" />
              </button>
            </span>
          </div>
          <motion.h1 
            key={score}
            className="text-7xl sm:text-8xl font-black italic tracking-tighter leading-none text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600"
          >
            {score.toLocaleString()}
          </motion.h1>
        </div>
        
        <div className="flex flex-col items-end text-right hidden sm:flex">
          <div className="text-6xl font-black italic leading-none text-white drop-shadow-lg">
            L{level.toString().padStart(2, '0')}
          </div>
          <div className="text-[10px] tracking-[0.4em] uppercase font-bold text-cyan-400 mt-2">
            System Active
          </div>
        </div>
      </header>

      {/* Main Layout (Columns) */}
      <main className="flex-1 flex flex-col sm:flex-row gap-6 mt-4 z-10 px-4 sm:px-8 pb-4 min-h-0">
        
        {/* Left Column (Desktop) */}
        <div className="w-48 flex-col gap-8 shrink-0 hidden sm:flex">
          <div className="p-6 bg-slate-900/80 border-l-4 border-cyan-500 rounded-r-xl">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-4">Next Orbital</h3>
            <div 
              className="w-16 h-16 rounded-full mx-auto relative transition-colors duration-300"
              style={{ 
                backgroundColor: COLOR_MAP[nextColor] || '#00ffff',
                boxShadow: `0 0 25px ${COLOR_MAP[nextColor] || '#00ffff'}66`
              }}
            >
              <div className="absolute inset-0 bg-white/20 rounded-full blur-[2px] transform -translate-x-1 -translate-y-1"></div>
              <div className="absolute top-2 left-2 w-4 h-4 bg-white/60 rounded-full blur-[1px]"></div>
            </div>
          </div>
          
          <div className="flex flex-col gap-2">
            <div className="h-12 w-full bg-slate-900/50 rounded flex items-center px-4 border border-slate-800">
              <div className="w-2 h-2 rounded-full bg-cyan-500 mr-3 shadow-[0_0_8px_#00ffff]"></div>
              <span className="text-xs font-bold tracking-wider opacity-90 text-cyan-100 uppercase">Target Lock</span>
            </div>
            <div className="h-12 w-full bg-slate-900/50 rounded flex items-center px-4 border border-slate-800">
              <div className="w-2 h-2 rounded-full bg-pink-500 mr-3 shadow-[0_0_8px_#ff007f]"></div>
              <span className="text-xs font-bold tracking-wider opacity-90 text-pink-100 uppercase">Grid Stable</span>
            </div>
          </div>
        </div>

        {/* Center Canvas */}
        <div className="flex-1 bg-slate-950/40 rounded-[32px] sm:rounded-[48px] border-2 border-slate-800 p-2 max-w-[600px] mx-auto sm:max-w-none flex flex-col relative overflow-hidden shadow-2xl shadow-blue-900/20 min-w-0">
          <canvas
            ref={canvasRef}
            width={440}
            height={600}
            className="w-full h-full object-contain block m-auto"
            style={{ touchAction: 'none' }}
          />

          {/* Overlays */}
          {gameState === 'idle' && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-950/90 backdrop-blur-md p-6 text-center sm:rounded-[46px]"
            >
              <div className="mb-2 text-cyan-400">
                <Play className="w-20 h-20 mx-auto mb-4 opacity-90 drop-shadow-[0_0_15px_rgba(34,211,238,0.8)] fill-current" />
              </div>
              <h2 className="text-4xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 mb-2 leading-tight uppercase">
                Ready to Play
              </h2>
              <p className="text-cyan-400/80 font-bold uppercase tracking-widest text-xs mb-8">
                Welcome, {username}
              </p>
              
              <button 
                onClick={handleStartGame}
                className="px-8 py-3 bg-white text-black font-black uppercase tracking-tighter text-sm flex items-center gap-2 hover:bg-slate-200 transition-colors rounded shadow-[0_0_20px_rgba(255,255,255,0.4)]"
              >
                <Play className="w-5 h-5 fill-current" />
                Start Mission
              </button>
            </motion.div>
          )}

          {gameState === 'gameover' && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-950/90 backdrop-blur-md p-6 text-center sm:rounded-[46px]"
            >
              <div className="mb-2 text-pink-500">
                <RotateCcw className="w-16 h-16 mx-auto mb-4 opacity-80" />
              </div>
              <h2 className="text-5xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-red-600 mb-2 leading-tight drop-shadow-[0_0_15px_rgba(255,0,127,0.5)]">
                SYSTEM FAILURE
              </h2>
              <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mb-8">
                Final Score: <span className="text-white text-base">{score}</span>
              </p>
              
              <button 
                onClick={handleRestart}
                className="px-8 py-3 bg-white text-black font-black uppercase tracking-tighter text-sm flex items-center gap-2 hover:bg-slate-200 transition-colors rounded"
              >
                <RotateCcw className="w-5 h-5" />
                Reboot System
              </button>
            </motion.div>
          )}

          {gameState === 'win' && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-950/90 backdrop-blur-md p-6 text-center sm:rounded-[46px]"
            >
              <div className="mb-2 text-cyan-400">
                <Trophy className="w-20 h-20 mx-auto mb-4 opacity-90 drop-shadow-[0_0_15px_rgba(34,211,238,0.8)]" />
              </div>
              <h2 className="text-4xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 mb-2 leading-tight">
                SECTOR CLEARED
              </h2>
              <p className="text-cyan-400/80 font-bold uppercase tracking-widest text-xs mb-8">Target neutralized</p>
              
              <button 
                onClick={handleNextLevel}
                className="px-8 py-3 bg-white text-black font-black uppercase tracking-tighter text-sm flex items-center gap-2 hover:bg-slate-200 transition-colors rounded shadow-[0_0_20px_rgba(255,255,255,0.4)]"
              >
                <Play className="w-5 h-5 fill-current" />
                {level < 30 ? 'Engage Next' : 'Return to Map'}
              </button>
            </motion.div>
          )}

          {showSettings && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-slate-950/95 backdrop-blur-md p-6 text-center sm:rounded-[46px]"
            >
              <h3 className="text-3xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500 mb-6 leading-tight uppercase">
                System Params
              </h3>

              <div className="w-full max-w-xs space-y-4 mb-8">
                {/* Sound FX component */}
                <div className="flex items-center justify-between p-3.5 bg-slate-900/80 border border-slate-800 rounded-xl">
                  <div className="flex items-center gap-2">
                    {soundOn ? <Volume2 className="w-4 h-4 text-cyan-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
                    <span className="text-xs font-bold text-white uppercase tracking-wider">Sound Effects</span>
                  </div>
                  <button
                    onClick={handleToggleSound}
                    className={`w-12 h-6.5 rounded-full relative border transition-all duration-200 cursor-pointer ${
                      soundOn ? 'bg-cyan-500/20 border-cyan-500' : 'bg-slate-800 border-slate-700'
                    }`}
                  >
                    <div
                      className={`w-4.5 h-4.5 rounded-full absolute top-0.5 transition-all duration-200 bg-cyan-400 ${
                        soundOn ? 'left-6' : 'left-0.5 bg-slate-500'
                      }`}
                    ></div>
                  </button>
                </div>

                {/* Music component */}
                <div className="flex items-center justify-between p-3.5 bg-slate-900/80 border border-slate-800 rounded-xl">
                  <div className="flex items-center gap-2">
                    <Music className="w-4 h-4 text-purple-400" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">Music Track</span>
                  </div>
                  <button
                    onClick={handleToggleMusic}
                    className={`w-12 h-6.5 rounded-full relative border transition-all duration-200 cursor-pointer ${
                      musicOn ? 'bg-purple-500/20 border-purple-500' : 'bg-slate-800 border-slate-700'
                    }`}
                  >
                    <div
                      className={`w-4.5 h-4.5 rounded-full absolute top-0.5 transition-all duration-200 bg-purple-400 ${
                        musicOn ? 'left-6' : 'left-0.5 bg-slate-505'
                      }`}
                    ></div>
                  </button>
                </div>
              </div>

              <button
                onClick={() => {
                  if (soundOn) SoundManager.playBounce();
                  setShowSettings(false);
                }}
                className="px-8 py-2.5 bg-white text-black font-black uppercase tracking-wider text-xs rounded-full hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Close Settings
              </button>
            </motion.div>
          )}
        </div>

        {/* Right Column (Desktop) */}
        <div className="w-48 flex-col justify-end gap-6 shrink-0 pb-4 hidden sm:flex">
          <div className="text-right">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Multiplier</h4>
            <p className="text-4xl font-black italic text-cyan-400">x{Math.min(1 + Math.floor(score / 500), 5)}</p>
          </div>
          <div className="h-[1px] w-full bg-slate-800"></div>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-[10px] uppercase font-bold text-slate-500">Best</span>
              <span className="text-xl font-bold text-white">{highScore.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[10px] uppercase font-bold text-slate-500">Status</span>
              <span className="text-xl font-bold text-pink-500 drop-shadow-[0_0_8px_#ff007f]">LIVE</span>
            </div>
          </div>
        </div>

      </main>

      {/* Footer UI */}
      <footer className="px-8 pb-6 flex justify-between items-center z-10 shrink-0 hidden sm:flex">
        <div className="text-[10px] font-mono tracking-tighter text-slate-600">
          NEON_POP_ENGINE_v4.2.0 // CORE_TEMP: OPTIMAL // GRID: ALIGNED
        </div>
        <button 
          onClick={onLogout}
          className="px-6 py-2 border border-slate-700 text-slate-400 font-bold uppercase tracking-widest text-[10px] hover:bg-slate-800 hover:text-white transition-colors rounded-full flex items-center gap-2"
        >
          <LogOut className="w-3 h-3" />
          End Session
        </button>
      </footer>
      
    </div>
  );
}
