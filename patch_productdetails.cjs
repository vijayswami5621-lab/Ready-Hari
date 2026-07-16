const fs = require('fs');
const path = require('path');
const p = path.resolve('src/pages/store/ProductDetailsScreen.tsx');
let content = fs.readFileSync(p, 'utf8');

content = content.replace(/if \(!loading && !product\) \{[\s\S]*?return <NotFoundScreen \/>;[\s\S]*?\}/, `if (loading) {
    return (
      <div className="min-h-screen bg-orange-50 dark:bg-slate-900 flex justify-center items-center">
        <div className="w-8 h-8 border-4 border-saffron border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  
  if (!product) {
    return <NotFoundScreen />;
  }`);

fs.writeFileSync(p, content);
