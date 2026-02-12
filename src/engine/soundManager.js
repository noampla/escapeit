/**
 * SoundManager - Central audio system with theme-based sound support
 * Falls back to procedural sounds when audio files are not available
 */

class SoundManager {
  constructor() {
    this.enabled = this.loadPreference();
    this.volume = 0.5;
    this.sounds = new Map(); // Cached Audio objects
    this.failedSounds = new Set(); // Track which sounds failed to load (use procedural)
    this.themeSounds = null; // Theme-specific sound config
    this.basePath = '/sounds/engine/'; // Default engine sounds path
    this.audioContext = null; // Lazy-loaded Web Audio context
    this.progressOscillator = null; // For interaction progress sound
    this.progressGain = null;

    // Default engine sound definitions
    this.defaultSounds = {
      walk: 'walk.mp3',
      blocked: 'blocked.mp3',
      pickup: 'pickup.mp3',
      drop: 'drop.mp3',
      interact: 'interact.mp3',
      interactComplete: 'interact-complete.mp3',
      damage: 'damage.mp3',
      win: 'win.mp3',
      lose: 'lose.mp3',
      hover: 'hover.mp3',
    };

    // Procedural sound definitions (used when files not available)
    this.proceduralSounds = {
      walk: { type: 'noise', frequency: 200, duration: 0.08, attack: 0.01, decay: 0.07 },
      blocked: { type: 'square', frequency: 150, duration: 0.1, attack: 0.01, decay: 0.09, detune: -10 },
      pickup: { type: 'sine', frequency: 600, duration: 0.15, attack: 0.01, decay: 0.14, sweep: 800 },
      drop: { type: 'sine', frequency: 400, duration: 0.12, attack: 0.01, decay: 0.11, sweep: -200 },
      interact: { type: 'sine', frequency: 300, duration: 0.1, attack: 0.02, decay: 0.08 },
      interactComplete: { type: 'sine', frequency: 500, duration: 0.25, attack: 0.01, decay: 0.24, sweep: 300 },
      damage: { type: 'sawtooth', frequency: 100, duration: 0.3, attack: 0.01, decay: 0.29, detune: 20 },
      win: { type: 'sine', frequency: 400, duration: 0.6, attack: 0.05, decay: 0.55, sweep: 400, notes: [400, 500, 600, 800] },
      lose: { type: 'sawtooth', frequency: 300, duration: 0.5, attack: 0.05, decay: 0.45, sweep: -200 },
      explosion: { type: 'noise', frequency: 80, duration: 0.8, attack: 0.01, decay: 0.79, sweep: -60, volume: 3.0 },
      hover: { type: 'sine', frequency: 800, duration: 0.08, attack: 0.01, decay: 0.07, sweep: 200, volume: 0.5 },
      success: { type: 'sine', frequency: 500, duration: 0.5, attack: 0.02, decay: 0.48, sweep: 200, notes: [500, 650, 800] },
    };
  }

