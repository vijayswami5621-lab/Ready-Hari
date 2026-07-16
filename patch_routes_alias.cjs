const fs = require('fs');
const path = require('path');
const p = path.resolve('src/routes/index.tsx');
let content = fs.readFileSync(p, 'utf8');

if (!content.includes("path: '/product/:id'")) {
  const aliases = `
  // Aliases for clean sharing URLs
  { path: '/product/:id', element: <ProtectedRoute><ProductDetailsScreen /></ProtectedRoute> },
  { path: '/video/:id', element: <ProtectedRoute><VideoPlayerScreen /></ProtectedRoute> },
  { path: '/category/:id', element: <ProtectedRoute><CategoryDetailsScreen /></ProtectedRoute> },
  { path: '/event/:id', element: <ProtectedRoute><EventsScreen /></ProtectedRoute> },
  { path: '/quote/:id', element: <ProtectedRoute><QuotesScreen /></ProtectedRoute> },
`;
  content = content.replace(/\{ path: '\*', element: <NotFoundScreen \/> \},/, aliases + '\n  { path: \'*\', element: <NotFoundScreen /> },');
  fs.writeFileSync(p, content);
}
