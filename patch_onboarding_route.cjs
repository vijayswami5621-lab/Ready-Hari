const fs = require('fs');
const path = require('path');
const p = path.resolve('src/routes/index.tsx');
let content = fs.readFileSync(p, 'utf8');

content = content.replace(/const OnboardingRoute = \(\{ children \}\: \{ children\: React\.ReactNode \}\) \=\> \{[\s\S]*?if \(hasCompletedOnboarding\) return <Navigate to="\/" replace \/>;/m, `const OnboardingRoute = ({ children }: { children: React.ReactNode }) => {
  const { hasCompletedOnboarding } = useAppStore();
  const location = useLocation();
  const from = location.state?.from || "/";
  if (hasCompletedOnboarding) return <Navigate to={from} replace />;`);

fs.writeFileSync(p, content);
