const fs = require('fs');
const path = require('path');
const p = path.resolve('src/pages/adhyayan/CategoryDetailsScreen.tsx');
let content = fs.readFileSync(p, 'utf8');

// The goal is to move the early returns BELOW all hooks
content = content.replace(/  if \(catLoading\) \{[\s\S]*?  \}\n\n  if \(\!category\) \{[\s\S]*?  \}/, `  // Moved early returns`);

const hooksReplacement = `  const sortedVideos = [...categoryVideos].sort((a, b) => {
    if (sortBy === 'Newest') return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
    if (sortBy === 'Oldest') return (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0);
    if (sortBy === 'Popular') return (b.views || 0) - (a.views || 0);
    if (sortBy === 'A-Z') return (a.title || '').localeCompare(b.title || '');
    return 0;
  });

  if (catLoading) {
    return (
      <div className="min-h-screen bg-orange-50 dark:bg-slate-900 flex justify-center items-center">
        <div className="w-8 h-8 border-4 border-saffron border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  
  if (!category) {
    return <NotFoundScreen />;
  }
`;

content = content.replace(/  const sortedVideos = \[\.\.\.categoryVideos\]\.sort\(\(a, b\) \=\> \{[\s\S]*?  \}\);/, hooksReplacement);

fs.writeFileSync(p, content);
