const fs = require('fs');
const path = require('path');
const p = path.resolve('src/pages/store/ProductDetailsScreen.tsx');
let content = fs.readFileSync(p, 'utf8');

content = content.replace(/const hasDiscount =[\s\S]*?product\.price;/, "const hasDiscount = product?.discountPrice && product?.discountPrice < (product?.price || 0);");
fs.writeFileSync(p, content);
