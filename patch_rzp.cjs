const fs = require('fs');
const path = require('path');
const p = path.resolve('src/services/razorpayService.ts');
let content = fs.readFileSync(p, 'utf8');

content = content.replace(/if \(data\.paymentMode === 'live'\) \{[\s\S]*?\} else \{[\s\S]*?\}/, `
        const isLiveMode = data.enabled === true && data.onlinePayment === true && data.testMode === false && typeof data.keyId === 'string' && data.keyId.startsWith('rzp_live_');
        
        if (isLiveMode) {
          data.calculatedMode = 'live';
          return data.keyId;
        } else {
          data.calculatedMode = 'test';
          return data.keyId || 'rzp_test_dummy_key';
        }
`);

fs.writeFileSync(p, content);
