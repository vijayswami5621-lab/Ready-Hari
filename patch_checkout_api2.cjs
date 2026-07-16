const fs = require('fs');
const path = require('path');
const p = path.resolve('src/pages/store/CheckoutScreen.tsx');
let content = fs.readFileSync(p, 'utf8');

const target = `      const verifyRes = await fetch("/api/payment/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          razorpay_order_id: orderId,
          razorpay_payment_id: paymentId,
          razorpay_signature: signature,
          orderData: {
            userId: user?.uid,
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

      let verifyData;
      const verifyResClone = verifyRes.clone();
      try {
        verifyData = await verifyRes.json();
      } catch(err) {
        throw new Error(
          (await verifyResClone.text()) || "Failed to parse server response"
        );
      }

      if (!verifyRes.ok) {
        throw new Error(verifyData.error || "Payment verification failed");
      }`;

const replacement = `      const verifyData = await fetchApi("/api/payment/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          razorpay_order_id: orderId,
          razorpay_payment_id: paymentId,
          razorpay_signature: signature,
          orderData: {
            userId: user?.uid,
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
      });`;

// Try an intelligent regex replacement
content = content.replace(/const verifyRes = await fetch\("\/api\/payment\/verify"[\s\S]*?throw new Error\(verifyData\.error \|\| "Payment verification failed"\);\n      \}/, replacement);

fs.writeFileSync(p, content);
