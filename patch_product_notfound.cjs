const fs = require('fs');
const path = require('path');
const p = path.resolve('src/pages/store/ProductDetailsScreen.tsx');
let content = fs.readFileSync(p, 'utf8');

// Insert NotFoundScreen import
if (!content.includes('NotFoundScreen')) {
  content = content.replace(/import \{ useGoBack \} from "\.\.\/\.\.\/hooks\/useGoBack";/, 'import { useGoBack } from "../../hooks/useGoBack";\nimport { NotFoundScreen } from "../misc/NotFoundScreen";');
}

// Remove mock fallback and replace with NotFound
content = content.replace(/const dbProduct = products\.find\(\(p\) => p\.id === id\);\n  const product = dbProduct \|\| \{ \.\.\.MOCK_PRODUCT, id: id \|\| "1" \};\n\n  const images =[\s\S]*?MOCK_PRODUCT\.images;/, `const dbProduct = products.find((p) => p.id === id);
  const product = dbProduct;

  if (!loading && !product) {
    return <NotFoundScreen />;
  }

  const images = product?.images?.length > 0 ? product.images : (product?.image ? [product.image] : []);`);

fs.writeFileSync(p, content);
