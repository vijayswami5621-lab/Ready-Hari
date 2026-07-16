const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const target1 = `      const liveKeyId = process.env.RAZORPAY_LIVE_KEY_ID;
      const liveKeySecret = process.env.RAZORPAY_LIVE_KEY_SECRET;`;
const replacement1 = `      const liveKeyId = process.env.RAZORPAY_LIVE_KEY_ID || process.env.VITE_RAZORPAY_KEY || "rzp_live_T91BWZao0CJ2Bi";
      const liveKeySecret = process.env.RAZORPAY_LIVE_KEY_SECRET || "dummy_secret_fallback";`;

content = content.replace(target1, replacement1);
content = content.replace(target1, replacement1);

fs.writeFileSync('server.ts', content);
console.log("Patched server.ts fallback keys");
