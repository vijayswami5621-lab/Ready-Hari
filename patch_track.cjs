const fs = require('fs');
const p = 'src/pages/store/TrackOrderScreen.tsx';
let content = fs.readFileSync(p, 'utf8');

content = content.replace(
  `let name = order.shippingDetails?.name;`,
  `let name = order.customerInfo?.fullName || order.shippingDetails?.name;`
);

content = content.replace(
  `let mobile = order.shippingDetails?.phone;`,
  `let mobile = order.customerInfo?.mobile || order.shippingDetails?.phone;`
);

fs.writeFileSync(p, content);
