const fs = require('fs');
const path = require('path');

// 1. CategoryDetailsScreen
let p = path.resolve('src/pages/adhyayan/CategoryDetailsScreen.tsx');
let content = fs.readFileSync(p, 'utf8');
if (!content.includes('import { useShareContent }')) {
  content = content.replace(/import \{ useGoBack \} from "\.\.\/\.\.\/hooks\/useGoBack";/, "import { useGoBack } from '../../hooks/useGoBack';\nimport { useShareContent } from '../../hooks/useShareContent';");
  fs.writeFileSync(p, content);
}

// 2. ProfileScreen
p = path.resolve('src/pages/profile/ProfileScreen.tsx');
content = fs.readFileSync(p, 'utf8');
if (!content.includes('import { useShareContent }')) {
  content = content.replace(/import \{ useAuthStore \} from "\.\.\/\.\.\/store\/useAuthStore";/, "import { useAuthStore } from '../../store/useAuthStore';\nimport { useShareContent } from '../../hooks/useShareContent';");
  fs.writeFileSync(p, content);
}
if (!content.includes('const { shareContent } = useShareContent()')) {
  content = content.replace(/const \{ user, logout \} = useAuthStore\(\);/, "const { user, logout } = useAuthStore();\n  const { shareContent } = useShareContent();");
  fs.writeFileSync(p, content);
}

// 3. QuotesScreen
p = path.resolve('src/pages/info/QuotesScreen.tsx');
content = fs.readFileSync(p, 'utf8');
if (!content.includes('import { NotFoundScreen }')) {
  content = content.replace(/import \{ Search \} from "lucide-react";/, "import { Search } from 'lucide-react';\nimport { NotFoundScreen } from '../misc/NotFoundScreen';");
  fs.writeFileSync(p, content);
}

// 4. Delete test-build.ts
if (fs.existsSync('test-build.ts')) {
  fs.unlinkSync('test-build.ts');
}

