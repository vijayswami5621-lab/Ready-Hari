const fs = require('fs');
const path = require('path');
const p = path.resolve('src/pages/misc/EventsScreen.tsx');
let content = fs.readFileSync(p, 'utf8');

if (!content.includes('import { useShareContent }')) {
  content = content.replace(/import \{ useGoBack \} from "\.\.\/\.\.\/hooks\/useGoBack";/, "import { useGoBack } from '../../hooks/useGoBack';\nimport { useShareContent } from '../../hooks/useShareContent';");
}

if (!content.includes('Share2')) {
  content = content.replace(/import \{ ArrowLeft, Calendar, MapPin, Clock \} from 'lucide-react';/, "import { ArrowLeft, Calendar, MapPin, Clock, Share2 } from 'lucide-react';");
}

content = content.replace(/<div className="flex items-center gap-3">\n          <button onClick=\{.*?\} className=".*?">\n            <ArrowLeft size=\{20\} \/>\n          <\/button>\n          <h1 className="text-xl font-bold font-sans text-brown-dark dark:text-white">Upcoming Events<\/h1>\n        <\/div>\n      <\/header>/, `<div className="flex items-center gap-3">
          <button onClick={() => goBack()} className="p-2 bg-white dark:bg-slate-800 rounded-full text-brown-dark dark:text-white shadow-sm border border-orange-100 dark:border-slate-700">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold font-sans text-brown-dark dark:text-white">Upcoming Events</h1>
        </div>
        <button onClick={() => shareContent({ title: "Upcoming Events", urlPath: '/events' })} className="p-2 bg-white dark:bg-slate-800 rounded-full text-brown-dark dark:text-white shadow-sm border border-orange-100 dark:border-slate-700">
          <Share2 size={20} />
        </button>
      </header>`);

content = content.replace(/<button className="w-full bg-saffron-dark text-white font-bold py-3 rounded-xl shadow-md hover:bg-saffron transition-colors">\n                    Register Now\n                  <\/button>/, `<div className="flex gap-2">
                    <button className="flex-1 bg-saffron-dark text-white font-bold py-3 rounded-xl shadow-md hover:bg-saffron transition-colors">
                      Register Now
                    </button>
                    <button onClick={() => shareContent({ title: event.title, urlPath: \`/event/\${event.id}\` })} className="px-4 bg-orange-50 dark:bg-slate-700 text-brown-dark dark:text-white font-bold py-3 rounded-xl shadow-sm border border-orange-100 dark:border-slate-600 hover:bg-orange-100 dark:hover:bg-slate-600 transition-colors">
                      <Share2 size={20} />
                    </button>
                  </div>`);

fs.writeFileSync(p, content);
