const fs = require('fs');
let err = fs.readFileSync('err.log', 'utf16le');
err = err.replace(/\r/g, '');
fs.writeFileSync('err-clean.txt', err, 'utf8');
