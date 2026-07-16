const fs = require('fs');
const path = require('path');
const p = path.resolve('src/pages/adhyayan/CategoryDetailsScreen.tsx');
let content = fs.readFileSync(p, 'utf8');

const target = `<button 
            onClick={() => goBack()}
            className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors mb-auto"
          >
            <ArrowLeft size={20} />
          </button>`;

const replacement = `<div className="flex justify-between items-center w-full mb-auto">
          <button 
            onClick={() => goBack()}
            className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          
          <button 
            onClick={() => shareContent({ title: category?.name, urlPath: '/category/' + category?.id })}
            className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors"
          >
            <Share2 size={20} />
          </button>
          </div>`;

content = content.replace(target, replacement);

fs.writeFileSync(p, content);
