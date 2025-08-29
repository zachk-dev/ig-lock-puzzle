// background.js
chrome.runtime.onInstalled.addListener(async () => {
  const defaults = {
    holdSeconds: 20,        // how long to hold the button
    cooldownMinutes: 5,    // how long IG stays unlocked after success
  };
  const current = await chrome.storage.local.get(Object.keys(defaults));
  const newValues = {};
  for (const [k, v] of Object.entries(defaults)) {
    if (current[k] === undefined) newValues[k] = v;
  }
  if (Object.keys(newValues).length) {
    await chrome.storage.local.set(newValues);
  }
});