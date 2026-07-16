const fs = require('fs');
const path = require('path');
const p = path.resolve('src/pages/store/ProductDetailsScreen.tsx');
let content = fs.readFileSync(p, 'utf8');

content = content.replace(/const originalPrice = product\.price;/, "const originalPrice = product?.price || 0;");
content = content.replace(/const sellingPrice =[\s\S]*?\: product\.price;/, "const sellingPrice = product?.discountPrice && product?.discountPrice < (product?.price || 0) ? product.discountPrice : (product?.price || 0);");
content = content.replace(/const isOutOfStock = product\.stock <= 0 \|\| product\.inStock === false;/, "const isOutOfStock = (product?.stock !== undefined && product.stock <= 0) || product?.inStock === false;");

fs.writeFileSync(p, content);
