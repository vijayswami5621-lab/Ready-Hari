const fs = require('fs');
const path = require('path');
const p = path.resolve('server.ts');
let content = fs.readFileSync(p, 'utf8');

const target = `      let isValid = false;
      if (razorpay_order_id.startsWith('mock_order_')) {
        isValid = true;
        mode = 'test';
      } else {
        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto
          .createHmac("sha256", key_secret)
          .update(body.toString())
          .digest("hex");
        
        isValid = expectedSignature === razorpay_signature;
      }`;

const replacement = `      if (!key_secret || key_secret.includes('dummy')) {
        return res.status(400).json({ error: "Payment configuration is incomplete. Verification failed." });
      }

      const body = razorpay_order_id + "|" + razorpay_payment_id;
      const expectedSignature = crypto
        .createHmac("sha256", key_secret)
        .update(body.toString())
        .digest("hex");
      
      let isValid = expectedSignature === razorpay_signature;`;

content = content.replace(target, replacement);

fs.writeFileSync(p, content);
