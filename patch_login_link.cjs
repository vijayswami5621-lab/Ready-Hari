const fs = require('fs');
const path = require('path');
const p = path.resolve('src/pages/auth/LoginScreen.tsx');
let content = fs.readFileSync(p, 'utf8');

content = content.replace(/to="\/auth\/register"/, 'to="/auth/register" state={{ from }}');

fs.writeFileSync(p, content);
