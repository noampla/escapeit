ESCAPEIT ENGINE SOUNDS
======================

Place the following sound files in this folder to enable game audio.
Supported formats: MP3, WAV, OGG

Required sound files:
---------------------
- walk.mp3        : Player successfully moves to a new tile
- blocked.mp3     : Player tries to move into wall/obstacle (short bump sound)
- pickup.mp3      : Item picked up into inventory
- drop.mp3        : Item dropped from inventory
- interact.mp3    : Interaction started (hold E key)
- interact-complete.mp3 : Interaction completed successfully
- damage.mp3      : Player takes damage/loses a life
- win.mp3         : Level completed successfully
- lose.mp3        : Game over (all lives lost)

Recommended specifications:
---------------------------
- Format: MP3 or OGG for best compatibility
- Sample rate: 44100 Hz
- Duration: Keep sounds short (0.1s - 2s for most, win/lose can be longer)
- Volume: Normalize all sounds to similar levels

Theme-specific sounds:
----------------------
Themes can override any of these sounds by creating a sounds.js file
in their theme folder. See /themes/[theme-name]/sounds.js for examples.
