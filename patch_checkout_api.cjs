const fs = require('fs');
const path = require('path');
const p = path.resolve('src/pages/store/CheckoutScreen.tsx');
let content = fs.readFileSync(p, 'utf8');

// Add import
if (!content.includes('fetchApi')) {
  content = content.replace(/import \{ RazorpayCheckoutManager \} from "\.\.\/\.\.\/services\/razorpayService";/, 'import { RazorpayCheckoutManager } from "../../services/razorpayService";\nimport { fetchApi } from "../../utils/apiHelper";');
}

// Update fetch for create-order
content = content.replace(/      const createOrderRes = await fetch\("\/api\/payment\/create-order", \{\n        method\: "POST",\n        headers\: \{ "Content-Type"\: "application\/json" \},\n        body\: JSON\.stringify\(\{ amount\: finalAmount, currency\: "INR" \}\),\n      \}\);[\s\S]*?if \(orderDataResponse\.mock\) \{/m, `
      const orderDataResponse = await fetchApi("/api/payment/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: finalAmount, currency: "INR" }),
      });
      if (orderDataResponse.mock) {`);

// Update fetch for verify
content = content.replace(/      const verifyRes = await fetch\("\/api\/payment\/verify", \{\n        method\: "POST",\n        headers\: \{ "Content-Type"\: "application\/json" \},\n        body\: JSON\.stringify\(\{\n          razorpay_order_id\: orderId,\n          razorpay_payment_id\: paymentId,\n          razorpay_signature\: signature,\n          orderData\: \{\n            userId\: user\.uid,\n            items\: cart,\n            totalAmount\: finalAmount,\n            subtotal\: total,\n            shippingFee\: shipping,\n            shippingAddress\: address,\n            customerInfo\: customerInfo,\n            paymentMethod\: paymentMethod,\n          \},\n          cart\: cart,\n        \}\),\n      \}\);[\s\S]*?if \(!verifyRes\.ok\) \{[\s\S]*?\}[\s\S]*?clearCart\(\);/m, `
      const verifyData = await fetchApi("/api/payment/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          razorpay_order_id: orderId,
          razorpay_payment_id: paymentId,
          razorpay_signature: signature,
          orderData: {
            userId: user.uid,
            items: cart,
            totalAmount: finalAmount,
            subtotal: total,
            shippingFee: shipping,
            shippingAddress: address,
            customerInfo: customerInfo,
            paymentMethod: paymentMethod,
          },
          cart: cart,
        }),
      });
      clearCart();`);

fs.writeFileSync(p, content);
