const fs = require('fs');
const path = require('path');
const p = path.resolve('src/pages/info/QuotesScreen.tsx');
let content = fs.readFileSync(p, 'utf8');

if (!content.includes('import { NotFoundScreen }')) {
  content = content.replace(/import \{ useShareContent \} from "\.\.\/\.\.\/hooks\/useShareContent";/, 'import { useShareContent } from "../../hooks/useShareContent";\nimport { NotFoundScreen } from "../misc/NotFoundScreen";');
  fs.writeFileSync(p, content);
}
