const fs = require('fs');
let content = fs.readFileSync('src/pages/store/CheckoutScreen.tsx', 'utf8');

content = content.replace(/      const razorpayKey = orderDataResponse\.mode === 'mock' \? 'rzp_test_dummy_key' : \(activeSettings\?\.keyId \|\| "rzp_live_T91BWZao0CJ2Bi"\);/, `      const isLiveMode = activeSettings?.enabled === true && activeSettings?.onlinePayment === true && activeSettings?.testMode === false && typeof activeSettings?.keyId === 'string' && activeSettings.keyId.startsWith('rzp_live_');
      const razorpayKey = isLiveMode ? activeSettings.keyId : (activeSettings?.keyId || "");`);

content = content.replace(/      if \(!razorpayKey\) \{\n        throw new Error\(\n          "Payment configuration is missing\. Please contact support\.",\n        \);\n      \}/, `      if (!razorpayKey || razorpayKey.includes('dummy')) {
        throw new Error(
          "Payment configuration is incomplete. Please try again later or contact support.",
        );
      }`);

fs.writeFileSync('src/pages/store/CheckoutScreen.tsx', content);
console.log("Patched CheckoutScreen");
