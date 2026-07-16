const fs = require('fs');
const path = require('path');

const replaceInFile = (file, regex, replacement) => {
  const p = path.resolve(file);
  let content = fs.readFileSync(p, 'utf8');
  content = content.replace(regex, replacement);
  fs.writeFileSync(p, content);
};

// VideoPlayerScreen
replaceInFile('src/pages/adhyayan/VideoPlayerScreen.tsx', /const handleShare = async \(\) => \{[\s\S]*?\} catch \(error\) \{[\s\S]*?\}[\s\S]*?\};/g, `const handleShare = async () => {
    if (!video) return;
    await shareContent({
      title: video.title,
      urlPath: \`/adhyayan/video/\${video.id}\`
    });
  };`);

// HomeScreen
replaceInFile('src/pages/home/HomeScreen.tsx', /const handleShareDoha = async \(\) => \{[\s\S]*?\} catch \(error\) \{[\s\S]*?\}[\s\S]*?\};/g, `const handleShareDoha = async () => {
    if (!dailyDoha) return;
    await shareContent({
      title: 'Ramcharitmanas Doha',
      text: dailyDoha.text + '\\n\\nMeaning: ' + dailyDoha.meaning,
      urlPath: \`/\`
    });
  };`);

// QuotesScreen
replaceInFile('src/pages/info/QuotesScreen.tsx', /const handleShare = async \(quote: any\) => \{[\s\S]*?\} catch \(error\) \{[\s\S]*?\}[\s\S]*?\};/g, `const handleShare = async (quote: any) => {
    await shareContent({
      title: 'Divine Quote',
      text: quote.text,
      urlPath: \`/quotes?id=\${quote.id}\`
    });
  };`);

// ProfileScreen
replaceInFile('src/pages/profile/ProfileScreen.tsx', /const handleShare = async \(\) => \{[\s\S]*?\} catch \(error\) \{[\s\S]*?\}[\s\S]*?\};/g, `const handleShare = async () => {
    await shareContent({
      title: 'Hari Pathshala App',
      urlPath: \`/\`
    });
  };`);

