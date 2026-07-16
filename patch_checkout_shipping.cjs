const fs = require('fs');
const path = require('path');
const p = path.resolve('src/pages/store/CheckoutScreen.tsx');
let content = fs.readFileSync(p, 'utf8');

const target = `        const res = await fetch("/api/shipping/calculate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            pincode: selectedAddr.pincode,
            weight: totalWeight,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.shippingFee !== undefined) {
            setCalculatedShipping(data.shippingFee);
          }
        }`;

const replacement = `        const data = await fetchApi("/api/shipping/calculate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            pincode: selectedAddr.pincode,
            weight: totalWeight,
          }),
        });
        if (data.shippingFee !== undefined) {
          setCalculatedShipping(data.shippingFee);
        }`;

content = content.replace(target, replacement);

fs.writeFileSync(p, content);
