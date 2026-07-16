const fs = require('fs');
const path = require('path');
const p = path.resolve('server.ts');
let content = fs.readFileSync(p, 'utf8');

const awbTarget = `      let trackingNumber = hasValidShiprocket ? '' : \`DEMO-AWB\${Math.floor(10000000 + Math.random() * 90000000)}\`;
      let courierName = hasValidShiprocket ? '' : 'Demo Courier (Test Mode)';`;
const awbReplacement = `      let trackingNumber = '';
      let courierName = '';`;

content = content.replace(awbTarget, awbReplacement);
fs.writeFileSync(p, content);
