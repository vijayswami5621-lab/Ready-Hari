const fs = require('fs');
const path = require('path');
const p = path.resolve('src/pages/store/CheckoutScreen.tsx');
let content = fs.readFileSync(p, 'utf8');

const target1 = `    if (!activeSettings.enabled) {
      setPaymentError("Payments are currently disabled by the administrator.");
      return;
    }`;

const replacement1 = `    if (activeSettings.enabled === false || activeSettings.onlinePayment === false) {
      setPaymentError("Payments are currently disabled by the administrator.");
      setLoading(false);
      return;
    }`;

content = content.replace(target1, replacement1);
fs.writeFileSync(p, content);
