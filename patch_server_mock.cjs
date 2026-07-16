const fs = require('fs');
const path = require('path');
const p = path.resolve('server.ts');
let content = fs.readFileSync(p, 'utf8');

const target = `      if (!key_id || !key_secret || key_id.includes('dummy') || key_secret.includes('dummy')) {
        // Fallback to completely mock mode if config is missing
        mode = 'test';
        return res.json({ 
          orderId: \`mock_order_\${Date.now()}\`, 
          amount: Math.round(amount * 100), 
          currency, 
          mode,
          mock: true
        });
      }`;

const replacement = `      if (!key_id || !key_secret || key_id.includes('dummy') || key_secret.includes('dummy')) {
        return res.status(400).json({ error: "Payment configuration is incomplete. Please try again later or contact support." });
      }`;

content = content.replace(target, replacement);

fs.writeFileSync(p, content);
