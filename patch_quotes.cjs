const fs = require('fs');
const path = require('path');
const p = path.resolve('src/pages/info/QuotesScreen.tsx');
let content = fs.readFileSync(p, 'utf8');

if (!content.includes('useShareContent')) {
  // Insert import
  content = content.replace(/import \{ useGoBack \} from "\.\.\/\.\.\/hooks\/useGoBack";/, 'import { useGoBack } from "../../hooks/useGoBack";\nimport { useShareContent } from "../../hooks/useShareContent";');
  
  // Initialize hook
  content = content.replace(/const goBack = useGoBack\(\);/, 'const goBack = useGoBack();\n  const { shareContent } = useShareContent();');
  
  // Replace handleShare
  content = content.replace(/const handleShare = async \(quote: any\) => \{[\s\S]*?\} catch \(error\) \{[\s\S]*?\}[\s\S]*?\};/, `const handleShare = async (quote: any) => {
    await shareContent({
      title: 'Divine Quote',
      text: quote.text,
      urlPath: \`/quotes?id=\${quote.id}\`
    });
  };`);
  
  fs.writeFileSync(p, content);
}
