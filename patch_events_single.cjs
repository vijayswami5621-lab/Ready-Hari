const fs = require('fs');
const path = require('path');
const p = path.resolve('src/pages/misc/EventsScreen.tsx');
let content = fs.readFileSync(p, 'utf8');

if (!content.includes('useParams')) {
  content = content.replace(/import \{ useNavigate \} from 'react-router-dom';/, "import { useNavigate, useParams } from 'react-router-dom';");
  content = content.replace(/const navigate = useNavigate\(\);/, "const navigate = useNavigate();\n  const { id } = useParams();");
  
  content = content.replace(/const upcomingEvents = events/, "const upcomingEvents = id ? events.filter(e => e.id === id) : events");
  fs.writeFileSync(p, content);
}
