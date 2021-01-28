const listener = require("./nestedRequire.js").listener;
document.querySelector("button").addEventListener("click", listener);
console.log(listener);
