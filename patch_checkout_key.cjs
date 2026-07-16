const fs = require('fs');
const path = require('path');

const checkoutPath = path.resolve('src/pages/store/CheckoutScreen.tsx');
let content = fs.readFileSync(checkoutPath, 'utf8');

const target = 'const razorpayKey = isLiveMode ? activeSettings.keyId : (activeSettings.keyId || "rzp_test_dummy_key");';
const replacement = 'const razorpayKey = activeSettings?.keyId || "rzp_live_T91BWZao0CJ2Bi";';

if(content.includes(target)) {
    content = content.replace(target, replacement);
    fs.writeFileSync(checkoutPath, content);
    console.log("Patched CheckoutScreen razorpayKey");
} else {
    console.log("Target not found in CheckoutScreen");
}
