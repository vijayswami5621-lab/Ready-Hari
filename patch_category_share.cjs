const fs = require('fs');
const path = require('path');
const p = path.resolve('src/pages/adhyayan/CategoryDetailsScreen.tsx');
let content = fs.readFileSync(p, 'utf8');

if (!content.includes('Share2')) {
  content = content.replace(/import \{ ArrowLeft, PlayCircle, BookOpen, Clock, Heart, Search, Filter \} from "lucide-react";/, 'import { ArrowLeft, PlayCircle, BookOpen, Clock, Heart, Search, Filter, Share2 } from "lucide-react";');
}

content = content.replace(/<div className="absolute inset-0 z-20 flex flex-col p-6">\n          <button \n            onClick=\{.*?\}\n            className=".*?"\n          >\n            <ArrowLeft size=\{20\} \/>\n          <\/button>\n          \n          <div className="mt-auto text-white">/, `<div className="absolute inset-0 z-20 flex flex-col p-6">
          <div className="flex justify-between items-start mb-auto">
            <button 
              onClick={() => goBack()}
              className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <button 
              onClick={() => shareContent({ title: category?.name, urlPath: \`/category/\${id}\` })}
              className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors"
            >
              <Share2 size={20} />
            </button>
          </div>
          
          <div className="mt-auto text-white">`);

fs.writeFileSync(p, content);
