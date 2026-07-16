const fs = require('fs');
const path = require('path');
const p = path.resolve('src/pages/adhyayan/VideoPlayerScreen.tsx');
let content = fs.readFileSync(p, 'utf8');

// Replace handleShare
content = content.replace(/const handleShare = async \(\) => \{[\s\S]*?\} catch \(err\) \{[\s\S]*?\}[\s\S]*?\};/, `const handleShare = async () => {
    if (!video) return;
    await shareContent({
      title: video.title,
      urlPath: \`/video/\${video.id}\`
    });
  };`);

fs.writeFileSync(p, content);
