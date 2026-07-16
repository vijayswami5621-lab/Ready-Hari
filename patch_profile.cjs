const fs = require('fs');
const path = require('path');
const p = path.resolve('src/pages/profile/ProfileScreen.tsx');
let content = fs.readFileSync(p, 'utf8');

if (!content.includes('useShareContent')) {
  // Add import
  content = content.replace(/import \{ useAuthStore \} from "\.\.\/\.\.\/store\/useAuthStore";/, 'import { useAuthStore } from "../../store/useAuthStore";\nimport { useShareContent } from "../../hooks/useShareContent";');
  
  // Add hook
  content = content.replace(/const \{ user, logout \} = useAuthStore\(\);/, 'const { user, logout } = useAuthStore();\n  const { shareContent } = useShareContent();');
}

// Replace handleShareApp
content = content.replace(/const handleShareApp = async \(\) => \{[\s\S]*?\} catch \(err\) \{[\s\S]*?\}[\s\S]*?\};/, `const handleShareApp = async () => {
    await shareContent({
      title: "Hari Pathshala App",
      urlPath: '/'
    });
  };`);

fs.writeFileSync(p, content);
