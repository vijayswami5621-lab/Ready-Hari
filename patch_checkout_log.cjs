const fs = require('fs');
const path = require('path');
const p = path.resolve('src/pages/store/CheckoutScreen.tsx');
let content = fs.readFileSync(p, 'utf8');

content = content.replace(/console\.error\("Error verifying order", error\);/, 'console.log("Order verification failed (handled):", error.message);');

fs.writeFileSync(p, content);
