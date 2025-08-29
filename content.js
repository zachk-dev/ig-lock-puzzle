(async () => {
  const now = () => Date.now();

  const {
    cooldownMinutes = 30,
    holdSeconds = 20,
    unlockedUntil = 0
  } = await chrome.storage.local.get(["cooldownMinutes", "holdSeconds", "unlockedUntil"]);

  // If already unlocked, do nothing.
  if (now() < (unlockedUntil || 0)) return;

  // ---------- Overlay + Shadow DOM ----------
  const host = document.createElement("div");
  host.id = "iglp-root-container";
  const shadow = host.attachShadow({ mode: "open" });
  document.documentElement.appendChild(host);

  const style = document.createElement("style");
  style.textContent = `
    :host, .overlay {
      position: fixed; inset: 0; z-index: 2147483647;
      display: flex; align-items: center; justify-content: center;
      background: rgba(10, 10, 14, 0.94);
      font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial;
      opacity: 1; transition: opacity .25s ease;
    }
    :host(.fadeout) { opacity: 0; }
    .card {
      width: min(92vw, 520px);
      background: #111827; color: #e5e7eb;
      border: 1px solid #1f2937; border-radius: 16px;
      padding: 24px; box-shadow: 0 10px 30px rgba(0,0,0,0.5);
      text-align: center;
    }
    h1 { margin: 0 0 8px; font-size: 1.4rem; letter-spacing: .3px; }
    p { margin: 0 0 16px; color: #9ca3af; line-height: 1.5; }
    .timer { font-variant-numeric: tabular-nums; font-size: 2rem; margin: 8px 0 16px; color: #fbbf24; }
    .hold-area { user-select: none; -webkit-user-select: none; border-radius: 14px; border: 1px dashed #374151; padding: 16px; margin-top: 8px; background: #0b1220; }
    .hold-btn { display: inline-block; padding: 14px 18px; border-radius: 999px; background: #2563eb; color: white; border: none; font-weight: 600; cursor: pointer; transition: transform .1s ease; }
    .hold-btn:active { transform: scale(0.98); }
    .hint { color: #9ca3af; font-size: .9rem; margin-top: 10px; }
    .footer { margin-top: 16px; font-size: .85rem; color: #6b7280; }
    .progress { height: 10px; background: #1f2937; border-radius: 999px; overflow: hidden; margin: 10px 0 6px; }
    .bar { height: 100%; width: 0%; background: #22c55e; transition: width .1s linear; }
    .link { color: #93c5fd; text-decoration: underline; cursor: pointer; }
  `;

  const overlay = document.createElement("div");
  overlay.className = "overlay";
  overlay.innerHTML = `
    <div class="card">
      <h1>Stay Intentional 🔒</h1>
      <p>Press and hold the button (or hold the <strong>spacebar</strong>) for <strong>${holdSeconds}s</strong>.</p>
      <div class="timer" id="timer">0.0s / ${holdSeconds.toFixed(1)}s</div>
      <div class="progress"><div class="bar" id="bar"></div></div>
      <div class="hold-area">
        <button class="hold-btn" id="holdBtn">Press & Hold</button>
        <div class="hint">Releasing resets the timer.</div>
      </div>
      <div class="footer">
        After success, IG stays unlocked for <strong>${cooldownMinutes} min</strong>.
        <span class="hint">Change this in <span class="link" id="openOptions">Options</span>.</span>
      </div>
    </div>
  `;
  shadow.append(style, overlay);

  // ---------- Elements ----------
  const timerEl = shadow.getElementById("timer");
  const barEl = shadow.getElementById("bar");
  const holdBtn = shadow.getElementById("holdBtn");
  const openOptions = shadow.getElementById("openOptions");

  // ---------- State ----------
  let holding = false;
  let spaceDown = false;
  let startMs = 0;
  let rafId = null;
  let unlocked = false; // guard to prevent double cleanup
  const targetMs = holdSeconds * 1000;

  // ---------- Helpers ----------
  function setBar(ms) {
    const clamped = Math.min(ms, targetMs);
    timerEl.textContent = `${(clamped / 1000).toFixed(1)}s / ${holdSeconds.toFixed(1)}s`;
    barEl.style.width = `${(clamped / targetMs) * 100}%`;
  }

  function resetProgress() {
    holding = false;
    startMs = 0;
    setBar(0);
    if (rafId) cancelAnimationFrame(rafId);
    rafId = null;
  }

  async function removeOverlay() {
    if (unlocked) return;
    unlocked = true;
    // Stop observing & listening
    observer.disconnect();
    window.removeEventListener("keydown", onKeyDown, true);
    window.removeEventListener("keyup", onKeyUp, true);
    holdBtn.removeEventListener("pointerdown", onPointerDown);
    holdBtn.removeEventListener("pointerup", onPointerUp);
    holdBtn.removeEventListener("pointerleave", onPointerUp);
    shadow.removeEventListener("pointercancel", onPointerUp);

    // Fade out then remove
    host.classList.add("fadeout");
    setTimeout(() => {
      host.remove();
    }, 250);
  }

  async function success() {
    // Mark unlocked in storage first (so other tabs know)
    const unlockUntil = now() + cooldownMinutes * 60 * 1000;
    await chrome.storage.local.set({ unlockedUntil: unlockUntil });

    // Immediately remove our overlay in THIS tab
    if (rafId) cancelAnimationFrame(rafId);
    removeOverlay();
  }

  function tick() {
    if (!holding) return;
    const elapsed = now() - startMs;
    setBar(elapsed);
    if (elapsed >= targetMs) return void success();
    rafId = requestAnimationFrame(tick);
  }

  // ---------- Pointer (mouse + touch) ----------
  function onPointerDown(e) {
    e.preventDefault();
    if (holding || unlocked) return;
    holding = true;
    startMs = now();
    tick();
  }
  function onPointerUp() {
    if (!holding || unlocked) return;
    resetProgress();
  }
  holdBtn.addEventListener("pointerdown", onPointerDown, { passive: false });
  holdBtn.addEventListener("pointerup", onPointerUp);
  holdBtn.addEventListener("pointerleave", onPointerUp);
  shadow.addEventListener("pointercancel", onPointerUp);

  // ---------- Keyboard (spacebar) ----------
  function onKeyDown(e) {
    if (e.code !== "Space") return;
    e.preventDefault();
    if (spaceDown || unlocked) return;
    spaceDown = true;
    if (!holding) {
      holding = true;
      startMs = now();
      tick();
    }
  }
  function onKeyUp(e) {
    if (e.code !== "Space") return;
    e.preventDefault();
    spaceDown = false;
    if (holding && !unlocked) resetProgress();
  }
  window.addEventListener("keydown", onKeyDown, true);
  window.addEventListener("keyup", onKeyUp, true);

  // ---------- Options link ----------
  openOptions.addEventListener("click", () => chrome.runtime.openOptionsPage());

  // ---------- React to storage changes (unlock from popup/other tab) ----------
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "local" || !changes.unlockedUntil) return;
    const newVal = changes.unlockedUntil.newValue || 0;
    if (now() < newVal) {
      removeOverlay(); // disappear without reload if another place unlocked it
    }
  });

  // ---------- Guard against DOM mutations removing our host ----------
  const observer = new MutationObserver(() => {
    if (!document.getElementById("iglp-root-container") && !unlocked) {
      document.documentElement.appendChild(host);
    }
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });
})();