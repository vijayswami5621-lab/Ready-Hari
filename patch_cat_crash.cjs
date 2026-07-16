const fs = require('fs');
const path = require('path');
const p = path.resolve('src/pages/adhyayan/CategoryDetailsScreen.tsx');
let content = fs.readFileSync(p, 'utf8');

content = content.replace(/const coverImage = category\.image/, "const coverImage = category?.image");
content = content.replace(/category\.description/g, "category?.description");
content = content.replace(/category\.name/g, "category?.name");

fs.writeFileSync(p, content);
