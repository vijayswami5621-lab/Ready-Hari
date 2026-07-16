const fs = require('fs');
const path = require('path');

const rzpPath = path.resolve('src/services/razorpayService.ts');
let content = fs.readFileSync(rzpPath, 'utf8');

const target = `    return new Promise((resolve, reject) => {
      const finalOptions = {`;

const replacement = `    // Mock payment resolution for missing keys in preview mode
    if (this.razorpayKey === 'rzp_test_dummy_key' || this.razorpayKey.includes('dummy')) {
      console.log("Mocking Razorpay payment success due to dummy keys.");
      return Promise.resolve({
        razorpay_payment_id: \`mock_pay_\${Date.now()}\`,
        razorpay_order_id: options.order_id,
        razorpay_signature: "mock_signature"
      });
    }

    return new Promise((resolve, reject) => {
      const finalOptions = {`;

content = content.replace(target, replacement);
fs.writeFileSync(rzpPath, content);
console.log("Patched razorpay frontend mock");
