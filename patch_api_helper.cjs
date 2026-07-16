const fs = require('fs');
const path = require('path');
const p = path.resolve('src/utils/apiHelper.ts');
let content = fs.readFileSync(p, 'utf8');

const target = `    const errorMsg = typeof data === 'object' && data?.error ? data.error : (typeof data === 'string' ? data : 'An error occurred while processing your request.');`;

const replacement = `    let errorMsg = 'An error occurred while processing your request.';
    if (typeof data === 'object' && data?.error) {
      errorMsg = data.error;
    } else if (typeof data === 'string' && !data.trim().startsWith('<')) {
      errorMsg = data;
    }`;

content = content.replace(target, replacement);
fs.writeFileSync(p, content);
