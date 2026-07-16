const fs = require('fs');
const path = require('path');
const p = path.resolve('src/pages/adhyayan/VideoPlayerScreen.tsx');
let content = fs.readFileSync(p, 'utf8');

if (!content.includes('NotFoundScreen')) {
  content = content.replace(/import \{ useGoBack \} from "\.\.\/\.\.\/hooks\/useGoBack";/, 'import { useGoBack } from "../../hooks/useGoBack";\nimport { NotFoundScreen } from "../misc/NotFoundScreen";');
}

content = content.replace(/if \(!video \|\| video\.publishStatus === false \|\| video\.publishStatus === 'draft' \|\| video\.isActive === false\) \{[\s\S]*?return \([\s\S]*?<\/div>\n    \);\n  \}/, `if (!loading && (!video || video.publishStatus === false || video.publishStatus === 'draft' || video.isActive === false)) {
    return <NotFoundScreen />;
  }`);

fs.writeFileSync(p, content);
