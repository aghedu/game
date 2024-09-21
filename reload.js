function reloadScript(src) {
  var oldScript = document.querySelector(`script[src="${src}"]`);
  if (oldScript) {
    oldScript.remove();
  }
  var newScript = document.createElement("script");
  newScript.src = src + "?t=" + new Date().getTime();
  newScript.type = "module";
  document.head.appendChild(newScript);
}
export { reloadScript };
