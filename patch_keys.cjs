const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

content = content.replace(/!liveKeyId\.includes\(''\) && !liveKeySecret\.includes\(''\)/g, 'liveKeyId && liveKeySecret');
content = content.replace(/key_id\.includes\(''\) \|\| key_secret\.includes\(''\)/g, '!key_id || !key_secret');

fs.writeFileSync('server.ts', content);
console.log("Patched server keys");
