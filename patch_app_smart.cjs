const fs = require('fs');
const path = require('path');
const p = path.resolve('src/App.tsx');
let content = fs.readFileSync(p, 'utf8');

if (!content.includes('import { SmartBanner }')) {
  content = content.replace(/import \{ OfflineOverlay \}/, "import { SmartBanner } from './components/SmartBanner';\nimport { OfflineOverlay }");
  content = content.replace(/<OfflineOverlay \/>/, "<OfflineOverlay />\n          <SmartBanner />");
  fs.writeFileSync(p, content);
}
