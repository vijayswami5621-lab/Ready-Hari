const fs = require('fs');
const path = require('path');
const p = path.resolve('src/pages/home/HomeScreen.tsx');
let content = fs.readFileSync(p, 'utf8');

content = content.replace(/await navigator\.share\(\{\n            title: config\.defaultTitle,\n            text: config\.defaultMessage,\n            files: \[file\]\n          \}\);/, `
          const baseUrl = config.baseUrl || 'https://haripathshala.com';
          const quoteUrl = selectedQuoteForShare ? \`\${baseUrl}/quote/\${selectedQuoteForShare.id}\` : baseUrl;
          const combinedText = \`\${config.socialCaption || ''}\\n\\n\${config.defaultMessage}\\n\${quoteUrl}\\n\\n\${config.footerMessage || ''}\`.trim();
          
          await navigator.share({
            title: config.defaultTitle,
            text: combinedText,
            files: [file]
          });
`);

fs.writeFileSync(p, content);
