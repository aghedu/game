const itemStates = {};
// Canonical and legacy cookie keys
const CANONICAL_KEYS = ["piwo", "gorzala", "zupka", "kebs", "fajki", "blant"];
const LEGACY_KEYS = ["ruskacz", "vodka", "vifon", "kebab", "marlboro", "joint"];

function deleteCookie(name) {
  document.cookie = `${name}=; path=/; max-age=0`;
}

function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
}

function setCookie(name, value) {
  // Set only the provided key (canonical path)
  document.cookie = `${name}=${value}; path=/; max-age=31536000`;
}

// One-time reset: if legacy cookies exist, clear both legacy and canonical
// so previous unlocks are not preserved after renaming keys.
(function resetOnLegacyPresenceOnce() {
  const flag = `; ${document.cookie}`.includes(`; cookiesRenamedV2=true`);
  if (flag) return;
  const value = `; ${document.cookie}`;
  const legacyPresent = LEGACY_KEYS.some((k) => value.includes(`; ${k}=true`));
  if (legacyPresent) {
    // Clear canonical and legacy values
    [...CANONICAL_KEYS, ...LEGACY_KEYS].forEach(deleteCookie);
  }
  // Mark completed to avoid repeated clearing
  document.cookie = `cookiesRenamedV2=true; path=/; max-age=31536000`;
})();
function changeItemState(name, state) {
  if (name in itemStates) {
    itemStates[name] = state;
    setCookie(name, state);
  }
}
export { getCookie, setCookie, changeItemState, itemStates, deleteCookie };
