const fs = require('fs');
const path = require('path');
const p = path.resolve('src/routes/index.tsx');
let content = fs.readFileSync(p, 'utf8');

content = content.replace(/import \{ App as CapacitorApp \} from '\@capacitor\/app';/, "import { useLocation } from 'react-router-dom';\nimport { App as CapacitorApp } from '@capacitor/app';");
content = content.replace(/const ProtectedRoute = \(\{ children \}\: \{ children\: React\.ReactNode \}\) \=\> \{[\s\S]*?if \(\!isAuthenticated\) return <Navigate to="\/auth\/login" replace \/>;/m, `const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { hasCompletedOnboarding } = useAppStore();
  const { isAuthenticated } = useAuthStore();
  const location = useLocation();
  
  if (!hasCompletedOnboarding) return <Navigate to="/onboarding" replace />;
  if (!isAuthenticated) return <Navigate to="/auth/login" state={{ from: location.pathname + location.search }} replace />;`);

content = content.replace(/const AuthRoute = \(\{ children \}\: \{ children\: React\.ReactNode \}\) \=\> \{[\s\S]*?if \(isAuthenticated\) return <Navigate to="\/" replace \/>;/m, `const AuthRoute = ({ children }: { children: React.ReactNode }) => {
  const { hasCompletedOnboarding } = useAppStore();
  const { isAuthenticated } = useAuthStore();
  const location = useLocation();
  const from = location.state?.from || "/";
  if (!hasCompletedOnboarding) return <Navigate to="/onboarding" replace />;
  if (isAuthenticated) return <Navigate to={from} replace />;`);

fs.writeFileSync(p, content);
