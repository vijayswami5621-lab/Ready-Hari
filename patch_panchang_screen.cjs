const fs = require('fs');
const p = 'src/pages/misc/PanchangScreen.tsx';
let content = fs.readFileSync(p, 'utf8');

content = content.replace(
  /const loadingMessages = \[\s*[^\]]+\s*\];/,
  `const loadingMessages = [
    "📿 Loading Today's Panchang...",
    "Connecting to FreeAstroAPI...",
    "Fetching Astronomical Data...",
    "Calculating Panchang...",
    "Loading Festivals...",
    "Preparing Today's Panchang..."
  ];`
);

fs.writeFileSync(p, content);
