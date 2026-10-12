// Web Audio API Synthesizer for Procedural Neon Soundscapes and Retro SFX
class SoundManagerClass {
  private ctx: AudioContext | null = null;
  private musicOscs: { osc: OscillatorNode; gain: GainNode }[] = [];
  private isMusicPlaying = false;
  private musicTimeout: any = null;
  private sfxVol = 1.0;
  private musicVol = 0.6;

  public soundEnabled = true;
  public musicEnabled = true;

  constructor() {
    // Load persisted settings
    if (typeof window !== 'undefined') {
      const savedSound = localStorage.getItem('neon_burst_sfx_on');
      const savedMusic = localStorage.getItem('neon_burst_music_on');
      this.soundEnabled = savedSound !== 'false';
      this.musicEnabled = savedMusic !== 'false';
    }
  }

  private initCtx() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public toggleSound(enabled: boolean) {
    this.soundEnabled = enabled;
    localStorage.setItem('neon_burst_sfx_on', String(enabled));
  }

  public toggleMusic(enabled: boolean) {
    this.musicEnabled = enabled;
    localStorage.setItem('neon_burst_music_on', String(enabled));
    if (enabled) {
      this.startMusic();
    } else {
      this.stopMusic();
    }
  }

  // --- SOUND EFFECTS (SFX) WITH NEON THEREMIN SYNTH APPARATUS ---
  public playShoot() {
    if (!this.soundEnabled) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(800, now);
      // Sweeping frequency downwards
      osc.frequency.exponentialRampToValueAtTime(150, now + 0.15);

      gain.gain.setValueAtTime(0.12 * this.sfxVol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.15);
    } catch (e) {
      console.warn('Audio play error:', e);
    }
  }

  public playPop() {
    if (!this.soundEnabled) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.exponentialRampToValueAtTime(1200, now + 0.08);

      gain.gain.setValueAtTime(0.15 * this.sfxVol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.08);
    } catch (e) {
      console.warn('Audio play error:', e);
    }
  }

  public playBounce() {
    if (!this.soundEnabled) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.setValueAtTime(220, now + 0.05);

      gain.gain.setValueAtTime(0.08 * this.sfxVol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.06);
    } catch (e) {
      console.warn('Audio play error:', e);
    }
  }

  public playWin() {
    if (!this.soundEnabled) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const notes = [261.63, 329.63, 392.00, 523.25, 659.25]; // C major arpeggio
      notes.forEach((freq, idx) => {
        const time = now + idx * 0.1;
        const o = this.ctx!.createOscillator();
        const g = this.ctx!.createGain();

        o.type = 'sine';
        o.frequency.setValueAtTime(freq, time);
        g.gain.setValueAtTime(0.1 * this.sfxVol, time);
        g.gain.exponentialRampToValueAtTime(0.001, time + 0.2);

        o.connect(g);
        g.connect(this.ctx!.destination);

        o.start(time);
        o.stop(time + 0.22);
      });
    } catch (e) {
      console.warn('Audio play error:', e);
    }
  }

  public playLose() {
    if (!this.soundEnabled) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const notes = [220.00, 196.00, 174.61, 146.83]; // descending chord
      notes.forEach((freq, idx) => {
        const time = now + idx * 0.15;
        const o = this.ctx!.createOscillator();
        const g = this.ctx!.createGain();

        o.type = 'sawtooth';
        o.frequency.setValueAtTime(freq, time);
        g.gain.setValueAtTime(0.08 * this.sfxVol, time);
        g.gain.exponentialRampToValueAtTime(0.001, time + 0.3);

        o.connect(g);
        g.connect(this.ctx!.destination);

        o.start(time);
        o.stop(time + 0.35);
      });
    } catch (e) {
      console.warn('Audio play error:', e);
    }
  }

  // --- PROCEDURAL BACKGROUND SYNTH MUSIC LOOP ---
  public startMusic() {
    if (!this.musicEnabled || this.isMusicPlaying) return;
    this.initCtx();
    if (!this.ctx) return;

    this.isMusicPlaying = true;
    this.runMusicLoop();
  }

  public stopMusic() {
    this.isMusicPlaying = false;
    if (this.musicTimeout) {
      clearTimeout(this.musicTimeout);
      this.musicTimeout = null;
    }
    this.musicOscs.forEach(({ osc, gain }) => {
      try {
        osc.stop();
      } catch (e) {}
    });
    this.musicOscs = [];
  }

  private runMusicLoop() {
    if (!this.isMusicPlaying || !this.ctx) return;
    
    // Ambient sci-fi chord sequence: Am9 -> Gmaj7 -> Fmaj7 -> Em7
    const chords = [
      [110.00, 220.00, 261.63, 329.63, 392.00], // Am9 notes
      [98.00, 196.00, 246.94, 293.66, 392.00],  // Gmaj7 notes
      [87.31, 174.61, 220.00, 261.63, 349.23],  // Fmaj7 notes
      [82.41, 164.81, 196.00, 246.94, 329.63],  // Em7 notes
    ];

    let chordIdx = 0;

    const playChordPattern = () => {
      if (!this.isMusicPlaying || !this.ctx) return;
      
      const now = this.ctx.currentTime;
      const freqs = chords[chordIdx];
      
      // Select next chord index
      chordIdx = (chordIdx + 1) % chords.length;

      // Play continuous pad for 3 seconds
      freqs.forEach((freq, i) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        
        osc.type = i === 0 ? 'sine' : 'triangle'; // sine for bass, triangle for keys
        osc.frequency.setValueAtTime(freq, now);

        // Soft attack, sustain, soft decay
        const noteVol = (i === 0 ? 0.05 : 0.02) * this.musicVol;
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(noteVol, now + 0.6);
        gain.gain.setValueAtTime(noteVol, now + 2.4);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 2.9);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.start(now);
        osc.stop(now + 3.0);

        const oscRecord = { osc, gain };
        this.musicOscs.push(oscRecord);
        
        // Cleanup old notes
        setTimeout(() => {
          this.musicOscs = this.musicOscs.filter(o => o !== oscRecord);
        }, 3200);
      });

      // Schedule next chord
      this.musicTimeout = setTimeout(playChordPattern, 3000);
    };

    playChordPattern();
  }
}

export const SoundManager = new SoundManagerClass();
