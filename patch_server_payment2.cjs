const fs = require('fs');
const path = require('path');
const p = path.resolve('server.ts');
let content = fs.readFileSync(p, 'utf8');

// For create-order
content = content.replace(/      if \(hasValidLiveKeys\) \{[\s\S]*?key_secret \= liveKeySecret;\n      \}\n\n      if \(configDoc && configDoc\.exists\(\)\) \{[\s\S]*?key_secret = process\.env\.RAZORPAY_TEST_KEY_SECRET \|\| key_secret;\n        \}\n      \}/g, `
      if (configDoc && configDoc.exists()) {
        const data = configDoc.data();
        
        // Auto Mode Detection Logic
        const isLiveMode = data.enabled === true && data.onlinePayment === true && data.testMode === false && typeof data.keyId === 'string' && data.keyId.startsWith('rzp_live_');
        
        if (isLiveMode) {
          mode = 'live';
          key_id = data.keyId;
          key_secret = data.keySecret || liveKeySecret || '';
        } else {
          mode = 'test';
          key_id = (data.testMode === true || (typeof data.keyId === 'string' && data.keyId.startsWith('rzp_test_'))) ? data.keyId : (process.env.RAZORPAY_TEST_KEY_ID || 'dummy');
          key_secret = data.keySecret || process.env.RAZORPAY_TEST_KEY_SECRET || 'dummy';
        }
      } else if (hasValidLiveKeys) {
        mode = 'live';
        key_id = liveKeyId;
        key_secret = liveKeySecret;
      }`);

fs.writeFileSync(p, content);
