const fs = require('fs');
const path = require('path');
const p = path.resolve('src/pages/store/CheckoutScreen.tsx');
let content = fs.readFileSync(p, 'utf8');

const target = `      if (orderDataResponse.mock) {
        // Mock payment flow for test mode without credentials
        setTimeout(async () => {
          await handleOrderCreation(
            \`mock_payment_\${Date.now()}\`,
            orderDataResponse.orderId,
            "mock_signature",
            selectedAddr,
          );
        }, 1500);
        return;
      }`;

const replacement = ``;

content = content.replace(target, replacement);

fs.writeFileSync(p, content);
