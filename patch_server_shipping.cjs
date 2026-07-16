const fs = require('fs');
const path = require('path');
const p = path.resolve('server.ts');
let content = fs.readFileSync(p, 'utf8');

// For /api/shipping/calculate
const calcTarget = `      const email = process.env.SHIPROCKET_EMAIL;
      const password = process.env.SHIPROCKET_PASSWORD;
      const hasValidShiprocket = email && password && email !== 'test@example.com' && password !== 'password123';
      
      let shippingFee = 0;
      let mode = 'test';

      if (hasValidShiprocket) {`;
      
const calcReplacement = `      let shippingConfigDoc: any = null;
      try {
        shippingConfigDoc = await getDoc(doc(db, 'settings', 'shipping'));
      } catch (err) {}
      const shippingData = (shippingConfigDoc && shippingConfigDoc.exists()) ? shippingConfigDoc.data() : {};
      
      const email = shippingData.shiprocketEmail || process.env.SHIPROCKET_EMAIL;
      const password = shippingData.shiprocketPassword || process.env.SHIPROCKET_PASSWORD;
      const hasValidShiprocket = shippingData.shiprocketEnabled === true && email && password && email !== 'test@example.com' && password !== 'password123';
      
      let shippingFee = 0;
      let mode = 'test';

      if (hasValidShiprocket) {`;

content = content.replace(calcTarget, calcReplacement);

// For /api/payment/verify and Shiprocket logic
const verifyTarget = `      const email = process.env.SHIPROCKET_EMAIL;
      const password = process.env.SHIPROCKET_PASSWORD;
      const hasValidShiprocket = email && password && email !== 'test@example.com' && password !== 'password123';
      const shippingData = (shippingDoc && shippingDoc.exists()) ? shippingDoc.data() : {};
      const useLiveShipping = hasValidShiprocket || shippingData.shiprocketEnabled;
      
      if (useLiveShipping && hasValidShiprocket) {`;

const verifyReplacement = `      const shippingData = (shippingDoc && shippingDoc.exists()) ? shippingDoc.data() : {};
      const email = shippingData.shiprocketEmail || process.env.SHIPROCKET_EMAIL;
      const password = shippingData.shiprocketPassword || process.env.SHIPROCKET_PASSWORD;
      const hasValidShiprocket = shippingData.shiprocketEnabled === true && email && password && email !== 'test@example.com' && password !== 'password123';
      
      if (hasValidShiprocket) {
         trackingNumber = '';
         courierName = '';`;

content = content.replace(verifyTarget, verifyReplacement);

fs.writeFileSync(p, content);
