// Cosmic Courier - Procedural Web Audio Synthesizer
// Provides zero-latency, asset-free space sound effects and atmospheric cosmic music.

class SoundManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private musicGain: GainNode | null = null;

  private soundEnabled: boolean = true;
  private musicEnabled: boolean = true;
  private masterVol: number = 0.8;
  private sfxVol: number = 0.85;
  private musicVol: number = 0.65;

  private thrustOsc: OscillatorNode | null = null;
  private thrustGain: GainNode | null = null;
  private isThrusting: boolean = false;

  private musicInterval: number | null = null;
  private isMusicPlaying: boolean = false;

  private init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.soundEnabled ? this.masterVol : 0, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(this.sfxVol, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.setValueAtTime(this.musicEnabled ? this.musicVol : 0, this.ctx.currentTime);
      this.musicGain.connect(this.masterGain);

      // Start background music loop
      if (this.musicEnabled) {
        this.startMusic();
      }
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public setSettings(soundEnabled: boolean, musicEnabled: boolean, master: number, sfx: number, music: number) {
    this.soundEnabled = soundEnabled;
    this.musicEnabled = musicEnabled;
    this.masterVol = master;
    this.sfxVol = sfx;
    this.musicVol = music;

    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(soundEnabled ? master : 0, this.ctx.currentTime);
    }
    if (this.sfxGain && this.ctx) {
      this.sfxGain.gain.setValueAtTime(sfx, this.ctx.currentTime);
    }
    if (this.musicGain && this.ctx) {
      this.musicGain.gain.setValueAtTime(musicEnabled ? music : 0, this.ctx.currentTime);
    }

    if (musicEnabled && !this.isMusicPlaying) {
      this.startMusic();
    } else if (!musicEnabled && this.isMusicPlaying) {
      this.stopMusic();
    }
  }

  // --- Thruster Continuous Audio ---
  public updateThrust(active: boolean, isBoost: boolean = false) {
    if (!this.soundEnabled) return;
    this.init();
    if (!this.ctx || !this.sfxGain) return;

    if (active) {
      if (!this.thrustOsc) {
        this.thrustOsc = this.ctx.createOscillator();
        this.thrustGain = this.ctx.createGain();
        this.thrustOsc.type = 'triangle';
        this.thrustOsc.frequency.setValueAtTime(isBoost ? 180 : 85, this.ctx.currentTime);

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(320, this.ctx.currentTime);

        this.thrustOsc.connect(filter);
        filter.connect(this.thrustGain);
        this.thrustGain.connect(this.sfxGain);

        this.thrustGain.gain.setValueAtTime(0.01, this.ctx.currentTime);
        this.thrustGain.gain.exponentialRampToValueAtTime(isBoost ? 0.22 : 0.12, this.ctx.currentTime + 0.1);
        this.thrustOsc.start();
        this.isThrusting = true;
      } else if (this.thrustGain) {
        const targetGain = isBoost ? 0.25 : 0.14;
        const targetFreq = isBoost ? 190 : 90;
        this.thrustGain.gain.cancelScheduledValues(this.ctx.currentTime);
        this.thrustGain.gain.linearRampToValueAtTime(targetGain, this.ctx.currentTime + 0.08);
        this.thrustOsc.frequency.linearRampToValueAtTime(targetFreq, this.ctx.currentTime + 0.08);
      }
    } else {
      if (this.thrustOsc && this.thrustGain) {
        this.thrustGain.gain.cancelScheduledValues(this.ctx.currentTime);
        this.thrustGain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 0.1);
        const osc = this.thrustOsc;
        setTimeout(() => {
          try {
            osc.stop();
            osc.disconnect();
          } catch {}
        }, 120);
        this.thrustOsc = null;
        this.thrustGain = null;
        this.isThrusting = false;
      }
    }
  }

  // --- Boost Ignition Burst ---
  public playBoost() {
    if (!this.soundEnabled) return;
    this.init();
    if (!this.ctx || !this.sfxGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(60, this.ctx.currentTime + 0.35);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(800, this.ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(200, this.ctx.currentTime + 0.35);

    gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.35);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.36);
  }

  // --- Asteroid Collision ---
  public playCollision(intensity: number = 1.0) {
    if (!this.soundEnabled) return;
    this.init();
    if (!this.ctx || !this.sfxGain) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(35, now + 0.28);

    const targetVol = Math.min(0.45, 0.2 + intensity * 0.2);
    gain.gain.setValueAtTime(targetVol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start();
    osc.stop(now + 0.3);
  }

  // --- Hyper Bonus Ring Chime ---
  public playRingCollect() {
    if (!this.soundEnabled) return;
    this.init();
    if (!this.ctx || !this.sfxGain) return;

    const notes = [587.33, 739.99, 880.0, 1174.66]; // D5, F#5, A5, D6
    notes.forEach((freq, idx) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime + idx * 0.05);

      gain.gain.setValueAtTime(0.18, this.ctx.currentTime + idx * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + idx * 0.05 + 0.28);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(this.ctx.currentTime + idx * 0.05);
      osc.stop(this.ctx.currentTime + idx * 0.05 + 0.3);
    });
  }

  // --- Laser Barrier Zap ---
  public playLaserZap() {
    if (!this.soundEnabled) return;
    this.init();
    if (!this.ctx || !this.sfxGain) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(120, now + 0.2);

    gain.gain.setValueAtTime(0.28, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start();
    osc.stop(now + 0.21);
  }

  // --- Laser Barrier Imminent Activation Warning ---
  public playLaserWarning() {
    if (!this.soundEnabled) return;
    this.init();
    if (!this.ctx || !this.sfxGain) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(950, now);
    osc.frequency.linearRampToValueAtTime(1550, now + 0.08);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start();
    osc.stop(now + 0.11);
  }

  // --- Gravity Well Sub-Bass Drone ---
  public playGravityHum() {
    if (!this.soundEnabled) return;
    this.init();
    if (!this.ctx || !this.sfxGain) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(55, now);
    osc.frequency.linearRampToValueAtTime(45, now + 0.4);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start();
    osc.stop(now + 0.42);
  }

  // --- Package Warning Alert ---
  public playWarning() {
    if (!this.soundEnabled) return;
    this.init();
    if (!this.ctx || !this.sfxGain) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(880, now);

    gain.gain.setValueAtTime(0.14, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start();
    osc.stop(now + 0.13);
  }

  // --- Low Propellant Fuel Alarm ---
  public playLowFuelAlarm() {
    if (!this.soundEnabled) return;
    this.init();
    if (!this.ctx || !this.sfxGain) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(620, now);
    osc.frequency.setValueAtTime(420, now + 0.08);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.17);
  }

  // --- Fuel Depleted / Dry Thruster Sputter ---
  public playFuelEmpty() {
    if (!this.soundEnabled) return;
    this.init();
    if (!this.ctx || !this.sfxGain) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(95, now);
    osc.frequency.linearRampToValueAtTime(35, now + 0.09);

    gain.gain.setValueAtTime(0.14, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.11);
  }

  // --- Refuel / Propellant Replenishment Chime ---
  public playRefuel() {
    if (!this.soundEnabled) return;
    this.init();
    if (!this.ctx || !this.sfxGain) return;

    const now = this.ctx.currentTime;
    const notes = [330, 440, 554, 660];
    notes.forEach((freq, idx) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.05);

      gain.gain.setValueAtTime(0.15, now + idx * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.2);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now + idx * 0.05);
      osc.stop(now + idx * 0.05 + 0.22);
    });
  }

  // --- Landing Success Fanfare ---
  public playLandingSuccess(grade: string = 'PERFECT') {
    if (!this.soundEnabled) return;
    this.init();
    if (!this.ctx || !this.sfxGain) return;

    const now = this.ctx.currentTime;
    const chord = grade === 'PERFECT' ? [523.25, 659.25, 783.99, 1046.5] : [440, 554.37, 659.25];

    chord.forEach((freq, idx) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);

      gain.gain.setValueAtTime(0.22, now + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.6);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.65);
    });
  }

  // --- Destruction Crash Explosion ---
  public playCrash() {
    if (!this.soundEnabled) return;
    this.init();
    if (!this.ctx || !this.sfxGain) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(110, now);
    osc.frequency.exponentialRampToValueAtTime(25, now + 0.6);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start();
    osc.stop(now + 0.68);
  }

  // --- Catastrophic Cargo Containment Breach FX ---
  public playPackageBreach() {
    if (!this.soundEnabled) return;
    this.init();
    if (!this.ctx || !this.sfxGain) return;

    const now = this.ctx.currentTime;

    // 1. High-frequency glass/ceramic containment rupture snap
    const snapOsc = this.ctx.createOscillator();
    const snapGain = this.ctx.createGain();
    snapOsc.type = 'sawtooth';
    snapOsc.frequency.setValueAtTime(1750, now);
    snapOsc.frequency.exponentialRampToValueAtTime(280, now + 0.22);
    snapGain.gain.setValueAtTime(0.38, now);
    snapGain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
    snapOsc.connect(snapGain);
    snapGain.connect(this.sfxGain);
    snapOsc.start(now);
    snapOsc.stop(now + 0.25);

    // 2. Heavy decompression sub-bass concussion
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = 'triangle';
    subOsc.frequency.setValueAtTime(150, now);
    subOsc.frequency.exponentialRampToValueAtTime(26, now + 0.75);
    subGain.gain.setValueAtTime(0.48, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
    subOsc.connect(subGain);
    subGain.connect(this.sfxGain);
    subOsc.start(now);
    subOsc.stop(now + 0.82);

    // 3. Crackling electric containment blowout sizzle
    const sizzleOsc = this.ctx.createOscillator();
    const sizzleGain = this.ctx.createGain();
    sizzleOsc.type = 'square';
    sizzleOsc.frequency.setValueAtTime(620, now + 0.04);
    sizzleOsc.frequency.linearRampToValueAtTime(80, now + 0.4);
    sizzleGain.gain.setValueAtTime(0.22, now + 0.04);
    sizzleGain.gain.exponentialRampToValueAtTime(0.001, now + 0.42);
    sizzleOsc.connect(sizzleGain);
    sizzleGain.connect(this.sfxGain);
    sizzleOsc.start(now + 0.04);
    sizzleOsc.stop(now + 0.45);
  }

  // --- UI Sounds ---
  public playUiClick() {
    if (!this.soundEnabled) return;
    this.init();
    if (!this.ctx || !this.sfxGain) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(300, now + 0.04);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start();
    osc.stop(now + 0.05);
  }

  public playUiPurchase() {
    if (!this.soundEnabled) return;
    this.init();
    if (!this.ctx || !this.sfxGain) return;

    const now = this.ctx.currentTime;
    [987.77, 1318.51].forEach((freq, idx) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.07);
      gain.gain.setValueAtTime(0.18, now + idx * 0.07);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.22);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now + idx * 0.07);
      osc.stop(now + idx * 0.07 + 0.25);
    });
  }

  // --- Ambient Cosmic Space Synth ---
  private startMusic() {
    this.isMusicPlaying = true;
    if (this.musicInterval) clearInterval(this.musicInterval);

    // Warm ambient chords in A minor pentatonic: A, C, D, E, G
    const ambientScale = [110, 130.81, 146.83, 164.81, 196.0, 220, 261.63, 293.66, 329.63];

    this.musicInterval = window.setInterval(() => {
      if (!this.musicEnabled || !this.ctx || !this.musicGain) return;

      const baseFreq = ambientScale[Math.floor(Math.random() * ambientScale.length)];
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(baseFreq, this.ctx.currentTime);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(450, this.ctx.currentTime);

      gain.gain.setValueAtTime(0.001, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.06, this.ctx.currentTime + 1.2);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 3.8);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.musicGain);

      osc.start();
      osc.stop(this.ctx.currentTime + 4.0);
    }, 2800);
  }

  private stopMusic() {
    this.isMusicPlaying = false;
    if (this.musicInterval) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
  }
}

export const soundManager = new SoundManager();
