const fs = require('fs');
const path = require('path');
const p = path.resolve('src/pages/store/ProductDetailsScreen.tsx');
let content = fs.readFileSync(p, 'utf8');

if (!content.includes('useShareContent')) {
  // Insert import
  content = content.replace(/import \{ useGoBack \} from "\.\.\/\.\.\/hooks\/useGoBack";/, 'import { useGoBack } from "../../hooks/useGoBack";\nimport { useShareContent } from "../../hooks/useShareContent";');
  
  // Initialize hook
  content = content.replace(/const goBack = useGoBack\(\);/, 'const goBack = useGoBack();\n  const { shareContent } = useShareContent();');
  
  // Add handler function
  content = content.replace(/const isWishlisted = wishlist\.some\(.*?;\n/, 'const isWishlisted = wishlist.some((item) => item.id === product?.id);\n  const handleShare = async () => {\n    if (!product) return;\n    await shareContent({\n      title: product.title,\n      urlPath: `/store/product/${product.id}`\n    });\n  };\n');
  
  // Update button onClick
  content = content.replace(/<button className="text-brown-light hover:text-saffron transition">[\s]*<Share2 size=\{20\} \/>[\s]*<\/button>/, '<button onClick={handleShare} className="text-brown-light hover:text-saffron transition">\n              <Share2 size={20} />\n            </button>');
  
  fs.writeFileSync(p, content);
}
