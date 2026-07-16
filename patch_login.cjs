const fs = require('fs');
const path = require('path');
const p = path.resolve('src/pages/auth/LoginScreen.tsx');
let content = fs.readFileSync(p, 'utf8');

if (!content.includes('useLocation')) {
  content = content.replace(/import \{ useNavigate, Link \} from "react-router-dom";/, 'import { useNavigate, Link, useLocation } from "react-router-dom";');
}

content = content.replace(/const navigate = useNavigate\(\);/, `const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || "/";`);

content = content.replace(/navigate\("\/"\);/, 'navigate(from);');

fs.writeFileSync(p, content);
