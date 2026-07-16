const fs = require('fs');
let content = fs.readFileSync('src/pages/adhyayan/AdhyayanScreen.tsx', 'utf8');

const regex = /const MOCK_CATEGORIES = \[\s*\{[\s\S]*?\}\s*\];/;
content = content.replace(regex, '');

content = content.replace(/ \? dbCategories\.map\(\(c: any\) => \(\{\n      id: c\.id,\n      title: c\.name,\n      icon: BookOpen,\n      count: c\.count \|\| 0\n    \}\)\) : MOCK_CATEGORIES;/g, ' ? dbCategories.map((c: any) => ({\n      id: c.id,\n      title: c.name,\n      icon: BookOpen,\n      count: c.count || 0\n    })) : [];');

fs.writeFileSync('src/pages/adhyayan/AdhyayanScreen.tsx', content);
console.log("Patched AdhyayanScreen");
