const fs = require('fs');
const path = require('path');
const p = path.resolve('src/pages/aiguru/AIGuruScreen.tsx');
let content = fs.readFileSync(p, 'utf8');

if (!content.includes('import { useShareContent }')) {
  content = content.replace(/import \{ useGoBack \} from "\.\.\/\.\.\/hooks\/useGoBack";/, "import { useGoBack } from '../../hooks/useGoBack';\nimport { useShareContent } from '../../hooks/useShareContent';");
}

if (!content.includes('Share2')) {
  content = content.replace(/import \{ Send, Bot, User, Sparkles, Loader2, ArrowLeft, MoreVertical, Trash2 \} from 'lucide-react';/, "import { Send, Bot, User, Sparkles, Loader2, ArrowLeft, MoreVertical, Trash2, Share2 } from 'lucide-react';");
}

content = content.replace(/const goBack = useGoBack\(\);/, "const goBack = useGoBack();\n  const { shareContent } = useShareContent();");

content = content.replace(/<div className="relative">\n            <button\n              onClick=\{clearHistory\}\n              className="p-2 hover:bg-orange-100 dark:hover:bg-slate-700 rounded-full transition-colors text-brown-light dark:text-slate-300"\n            >/, `<div className="flex items-center gap-2">
            <button
              onClick={() => shareContent({ title: "Spiritual AI Guru", urlPath: '/aiguru' })}
              className="p-2 hover:bg-orange-100 dark:hover:bg-slate-700 rounded-full transition-colors text-brown-light dark:text-slate-300"
            >
              <Share2 size={20} />
            </button>
            <div className="relative">
            <button
              onClick={clearHistory}
              className="p-2 hover:bg-orange-100 dark:hover:bg-slate-700 rounded-full transition-colors text-brown-light dark:text-slate-300"
            >`);

fs.writeFileSync(p, content);
