const fs = require('fs');
const path = require('path');

const contextPath = path.join(__dirname, 'src/contexts/AppSettingsContext.tsx');
let content = fs.readFileSync(contextPath, 'utf8');

content = content.replace("appUrl?: string;\n    baseUrl: string;\n    appUrl: string;", "baseUrl: string;\n    appUrl: string;");

fs.writeFileSync(contextPath, content);
