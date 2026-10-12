import React from 'react';
import { Lock, Unlock, LogOut, Home } from 'lucide-react';
import { motion } from 'motion/react';

interface Props {
  username: string;
  maxUnlocked: number;
  onSelect: (level: number) => void;
  onLogout: () => void;
  onBackToLobby: () => void;
}

export default function LevelSelector({ username, maxUnlocked, onSelect, onLogout, onBackToLobby }: Props) {
  const levels = Array.from({ length: 30 }, (_, i) => i + 1);

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col h-[100dvh] max-h-[1000px] relative z-10 p-4 sm:p-8">
       <header className="flex items-end justify-between shrink-0 relative z-10 mb-8 mt-4 sm:mt-0">
         <div className="flex flex-col">
           <span className="text-[10px] tracking-[0.4em] uppercase font-bold text-slate-500 mb-2">
             Select Sector • Pilot <span className="text-cyan-400">{username}</span>
           </span>
           <h1 className="text-5xl sm:text-7xl font-black italic tracking-tighter leading-none text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600">
             MISSION MAP
           </h1>
         </div>
         
         <div className="flex gap-2">
           <button 
              onClick={onBackToLobby}
              className="px-5 py-3 border-2 border-cyan-500/50 text-cyan-400 font-bold uppercase tracking-widest text-[10px] hover:bg-cyan-950/40 hover:text-white transition-colors rounded-full flex items-center gap-2 cursor-pointer"
            >
              <Home className="w-4 h-4" />
              <span className="hidden sm:inline">Main Menu</span>
            </button>
            <button 
              onClick={onLogout}
              className="px-5 py-3 border-2 border-slate-700 text-slate-400 font-bold uppercase tracking-widest text-[10px] hover:bg-slate-800 hover:text-white transition-colors rounded-full flex items-center gap-2 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Change Pilot</span>
            </button>
         </div>
       </header>

       <main className="flex-1 overflow-y-auto bg-slate-950/40 rounded-[32px] sm:rounded-[48px] border-2 border-slate-800 p-6 sm:p-8 shadow-2xl shadow-blue-900/20 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
         <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4 sm:gap-6">
            {levels.map(level => {
              const isUnlocked = level <= maxUnlocked;
              return (
                <motion.button
                  whileHover={isUnlocked ? { scale: 1.05 } : {}}
                  whileTap={isUnlocked ? { scale: 0.95 } : {}}
                  onClick={() => isUnlocked && onSelect(level)}
                  key={level}
                  disabled={!isUnlocked}
                  className={`
                    aspect-square rounded-2xl flex flex-col items-center justify-center gap-2 border-2 transition-all relative overflow-hidden group
                    ${isUnlocked 
                      ? 'border-cyan-500 bg-cyan-950/30 text-cyan-400 hover:bg-cyan-900/50 hover:shadow-[0_0_20px_rgba(34,211,238,0.4)] cursor-pointer' 
                      : 'border-slate-800 bg-slate-900/30 text-slate-600 cursor-not-allowed'
                    }
                  `}
                >
                   <div className={`text-4xl font-black italic transition-transform ${isUnlocked ? 'group-hover:scale-110' : ''}`}>
                     {level}
                   </div>
                   
                   {isUnlocked ? (
                     <div className="absolute bottom-3 opacity-50">
                       <Unlock className="w-4 h-4" />
                     </div>
                   ) : (
                     <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-[2px] flex flex-col items-center justify-center gap-2">
                        <Lock className="w-8 h-8 text-slate-500 mb-1 drop-shadow-lg" />
                     </div>
                   )}
                   
                   {/* Level 30 Special Decoration */}
                   {level === 30 && isUnlocked && (
                      <div className="absolute top-2 right-2 flex gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-pulse"></div>
                        <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse delay-75"></div>
                      </div>
                   )}
                </motion.button>
              )
            })}
         </div>
       </main>
    </div>
  );
}
