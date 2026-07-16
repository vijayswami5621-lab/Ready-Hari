const fs = require('fs');
const path = require('path');
const p = path.resolve('src/pages/adhyayan/CategoryDetailsScreen.tsx');
let content = fs.readFileSync(p, 'utf8');

if (!content.includes('NotFoundScreen')) {
  content = content.replace(/import \{ useGoBack \} from "\.\.\/\.\.\/hooks\/useGoBack";/, 'import { useGoBack } from "../../hooks/useGoBack";\nimport { NotFoundScreen } from "../misc/NotFoundScreen";');
}

content = content.replace(/const category = dbCategories\.find\(c => c\.id === id\) \|\| \{ name: 'Adhyayan', description: 'Spiritual knowledge', image: '' \};/, `const category = dbCategories.find(c => c.id === id);

  if (!loading && !category) {
    return <NotFoundScreen />;
  }`);

fs.writeFileSync(p, content);
