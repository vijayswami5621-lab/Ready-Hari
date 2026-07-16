const fs = require('fs');
const path = require('path');

const serverPath = path.resolve('server.ts');
let content = fs.readFileSync(serverPath, 'utf8');

const target = `      if (!key_id || !key_secret || key_id.includes('dummy') || key_secret.includes('dummy')) {
        return res.status(400).json({ error: "Payment configuration is incomplete. Please try again later or contact support." });
      }`;

const replacement = `      if (!key_id || !key_secret || key_id.includes('dummy') || key_secret.includes('dummy')) {
        // Mock payment order for preview mode
        return res.json({ 
          orderId: \`mock_order_\${Date.now()}\`, 
          amount: Math.round(amount * 100), 
          currency, 
          mode: 'mock' 
        });
      }`;

content = content.replace(target, replacement);
fs.writeFileSync(serverPath, content);
console.log("Patched server.ts payment order");
