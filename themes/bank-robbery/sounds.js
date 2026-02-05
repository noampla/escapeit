/**
 * Bank Robbery Theme - Sound Configuration
 *
 * This file defines theme-specific sounds that override engine defaults.
 * Place your sound files in: /themes/bank-robbery/sounds/
 *
 * Sound types that can be overridden:
 * - walk, blocked, pickup, drop, interact, interactComplete, damage, win, lose
 *
 * You can also define custom sounds for specific interactions.
 */

// Base path for this theme's sounds (relative to public folder)
export const SOUNDS_PATH = '/themes/bank-robbery/sounds/';

// Sound file mappings (override engine defaults)
export const SOUNDS = {
  // Override default sounds with theme-specific versions
  // walk: 'footsteps.mp3',
  // pickup: 'grab.mp3',
  // win: 'heist-complete.mp3',

  // Custom sounds for this theme's interactions
  // unlock: 'door-unlock.mp3',
  // alarm: 'alarm-triggered.mp3',
  // vault: 'vault-open.mp3',
};

// Map interaction IDs to specific sounds
// When an interaction completes, the sound manager will check here first
export const INTERACTION_SOUNDS = {
  // 'unlock-door-key': 'unlock',
  // 'unlock-door-card': 'card-beep',
  // 'disable-camera': 'camera-off',
  // 'open-vault': 'vault',
};
