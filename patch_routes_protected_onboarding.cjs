const fs = require('fs');
const path = require('path');
const p = path.resolve('src/routes/index.tsx');
let content = fs.readFileSync(p, 'utf8');

content = content.replace(/if \(\!hasCompletedOnboarding\) return <Navigate to="\/onboarding" replace \/>;/g, `if (!hasCompletedOnboarding) return <Navigate to="/onboarding" state={{ from: location.pathname + location.search }} replace />;`);

fs.writeFileSync(p, content);
