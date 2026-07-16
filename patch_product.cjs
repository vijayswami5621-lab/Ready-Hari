const fs = require('fs');
const path = require('path');
const p = path.resolve('src/pages/store/ProductDetailsScreen.tsx');
let content = fs.readFileSync(p, 'utf8');

content = content.replace(/const displayTitle = product\.name \|\| product\.title;/, "const displayTitle = product?.name || product?.title || 'Product Details';");
fs.writeFileSync(p, content);
