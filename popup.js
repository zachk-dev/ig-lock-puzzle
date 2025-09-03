// popup.js (minimal)
const statusEl = document.getElementById("status");
const lockNowBtn = document.getElementById("lockNow");
const openOptionsBtn = document.getElementById("openOptions");

function minsLeft(untilMs) {
  const left = Math.max(0, untilMs - Date.now());
  return Math.ceil(left / 60000);
}

async function refreshStatus() {
  const { unlockedUntil = 0, cooldownMinutes = 5 } =
    await chrome.storage.local.get(["unlockedUntil", "cooldownMinutes"]);
  if (Date.now() < unlockedUntil) {
    statusEl.textContent = `Unlocked: ~${minsLeft(unlockedUntil)} min remaining (cooldown: ${cooldownMinutes}m).`;
  } else {
    statusEl.textContent = "Locked: IG will show the puzzle on next visit.";
  }
}

lockNowBtn.addEventListener("click", async () => {
  await chrome.storage.local.set({ unlockedUntil: 0 });
  // No tabs permission needed; content.js listens to storage changes and relocks itself
  refreshStatus();
});

openOptionsBtn.addEventListener("click", () => chrome.runtime.openOptionsPage());

refreshStatus();