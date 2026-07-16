const fs = require('fs');
const path = require('path');
const p = path.resolve('src/pages/misc/EventsScreen.tsx');
let content = fs.readFileSync(p, 'utf8');

if (!content.includes('NotFoundScreen')) {
  content = content.replace(/import \{ EmptyState \} from '\.\.\/\.\.\/components\/EmptyState';/, "import { EmptyState } from '../../components/EmptyState';\nimport { NotFoundScreen } from './NotFoundScreen';");
  
  content = content.replace(/const upcomingEvents = id \? events.filter\(e => e.id === id\) : events/, `const upcomingEvents = id ? events.filter(e => e.id === id) : events;
  if (!loading && id && upcomingEvents.length === 0) {
    return <NotFoundScreen />;
  }`);
  fs.writeFileSync(p, content);
}
