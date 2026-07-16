const fs = require('fs');
const path = require('path');
const p = path.resolve('src/services/panchangService.ts');
let content = fs.readFileSync(p, 'utf8');

content = content.replace(/apiData = await response\.json\(\);/, `apiData = await response.json();
      if (!response.ok || apiData.error) {
         apiData = null; // force cache fallback
      }`);

fs.writeFileSync(p, content);
