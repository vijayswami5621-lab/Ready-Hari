const fs = require('fs');
const path = require('path');
const p = path.resolve('src/routes/index.tsx');
let content = fs.readFileSync(p, 'utf8');

if (!content.includes('/reel/:id')) {
  content = content.replace(/\{ path\: '\/video\/:id', element\: <ProtectedRoute><VideoPlayerScreen \/><\/ProtectedRoute> \},/, "{ path: '/video/:id', element: <ProtectedRoute><VideoPlayerScreen /></ProtectedRoute> },\n  { path: '/reel/:id', element: <ProtectedRoute><VideoPlayerScreen /></ProtectedRoute> },");
  fs.writeFileSync(p, content);
}
