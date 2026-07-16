const fs = require('fs');

let content = fs.readFileSync('src/pages/store/CheckoutScreen.tsx', 'utf8');

const regex = /      const isLiveMode = activeSettings\?\.enabled === true && activeSettings\?\.onlinePayment === true && activeSettings\?\.testMode === false && typeof activeSettings\?\.keyId === 'string' && activeSettings\.keyId\.startsWith\('rzp_live_'\);\n      const isLiveMode = activeSettings\?\.enabled === true && activeSettings\?\.onlinePayment === true && activeSettings\?\.testMode === false && typeof activeSettings\?\.keyId === 'string' && activeSettings\.keyId\.startsWith\('rzp_live_'\);/g;

content = content.replace(regex, `      const isLiveMode = activeSettings?.enabled === true && activeSettings?.onlinePayment === true && activeSettings?.testMode === false && typeof activeSettings?.keyId === 'string' && activeSettings.keyId.startsWith('rzp_live_');`);

fs.writeFileSync('src/pages/store/CheckoutScreen.tsx', content);
console.log("Fixed CheckoutScreen duplicate");
