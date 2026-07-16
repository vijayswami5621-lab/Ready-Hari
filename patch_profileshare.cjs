const fs = require('fs');
const path = require('path');
const p = path.resolve('src/pages/profile/ProfileScreen.tsx');
let content = fs.readFileSync(p, 'utf8');

if (!content.includes('const { shareContent } = useShareContent()')) {
  content = content.replace(/const \{ user, userData, logout \} = useAuthStore\(\);/, 'const { user, userData, logout } = useAuthStore();\n  const { shareContent } = useShareContent();');
  fs.writeFileSync(p, content);
}
