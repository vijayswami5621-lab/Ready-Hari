const fs = require('fs');
const path = require('path');
const p = path.resolve('server.ts');
let content = fs.readFileSync(p, 'utf8');

content = content.replace(/console\.warn\("FreeAstroAPI limit or error:", error\.response\?\.data\?\.error \|\| error\.message\);/, 'console.log("FreeAstroAPI limit or error:", error.response?.data?.error || error.message);');

fs.writeFileSync(p, content);
