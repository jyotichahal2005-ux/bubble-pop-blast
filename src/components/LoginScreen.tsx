import React, { useState } from 'react';
import { Play } from 'lucide-react';

interface LoginScreenProps {
  onLogin: (username: string) => void;
}

export default function LoginScreen({ onLogin }: LoginScreenProps) {
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onLogin(name.trim());
    }
  };

  return (
    <div className="w-full max-w-md mx-auto flex flex-col items-center justify-center p-8 sm:p-12 bg-slate-950/40 rounded-[48px] border-2 border-slate-800 shadow-2xl relative z-10 backdrop-blur-md">
      <div className="text-center mb-12">
        <h2 className="text-[10px] tracking-[0.4em] uppercase font-bold text-slate-500 mb-4">
          System Initialization
        </h2>
        <h1 className="text-6xl font-black italic tracking-tighter leading-none text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 drop-shadow-sm">
          NEON
          <br/>
          BURST
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="w-full flex flex-col gap-8">
        <div className="flex flex-col gap-3">
          <label className="text-[10px] uppercase font-bold text-slate-400 tracking-widest ml-4">
            Pilot Designation
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your pilot name..."
            className="w-full bg-slate-900/80 border-2 border-slate-700 rounded-full px-6 py-4 text-white font-bold tracking-wider outline-none focus:border-cyan-500 focus:shadow-[0_0_15px_rgba(34,211,238,0.3)] transition-all placeholder:text-slate-600"
            required
            autoComplete="off"
            maxLength={15}
          />
        </div>

        <button
          type="submit"
          disabled={!name.trim()}
          className="w-full py-4 bg-white text-black font-black uppercase tracking-tighter text-sm flex items-center justify-center gap-2 hover:bg-slate-200 transition-colors rounded-full disabled:opacity-50 disabled:cursor-not-allowed mt-4 shadow-[0_0_20px_rgba(255,255,255,0.2)]"
        >
          <Play className="w-5 h-5 fill-current" />
          Acknowledge & Start
        </button>
      </form>
    </div>
  );
}
