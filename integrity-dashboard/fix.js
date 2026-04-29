const fs = require('fs');
let code = fs.readFileSync('src/App.js', 'utf8');
code = code.replace('useState(\\"Dashboard\\")', 'useState("Dashboard")');
fs.writeFileSync('src/App.js', code);
console.log('Fixed!');
