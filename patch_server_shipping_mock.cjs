const fs = require('fs');
const path = require('path');
const p = path.resolve('server.ts');
let content = fs.readFileSync(p, 'utf8');

const targetCalcMock = `      if (mode === 'test') {
        // Mock calculation based on pincode digits and weight
        // e.g. base 40, plus weight factor
        if (pincode) {
           const firstDigit = parseInt(pincode.toString()[0] || "3", 10);
           // If delivery is in Rajasthan (starts with 3), slightly cheaper
           const isRajasthan = firstDigit === 3;
           shippingFee = isRajasthan ? 40 : 65;
           shippingFee += (weight * 10); // add for weight
        } else {
           shippingFee = 50;
        }
      }`;

const replacementCalcMock = `      if (mode === 'test' && !hasValidShiprocket) {
        // Mock calculation based on pincode digits and weight
        // e.g. base 40, plus weight factor
        if (pincode) {
           const firstDigit = parseInt(pincode.toString()[0] || "3", 10);
           // If delivery is in Rajasthan (starts with 3), slightly cheaper
           const isRajasthan = firstDigit === 3;
           shippingFee = isRajasthan ? 40 : 65;
           shippingFee += (weight * 10); // add for weight
        } else {
           shippingFee = 50;
        }
      } else if (mode === 'test' && hasValidShiprocket) {
        return res.status(500).json({ error: "Failed to calculate live shipping charges" });
      }`;

content = content.replace(targetCalcMock, replacementCalcMock);

const targetCatchMock = `        } catch(err: any) {
          console.warn("Shiprocket calculate failed, falling back to mock:", err.message);
        }`;

const replacementCatchMock = `        } catch(err: any) {
          console.warn("Shiprocket calculate failed:", err.message);
        }`;

content = content.replace(targetCatchMock, replacementCatchMock);

const targetAwbFallback = `      let trackingNumber = \`DEMO-AWB\${Math.floor(10000000 + Math.random() * 90000000)}\`; // Mock AWB
      let courierName = 'Demo Courier (Test Mode)';

      const shippingData = (shippingDoc && shippingDoc.exists()) ? shippingDoc.data() : {};
      const email = shippingData.shiprocketEmail || process.env.SHIPROCKET_EMAIL;
      const password = shippingData.shiprocketPassword || process.env.SHIPROCKET_PASSWORD;
      const hasValidShiprocket = shippingData.shiprocketEnabled === true && email && password && email !== 'test@example.com' && password !== 'password123';
      
      if (hasValidShiprocket) {
         trackingNumber = '';
         courierName = '';`;

const replacementAwbFallback = `      const shippingData = (shippingDoc && shippingDoc.exists()) ? shippingDoc.data() : {};
      const email = shippingData.shiprocketEmail || process.env.SHIPROCKET_EMAIL;
      const password = shippingData.shiprocketPassword || process.env.SHIPROCKET_PASSWORD;
      const hasValidShiprocket = shippingData.shiprocketEnabled === true && email && password && email !== 'test@example.com' && password !== 'password123';
      
      let trackingNumber = hasValidShiprocket ? '' : \`DEMO-AWB\${Math.floor(10000000 + Math.random() * 90000000)}\`;
      let courierName = hasValidShiprocket ? '' : 'Demo Courier (Test Mode)';
      
      if (hasValidShiprocket) {`;

content = content.replace(targetAwbFallback, replacementAwbFallback);


fs.writeFileSync(p, content);
