const fs = require('fs');
const path = require('path');
const p = path.resolve('src/pages/home/HomeScreen.tsx');
let content = fs.readFileSync(p, 'utf8');

content = content.replace(/const baseUrl \= config\.baseUrl \|\| \'https\:\/\/haripathshala\.com\';/, `let baseUrl = config.baseUrl || 'https://haripathshala.com';
          if (baseUrl.includes('localhost') || baseUrl.includes('run.app')) {
            baseUrl = 'https://haripathshala.com';
          }`);

fs.writeFileSync(p, content);
