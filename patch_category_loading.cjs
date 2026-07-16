const fs = require('fs');
const path = require('path');
const p = path.resolve('src/pages/adhyayan/CategoryDetailsScreen.tsx');
let content = fs.readFileSync(p, 'utf8');

content = content.replace(/const \{ data: dbCategories \} = useRealtimeCollection<any>\('categories'\);/, "const { data: dbCategories, loading: catLoading } = useRealtimeCollection<any>('categories');");

content = content.replace(/if \(!loading && !category\) \{/, "if (!catLoading && !category) {");

fs.writeFileSync(p, content);
