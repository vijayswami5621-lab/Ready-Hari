const fs = require('fs');
const path = require('path');

const homePath = path.join(__dirname, 'src/pages/home/HomeScreen.tsx');
let content = fs.readFileSync(homePath, 'utf8');

const target = `
          let baseUrl = config.baseUrl || 'https://haripathshala.com';
          if (baseUrl.includes('localhost') || baseUrl.includes('run.app')) {
            baseUrl = 'https://haripathshala.com';
          }
          const quoteUrl = selectedQuoteForShare ? \`\${baseUrl}/quote/\${selectedQuoteForShare.id}\` : baseUrl;
          const combinedText = \`\${config.socialCaption || ''}\\n\\n\${config.defaultMessage}\\n\${quoteUrl}\\n\\n\${config.footerMessage || ''}\`.trim();
`;

const replacement = `
          const appUrl = config.appUrl || 'https://play.google.com/store/apps/details?id=com.haripathshala';
          const quoteUrl = selectedQuoteForShare ? \`\\nContent ID:\\n\${selectedQuoteForShare.id}\` : '';
          const combinedText = \`🌿 Hari Pathshala\\n\\n\${config.defaultMessage || ''}\\n\\n📲 Install Hari Pathshala:\\n\${appUrl}\\n\${quoteUrl}\\n\\n\${config.socialCaption || '🙏 Jai Siyaram'}\`.trim();
`;

content = content.replace(target, replacement);

fs.writeFileSync(homePath, content);
console.log("Patched HomeScreen.tsx");
