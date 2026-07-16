const fs = require('fs');
const path = require('path');
const p = path.resolve('server.ts');
let content = fs.readFileSync(p, 'utf8');

const target1 = `pickup_location: shippingData.pickupLocation || "Primary",`;
const replacement1 = `pickup_location: shippingData.pickupLocation || "Panchmukhi Hanuman Mandir, Guwardi Petrol Pump ke Samne, Kaladera, Jaipur, Rajasthan",`;

content = content.replace(target1, replacement1);
fs.writeFileSync(p, content);
