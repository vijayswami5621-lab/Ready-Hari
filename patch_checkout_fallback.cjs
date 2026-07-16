const fs = require('fs');
let content = fs.readFileSync('src/pages/store/CheckoutScreen.tsx', 'utf8');

const regex = /      const razorpayKey = isLiveMode \? activeSettings\.keyId : \(activeSettings\?\.keyId \|\| ""\);/;
content = content.replace(regex, `      const fallbackKey = import.meta.env.VITE_RAZORPAY_KEY || "rzp_live_T91BWZao0CJ2Bi";
      const razorpayKey = isLiveMode ? activeSettings.keyId : (activeSettings?.keyId || fallbackKey);`);

fs.writeFileSync('src/pages/store/CheckoutScreen.tsx', content);
console.log("Patched CheckoutScreen fallback");
