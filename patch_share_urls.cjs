const fs = require('fs');
const path = require('path');

const replaceInFile = (file, regex, replacement) => {
  const p = path.resolve(file);
  let content = fs.readFileSync(p, 'utf8');
  content = content.replace(regex, replacement);
  fs.writeFileSync(p, content);
};

// VideoPlayerScreen
replaceInFile('src/pages/adhyayan/VideoPlayerScreen.tsx', /urlPath: \`\/adhyayan\/video\/\$\{video.id\}\`/g, "urlPath: `/video/${video.id}`");

// QuotesScreen
replaceInFile('src/pages/info/QuotesScreen.tsx', /urlPath: \`\/quotes\?id=\$\{quote.id\}\`/g, "urlPath: `/quote/${quote.id}`");

// ProductDetailsScreen
replaceInFile('src/pages/store/ProductDetailsScreen.tsx', /urlPath: \`\/store\/product\/\$\{product.id\}\`/g, "urlPath: `/product/${product.id}`");

// CategoryDetailsScreen
replaceInFile('src/pages/adhyayan/CategoryDetailsScreen.tsx', /urlPath: \`\/adhyayan\/category\/\$\{id\}\`/g, "urlPath: `/category/${id}`");

