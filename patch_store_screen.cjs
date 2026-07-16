const fs = require('fs');

let content = fs.readFileSync('src/pages/store/StoreScreen.tsx', 'utf8');

const demoProductsRegex = /const DEMO_PRODUCTS = \[\s*\{[\s\S]*?\}\s*\];/;
content = content.replace(demoProductsRegex, '');

content = content.replace(/  const products = dbProducts.length > 0 \? dbProducts : DEMO_PRODUCTS;/g, '  const products = dbProducts;');

fs.writeFileSync('src/pages/store/StoreScreen.tsx', content);
console.log("Patched StoreScreen");
