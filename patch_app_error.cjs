const fs = require('fs');
const path = require('path');
const p = path.resolve('src/App.tsx');
let content = fs.readFileSync(p, 'utf8');

if (!content.includes('import { ErrorBoundary }')) {
  content = content.replace(/import \{ OfflineOverlay \}/, "import { ErrorBoundary } from './components/ErrorBoundary';\nimport { OfflineOverlay }");
  content = content.replace(/<AppRouter \/>/, "<ErrorBoundary>\n            <AppRouter />\n          </ErrorBoundary>");
  fs.writeFileSync(p, content);
}
