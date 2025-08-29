// options.js
const holdSecondsEl = document.getElementById("holdSeconds");
const cooldownMinutesEl = document.getElementById("cooldownMinutes");
const saveBtn = document.getElementById("saveBtn");
const savedEl = document.getElementById("saved");

async function load() {
  const { holdSeconds = 20, cooldownMinutes = 30 } =
    await chrome.storage.local.get(["holdSeconds", "cooldownMinutes"]);
  holdSecondsEl.value = holdSeconds;
  cooldownMinutesEl.value = cooldownMinutes;
}
load();

saveBtn.addEventListener("click", async () => {
  const holdSeconds = Math.max(5, Math.min(180, Number(holdSecondsEl.value || 20)));
  const cooldownMinutes = Math.max(1, Math.min(360, Number(cooldownMinutesEl.value || 30)));
  await chrome.storage.local.set({ holdSeconds, cooldownMinutes });
  savedEl.textContent = "Saved!";
  setTimeout(() => (savedEl.textContent = ""), 1200);
});