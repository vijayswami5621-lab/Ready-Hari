const fs = require('fs');
const path = require('path');

const contextPath = path.join(__dirname, 'src/contexts/AppSettingsContext.tsx');
let content = fs.readFileSync(contextPath, 'utf8');

// Add appUrl to AppSettings interface
if (!content.includes('appUrl: string;')) {
  content = content.replace('appName: string;', 'appName: string;\n  appUrl?: string;');
}

if (!content.includes("appUrl: 'https://play.google.com/store/apps/details?id=com.haripathshala'")) {
  content = content.replace("appName: 'Hari Pathshala',", "appName: 'Hari Pathshala',\n  appUrl: 'https://play.google.com/store/apps/details?id=com.haripathshala',");
}

if (!content.includes("appUrl: string;")) {
  content = content.replace(/shareConfig\?: \{/, "shareConfig?: {\n    appUrl?: string;");
}

fs.writeFileSync(contextPath, content);
console.log("Patched AppSettingsContext.tsx");
