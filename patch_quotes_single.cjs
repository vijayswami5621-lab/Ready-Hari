const fs = require('fs');
const path = require('path');
const p = path.resolve('src/pages/info/QuotesScreen.tsx');
let content = fs.readFileSync(p, 'utf8');

// replace imports
content = content.replace(/import \{ useNavigate \} from "react-router-dom";/, 'import { useNavigate, useParams } from "react-router-dom";');
content = content.replace(/const navigate = useNavigate\(\);/, 'const navigate = useNavigate();\n  const { id } = useParams();');

// filter logic
content = content.replace(/const filteredQuotes = dbQuotes.filter\(\(q\) => \{/, 'const filteredQuotes = dbQuotes.filter((q) => {\n    if (id && q.id !== id) return false;');

fs.writeFileSync(p, content);
