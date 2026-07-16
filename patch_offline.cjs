const fs = require('fs');
const path = require('path');
const p = path.resolve('src/components/OfflineOverlay.tsx');
let content = fs.readFileSync(p, 'utf8');

content = content.replace(/<div className="w-20 h-20 bg-red-50 dark:bg-red-900\/30 rounded-full flex items-center justify-center mx-auto mb-6 text-red-500">[\s\S]*?<\/div>/, `<div className="w-24 h-24 rounded-full bg-white dark:bg-slate-800 p-2 shadow-lg border-2 border-orange-100 dark:border-slate-700 flex items-center justify-center overflow-hidden mx-auto mb-6"><img src="/logo.png" alt="Hari Pathshala" className="w-full h-full object-contain" /></div>`);
content = content.replace(/<h2 className="text-2xl font-bold font-sans text-brown-dark dark:text-white mb-2">No Connection<\/h2>/, `<h2 className="text-2xl font-bold font-sans text-brown-dark dark:text-white mb-2">You're offline.</h2>`);

fs.writeFileSync(p, content);
