const fs = require('fs');
const path = require('path');
const p = path.resolve('src/pages/home/HomeScreen.tsx');
let content = fs.readFileSync(p, 'utf8');

content = content.replace(/const config = settings\?\.shareConfig \|\| \{ defaultTitle: 'Hari Pathshala', defaultMessage: 'Check this out!' \};/, `const config = settings?.shareConfig || { baseUrl: 'https://haripathshala.com', defaultTitle: 'Hari Pathshala', defaultMessage: 'Check this out!', socialCaption: '', footerMessage: '' };`);

fs.writeFileSync(p, content);
