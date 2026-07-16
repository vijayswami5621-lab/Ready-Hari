const fs = require('fs');

let content = fs.readFileSync('src/services/razorpayService.ts', 'utf8');

const target = `    // Mock payment resolution for missing keys in preview mode
    if (this.razorpayKey === 'rzp_test_dummy_key' || this.razorpayKey.includes('dummy')) {
      console.log("Mocking Razorpay payment success due to dummy keys.");
      return Promise.resolve({
        razorpay_payment_id: \`mock_pay_\${Date.now()}\`,
        razorpay_order_id: options.order_id,
        razorpay_signature: "mock_signature"
      });
    }`;

content = content.replace(target, '');
fs.writeFileSync('src/services/razorpayService.ts', content);
console.log("Removed Razorpay mock resolution");
