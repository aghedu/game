const itemStates = {};

function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
}

function setCookie(name, value) {
  document.cookie = `${name}=${value}; path=/; max-age=31536000`; // 1 year expiration
}
function changeItemState(name, state) {
  if (name in itemStates) {
    itemStates[name] = state;
    setCookie(name, state);
  }
}
export { getCookie, setCookie, changeItemState, itemStates };
