import fs from 'fs';
const path = './src/app/globals.css';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(/@import url\('https:\/\/fonts\.googleapis\.com\/css2\?family=DM\+Sans.*?'\);\n*/g, '');

content = content.replace(/font-family:\s*'DM Sans',\s*sans-serif;/g, "font-family: inherit;");
content = content.replace(/font-family:\s*'Instrument Serif',\s*serif;/g, "font-family: inherit;");

fs.writeFileSync(path, content, 'utf8');
console.log('done');
