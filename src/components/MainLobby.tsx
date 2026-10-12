import React, { useState, useEffect } from 'react';
import { Play, HelpCircle, Settings, LogOut, Volume2, VolumeX, Music, Check, ArrowRight, ShieldQuestion } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { SoundManager } from '../lib/SoundManager';

interface MainLobbyProps {
  username: string;
  onStartMission: () => void;
  onLogout: () => void;
}

export default function MainLobby({ username, onStartMission, onLogout }: MainLobbyProps) {
  const [activeModal, setActiveModal] = useState<'none' | 'how-to-play' | 'settings'>('none');
  const [soundOn, setSoundOn] = useState(SoundManager.soundEnabled);
  const [musicOn, setMusicOn] = useState(SoundManager.musicEnabled);

  useEffect(() => {
    // Start ambient background score when lobby loads
    if (musicOn) {
      SoundManager.startMusic();
    }
    return () => {
      // Keep playing, only stop if needed or let it transition
    };
  }, []);

  const handleToggleSound = () => {
    const newState = !soundOn;
    setSoundOn(newState);
    SoundManager.toggleSound(newState);
    if (newState) {
      SoundManager.playPop();
    }
  };

  const handleToggleMusic = () => {
    const newState = !musicOn;
    setMusicOn(newState);
    SoundManager.toggleMusic(newState);
  };

  return (
    <div className="w-full max-w-lg mx-auto flex flex-col items-center justify-center p-6 sm:p-10 bg-slate-950/45 rounded-[40px] sm:rounded-[48px] border-2 border-slate-800 shadow-2xl relative z-10 backdrop-blur-md">
      
      {/* Decorative pulse glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-cyan-500/10 rounded-full blur-[60px] pointer-events-none"></div>

      <div className="text-center mb-10 w-full">
        <h2 className="text-[10px] tracking-[0.5em] uppercase font-bold text-cyan-400 mb-3 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]">
          Welcome, Pilot {username}
        </h2>
        <h1 className="text-6.5xl sm:text-7xl font-black italic tracking-tighter leading-none text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
          NEON
          <br/>
          BURST
        </h1>
        <div className="text-[9px] font-mono tracking-widest text-slate-500 mt-3 uppercase">
          Orbital Match Protocol v4.5 // System Online
        </div>
      </div>

      {/* Button Menu Actions */}
      <div className="w-full flex flex-col gap-4 relative z-10">
        <motion.button
          whileHover={{ scale: 1.03, boxShadow: '0 0 25px rgba(34,211,238,0.45)' }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            if (soundOn) SoundManager.playShoot();
            onStartMission();
          }}
          className="w-full py-4.5 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 text-white font-black uppercase tracking-widest text-sm flex items-center justify-center gap-3 rounded-full shadow-[0_4px_20px_rgba(6,182,212,0.3)] border border-cyan-300/30 group cursor-pointer"
        >
          <Play className="w-5 h-5 fill-current text-white animate-pulse" />
          START GAME
          <ArrowRight className="w-4 h-4 ml-1 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02, backgroundColor: 'rgba(30, 41, 59, 0.7)' }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            if (soundOn) SoundManager.playBounce();
            setActiveModal('how-to-play');
          }}
          className="w-full py-4 bg-slate-900/60 text-slate-200 border-2 border-slate-800 hover:border-slate-700 font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-2.5 rounded-full transition-all cursor-pointer"
        >
          <HelpCircle className="w-4 h-4 text-cyan-400" />
          How to Play (Learn)
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02, backgroundColor: 'rgba(30, 41, 59, 0.7)' }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            if (soundOn) SoundManager.playBounce();
            setActiveModal('settings');
          }}
          className="w-full py-4 bg-slate-900/60 text-slate-200 border-2 border-slate-800 hover:border-slate-700 font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-2.5 rounded-full transition-all cursor-pointer"
        >
          <Settings className="w-4 h-4 text-purple-400" />
          System Settings
        </motion.button>

        <button
          onClick={onLogout}
          className="w-full py-3 mt-4 text-[10px] uppercase font-black tracking-widest text-slate-500 hover:text-pink-500 transition-colors flex items-center justify-center gap-2"
        >
          <LogOut className="w-3.5 h-3.5" />
          Exit Session (Logout)
        </button>
      </div>

      {/* MODAL OVERLAYS */}
      <AnimatePresence>
        {activeModal === 'how-to-play' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/95 backdrop-blur-xl z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-lg bg-slate-900/90 border-2 border-slate-800 p-6 sm:p-8 rounded-[36px] shadow-2xl relative"
            >
              <h3 className="text-2xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 uppercase tracking-tight mb-4 flex items-center gap-2">
                <ShieldQuestion className="w-7 h-7 text-cyan-400" /> Game Manual
              </h3>

              <div className="space-y-4 text-slate-300 text-xs sm:text-sm text-left font-sans max-h-[60vh] overflow-y-auto pr-2">
                <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
                  <h4 className="font-extrabold text-cyan-400 uppercase tracking-widest text-[11px] mb-2 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
                    Aim and Trajectory
                  </h4>
                  <p className="leading-relaxed text-slate-300">
                    Aim by moving your pointer or dragging on mobile. A beautiful, glowing dashboard-dashed trajectory line will project your ball's path, complete with wall bounces!
                  </p>
                </div>

                <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
                  <h4 className="font-extrabold text-purple-400 uppercase tracking-widest text-[11px] mb-2 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse"></span>
                    Clearing Rules
                  </h4>
                  <p className="leading-relaxed text-slate-300">
                    Release or click to shoot. Matching <b className="text-white">3 or more connected orbitals</b> of the same fluorescent color pops them, clearing the sector.
                  </p>
                </div>

                <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
                  <h4 className="font-extrabold text-pink-500 uppercase tracking-widest text-[11px] mb-2 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-pink-500 animate-pulse"></span>
                    Falling Floaters
                  </h4>
                  <p className="leading-relaxed text-slate-300">
                    Pop bubbles supporting other clusters. Any floating bubbles that lose attachment to the top ceiling will fall and explode into particle points!
                  </p>
                </div>

                <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
                  <h4 className="font-extrabold text-emerald-400 uppercase tracking-widest text-[11px] mb-2 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    Mission Clear
                  </h4>
                  <p className="leading-relaxed text-slate-300">
                    Clear the screen entirely to open the next sector. There are <b className="text-white">30 total levels</b>, each with complex concentric, V-shape, and orbital grid layouts.
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  if (soundOn) SoundManager.playBounce();
                  setActiveModal('none');
                }}
                className="w-full mt-6 py-3 bg-white text-black font-black uppercase tracking-wider text-xs rounded-full hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Acknowledge Protocol
              </button>
            </motion.div>
          </motion.div>
        )}

        {activeModal === 'settings' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/95 backdrop-blur-xl z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-md bg-slate-900/90 border-2 border-slate-800 p-6 sm:p-8 rounded-[36px] shadow-2xl relative"
            >
              <h3 className="text-2xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500 uppercase tracking-tight mb-6 flex items-center gap-2 justify-center">
                <Settings className="w-7 h-7 text-purple-400" /> System Params
              </h3>

              {/* Toggle Controls */}
              <div className="space-y-5">
                {/* SFX SOUND EFFECT TOGGLE */}
                <div className="flex items-center justify-between p-4 bg-slate-950/50 border border-slate-800 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-cyan-950/40 border border-cyan-800 text-cyan-400 rounded-xl">
                      {soundOn ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                    </div>
                    <div className="text-left">
                      <h4 className="font-bold text-white text-sm">SOUND EFFECTS</h4>
                      <p className="text-[10px] text-slate-400">Lasers, pops, collision feedback</p>
                    </div>
                  </div>

                  <button
                    onClick={handleToggleSound}
                    className={`w-14 h-8 rounded-full transition-all duration-300 relative border cursor-pointer ${
                      soundOn ? 'bg-cyan-500/20 border-cyan-500' : 'bg-slate-800 border-slate-700'
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-full absolute top-1 transition-all duration-300 ${
                        soundOn ? 'left-7 bg-cyan-400' : 'left-1 bg-slate-500'
                      }`}
                    ></div>
                  </button>
                </div>

                {/* MUSIC TOGGLE */}
                <div className="flex items-center justify-between p-4 bg-slate-950/50 border border-slate-800 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-purple-950/40 border border-purple-800 text-purple-400 rounded-xl">
                      <Music className="w-5 h-5 text-purple-400" />
                    </div>
                    <div className="text-left">
                      <h4 className="font-bold text-white text-sm">ENVIRONMENT MUSIC</h4>
                      <p className="text-[10px] text-slate-400">Procedural slow-wave sci-fi synth loops</p>
                    </div>
                  </div>

                  <button
                    onClick={handleToggleMusic}
                    className={`w-14 h-8 rounded-full transition-all duration-300 relative border cursor-pointer ${
                      musicOn ? 'bg-purple-500/20 border-purple-500' : 'bg-slate-800 border-slate-700'
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-full absolute top-1 transition-all duration-300 ${
                        musicOn ? 'left-7 bg-purple-400' : 'left-1 bg-slate-500'
                      }`}
                    ></div>
                  </button>
                </div>
              </div>

              <button
                onClick={() => {
                  if (soundOn) SoundManager.playBounce();
                  setActiveModal('none');
                }}
                className="w-full mt-8 py-3 bg-white text-black font-black uppercase tracking-wider text-xs rounded-full hover:bg-slate-200 transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" /> Save System Params
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
