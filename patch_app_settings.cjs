const fs = require('fs');
const path = require('path');
const p = path.resolve('src/contexts/AppSettingsContext.tsx');
let content = fs.readFileSync(p, 'utf8');

content = content.replace(/shareConfig\?\: \{[\s\S]*?\};\n  buttons\:/, `shareConfig?: {
    baseUrl: string;
    playStoreUrl: string;
    shareEnabled: boolean;
    deepLinkEnabled: boolean;
    defaultTitle: string;
    defaultDescription: string;
    footerMessage: string;
    defaultMessage: string;
    socialCaption: string;
  };
  buttons:`);

content = content.replace(/shareConfig\: \{[\s\S]*?socialCaption\: \'Jai Siyaram 🙏\',[\s\S]*?\},/, `shareConfig: {
    baseUrl: 'https://haripathshala.com',
    playStoreUrl: 'https://play.google.com/store/apps/details?id=com.haripathshala.app',
    shareEnabled: true,
    deepLinkEnabled: true,
    defaultTitle: 'Hari Pathshala - Spiritual Education',
    defaultDescription: 'Discover inner peace with premium spiritual courses and authentic Puja items.',
    footerMessage: 'Download Hari Pathshala app for more.',
    defaultMessage: 'Check this out on Hari Pathshala!',
    socialCaption: 'Jai Siyaram 🙏',
  },`);

fs.writeFileSync(p, content);