  /**
   * Get or create the Web Audio context (lazy initialization)
   */
  getAudioContext() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    // Resume if suspended (browser autoplay policy)
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
    return this.audioContext;
  }

  /**
   * Load user preference from localStorage
   */
  loadPreference() {
    try {
      const saved = localStorage.getItem('soundEnabled');
      return saved === null ? true : saved === 'true';
    } catch {
      return true;
    }
  }

  /**
   * Save user preference to localStorage
   */
  savePreference() {
    try {
      localStorage.setItem('soundEnabled', String(this.enabled));
    } catch {
      // Ignore storage errors
    }
  }

  /**
   * Enable or disable all sounds
   */
  setEnabled(enabled) {
    this.enabled = enabled;
    this.savePreference();
  }

  /**
   * Toggle sound on/off
   */
  toggle() {
    this.setEnabled(!this.enabled);
    return this.enabled;
  }

  /**
   * Set master volume (0.0 to 1.0)
   */
  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume));
  }

  /**
   * Set theme-specific sounds configuration
   */
  setThemeSounds(themeSoundConfig) {
    this.themeSounds = themeSoundConfig;
    this.sounds.clear();
    this.failedSounds.clear();
  }

  /**
   * Clear theme sounds (when switching themes or resetting)
   */
  clearThemeSounds() {
    this.themeSounds = null;
    this.sounds.clear();
    this.failedSounds.clear();
  }

  /**
   * Get the audio file path for a sound type
   */
  getSoundPath(soundType) {
    // Check theme sounds first
    if (this.themeSounds?.sounds?.[soundType]) {
      const themePath = this.themeSounds.basePath || `/themes/${this.themeSounds.themeId}/sounds/`;
      return themePath + this.themeSounds.sounds[soundType];
    }

    // Fall back to engine defaults
    if (this.defaultSounds[soundType]) {
      return this.basePath + this.defaultSounds[soundType];
    }

    return null;
  }

  /**
   * Play a procedural sound using Web Audio API
   */
  playProcedural(soundType, options = {}) {
    const config = this.proceduralSounds[soundType];
    if (!config) return;

    try {
      const ctx = this.getAudioContext();
      const now = ctx.currentTime;
      const volume = (options.volume ?? 1) * this.volume * 0.3 * (config.volume ?? 1); // Procedural sounds are quieter, config.volume can boost

      // Handle multi-note sounds (like win jingle)
      if (config.notes) {
        config.notes.forEach((freq, i) => {
          this.playTone(ctx, freq, now + i * 0.12, 0.15, config.type, volume);
        });
        return;
      }

      this.playTone(ctx, config.frequency, now, config.duration, config.type, volume, config.sweep, config.detune);
    } catch {
      // Web Audio not available
    }
  }

  /**
   * Play a single tone
   */
  playTone(ctx, frequency, startTime, duration, type, volume, sweep = 0, detune = 0) {
    const gainNode = ctx.createGain();
    gainNode.connect(ctx.destination);

    let sourceNode;

    if (type === 'noise') {
      // White noise for footsteps
      const bufferSize = ctx.sampleRate * duration;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      sourceNode = ctx.createBufferSource();
      sourceNode.buffer = buffer;

      // Add a filter for more interesting noise
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = frequency;
      filter.Q.value = 1;
      sourceNode.connect(filter);
      filter.connect(gainNode);
    } else {
      // Oscillator-based sounds
      sourceNode = ctx.createOscillator();
      sourceNode.type = type;
      sourceNode.frequency.setValueAtTime(frequency, startTime);

      if (sweep) {
        sourceNode.frequency.linearRampToValueAtTime(frequency + sweep, startTime + duration);
      }
      if (detune) {
        sourceNode.detune.setValueAtTime(detune, startTime);
      }

      sourceNode.connect(gainNode);
    }

    // Envelope
    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.01);
    gainNode.gain.linearRampToValueAtTime(0, startTime + duration);

    sourceNode.start(startTime);
    sourceNode.stop(startTime + duration + 0.1);
  }

  /**
   * Play a sound by type
   * Tries to load audio file first, falls back to procedural if file not found
   */
  play(soundType, options = {}) {
    if (!this.enabled) return;

    // If we already know this sound file doesn't exist, use procedural
    if (this.failedSounds.has(soundType)) {
      this.playProcedural(soundType, options);
      return;
    }

    const path = this.getSoundPath(soundType);
    if (!path) {
      // No path defined, try procedural
      this.playProcedural(soundType, options);
      return;
    }

    try {
      const audio = new Audio(path);
      audio.volume = (options.volume ?? 1) * this.volume;

      if (options.playbackRate) {
        audio.playbackRate = options.playbackRate;
      }

      // Try to play the file
      const playPromise = audio.play();

      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // File failed to load/play - mark as failed and use procedural
          this.failedSounds.add(soundType);
          this.playProcedural(soundType, options);
        });
      }
    } catch {
      // Audio creation failed - use procedural
      this.failedSounds.add(soundType);
      this.playProcedural(soundType, options);
    }
  }

  /**
   * Stop all sounds
   */
  stopAll() {
    this.sounds.forEach(audio => {
      audio.pause();
      audio.currentTime = 0;
    });
    this.stopProgress();
  }

  /**
   * Start the interaction progress sound
   * Creates a sustained tone that will be updated as progress changes
   */
  startProgress() {
    if (!this.enabled) return;

    // Stop any existing progress sound
    this.stopProgress();

    try {
      const ctx = this.getAudioContext();

      // Create oscillator for progress tone
      this.progressOscillator = ctx.createOscillator();
      this.progressOscillator.type = 'sine';
      this.progressOscillator.frequency.setValueAtTime(200, ctx.currentTime);

      // Create gain node for volume control
      this.progressGain = ctx.createGain();
      this.progressGain.gain.setValueAtTime(this.volume * 0.2, ctx.currentTime);
      this.progressGain.gain.linearRampToValueAtTime(this.volume * 0.25, ctx.currentTime + 0.02);

      // Connect and start
      this.progressOscillator.connect(this.progressGain);
      this.progressGain.connect(ctx.destination);
      this.progressOscillator.start();
    } catch {
      // Web Audio not available
    }
  }

  /**
   * Update the progress sound based on current progress (0.0 to 1.0)
   * Pitch rises as progress increases
   */
  updateProgress(progress) {
    if (!this.enabled || !this.progressOscillator) return;

    try {
      const ctx = this.getAudioContext();
      // Frequency rises from 200Hz to 600Hz as progress goes from 0 to 1
      const frequency = 200 + (progress * 400);
      this.progressOscillator.frequency.setValueAtTime(frequency, ctx.currentTime);

      // Volume increases slightly as we get closer to completion
      const volume = this.volume * (0.2 + progress * 0.15);
      this.progressGain.gain.setValueAtTime(volume, ctx.currentTime);
    } catch {
      // Ignore errors
    }
  }

  /**
   * Stop the progress sound
   */
  stopProgress() {
    if (this.progressOscillator) {
      try {
        const ctx = this.getAudioContext();
        // Fade out quickly
        if (this.progressGain) {
          this.progressGain.gain.setValueAtTime(this.progressGain.gain.value, ctx.currentTime);
          this.progressGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.05);
        }
        // Stop after fade
        setTimeout(() => {
          try {
            this.progressOscillator?.stop();
          } catch {
            // Already stopped
          }
          this.progressOscillator = null;
          this.progressGain = null;
        }, 60);
      } catch {
        this.progressOscillator = null;
        this.progressGain = null;
      }
    }
  }
}

// Singleton instance
const soundManager = new SoundManager();

export default soundManager;
