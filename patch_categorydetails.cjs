const fs = require('fs');
const path = require('path');
const p = path.resolve('src/pages/adhyayan/CategoryDetailsScreen.tsx');
let content = fs.readFileSync(p, 'utf8');

content = content.replace(/if \(!catLoading && !category\) \{[\s\S]*?return <NotFoundScreen \/>;[\s\S]*?\}/, `if (catLoading) {
    return (
      <div className="min-h-screen bg-orange-50 dark:bg-slate-900 flex justify-center items-center">
        <div className="w-8 h-8 border-4 border-saffron border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  
  if (!category) {
    return <NotFoundScreen />;
  }`);

fs.writeFileSync(p, content);
