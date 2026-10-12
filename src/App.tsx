import { useState, useEffect } from 'react';
import BubbleShooter from './components/BubbleShooter';
import LoginScreen from './components/LoginScreen';
import LevelSelector from './components/LevelSelector';
import MainLobby from './components/MainLobby';

export default function App() {
  const [username, setUsername] = useState<string | null>(null);
  const [view, setView] = useState<'login' | 'lobby' | 'map' | 'game'>('login');
  
  const [maxUnlocked, setMaxUnlocked] = useState(1);
  const [currentLevel, setCurrentLevel] = useState(1);
  const [sessionKey, setSessionKey] = useState(Date.now());

  useEffect(() => {
    const saved = localStorage.getItem('neon_burst_username');
    if (saved) {
       setUsername(saved);
       loadUserProgress(saved);
       setView('lobby');
    }
  }, []);

  const loadUserProgress = (name: string) => {
    const savedMax = localStorage.getItem(`neon_burst_max_level_${name}`);
    if (savedMax) {
       setMaxUnlocked(parseInt(savedMax, 10));
    } else {
       setMaxUnlocked(1);
    }
  };

  const handleLogin = (name: string) => {
    localStorage.setItem('neon_burst_username', name);
    setUsername(name);
    loadUserProgress(name);
    setView('lobby');
  };

  const handleLogout = () => {
    localStorage.removeItem('neon_burst_username');
    setUsername(null);
    setView('login');
  };

  const handleSelectLevel = (level: number) => {
    setCurrentLevel(level);
    setSessionKey(Date.now()); // force a fresh mount of BubbleShooter to reset session score if needed
    setView('game');
  };

  const handleLevelComplete = (completedLevel: number) => {
    const nextLevel = completedLevel + 1;
    if (nextLevel > maxUnlocked && nextLevel <= 30) {
        setMaxUnlocked(nextLevel);
        if (username) {
           localStorage.setItem(`neon_burst_max_level_${username}`, nextLevel.toString());
        }
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-white font-sans overflow-hidden flex items-center justify-center relative select-none">
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-pink-600 blur-[120px] rounded-full"></div>
      </div>
      
      {view === 'login' && <LoginScreen onLogin={handleLogin} />}

      {view === 'lobby' && username && (
        <MainLobby
          username={username}
          onStartMission={() => setView('map')}
          onLogout={handleLogout}
        />
      )}
      
      {view === 'map' && username && (
        <LevelSelector 
           username={username}
           maxUnlocked={maxUnlocked}
           onSelect={handleSelectLevel}
           onLogout={handleLogout}
           onBackToLobby={() => setView('lobby')}
        />
      )}

      {view === 'game' && username && (
        <BubbleShooter 
           key={sessionKey}
           username={username} 
           initialLevel={currentLevel}
           onLevelComplete={handleLevelComplete}
           onExit={() => setView('map')}
           onLogout={handleLogout} 
        />
      )}
    </div>
  );
}

