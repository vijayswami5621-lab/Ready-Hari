const fs = require('fs');
const path = require('path');
const p = path.resolve('src/components/SmartBanner.tsx');
let content = fs.readFileSync(p, 'utf8');

content = content.replace(/fixed top-0 left-0 right-0 z-50/, "fixed bottom-0 left-0 right-0 z-[100] pb-safe");
content = content.replace(/initial=\{\{ y: -100 \}\}/, "initial={{ y: 100 }}");
content = content.replace(/exit=\{\{ y: -100 \}\}/, "exit={{ y: 100 }}");

fs.writeFileSync(p, content);
