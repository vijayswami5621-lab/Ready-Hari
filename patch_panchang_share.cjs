const fs = require('fs');
const path = require('path');
const p = path.resolve('src/pages/misc/PanchangScreen.tsx');
let content = fs.readFileSync(p, 'utf8');

if (!content.includes('useShareContent')) {
  content = content.replace(/import \{ ArrowLeft, Calendar, Sun, Moon, Info, Clock, AlertCircle \} from 'lucide-react';/, "import { ArrowLeft, Calendar, Sun, Moon, Info, Clock, AlertCircle, Share2 } from 'lucide-react';\nimport { useShareContent } from '../../hooks/useShareContent';");
  
  content = content.replace(/const goBack = useGoBack\(\);/, "const goBack = useGoBack();\n  const { shareContent } = useShareContent();");
  
  content = content.replace(/<p className="text-xs text-brown-light dark:text-slate-400 font-bold">\{today\.toLocaleDateString.*?\}<\/p>\n        <\/div>\n      <\/header>/, `<p className="text-xs text-brown-light dark:text-slate-400 font-bold">{today.toLocaleDateString('en-US', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}</p>
        </div>
        <button onClick={() => shareContent({ title: "Today's Panchang", urlPath: '/panchang' })} className="ml-auto p-2 bg-white dark:bg-slate-800 rounded-full text-brown-dark dark:text-white shadow-sm border border-orange-100 dark:border-slate-700">
          <Share2 size={20} />
        </button>
      </header>`);
      
  fs.writeFileSync(p, content);
}
