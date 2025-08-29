# IG Lock Puzzle (Chrome Extension)

A tiny nudge that locks Instagram behind a short puzzle. Press-and-hold for N seconds to unlock, then you get a cooldown window to use IG intentionally.

## Features
- Full-screen overlay on instagram.com until you complete the puzzle
- Press-and-hold challenge (default 20s)
- Cooldown (default 30 min)
- Options page to tweak difficulty
- Popup to see status or lock immediately

## Install (Developer Mode)
1. Clone or download this repo.
2. Open Chrome → `chrome://extensions/`.
3. Enable **Developer mode** (top-right).
4. Click **Load unpacked** and select this folder.
5. Visit https://instagram.com → solve the puzzle.

## Settings
- Right-click the extension icon → **Options** to set:
  - Hold duration (seconds)
  - Cooldown (minutes)

## Files
- `manifest.json` – extension config (MV3)
- `background.js` – initialize defaults on install
- `content.js` – injects overlay & puzzle logic
- `popup.html`/`popup.js` – quick status + lock now
- `options.html`/`options.js` – settings UI

## Notes
- This is a behavioral nudge, not anti-tamper DRM.
- Works on Chromium browsers that support MV3.

## License
MIT
