const fs = require('fs');
const path = require('path');

const resolverPath = path.join(__dirname, 'src/pages/misc/ContentResolver.tsx');
let content = fs.readFileSync(resolverPath, 'utf8');

const staticRouting = `
      if (!id) {
        setError(true);
        setLoading(false);
        return;
      }
      
      const staticRoutes: Record<string, string> = {
        panchang: '/panchang',
        events: '/events',
        store: '/store',
        adhyayan: '/adhyayan',
        quotes: '/quotes',
        community: '/community/experiences',
        profile: '/profile',
        aiguru: '/aiguru',
        chanting: '/chanting'
      };
      
      if (staticRoutes[id.toLowerCase()]) {
        return navigate(staticRoutes[id.toLowerCase()], { replace: true });
      }
`;

content = content.replace(`      if (!id) {
        setError(true);
        setLoading(false);
        return;
      }`, staticRouting);

fs.writeFileSync(resolverPath, content);
console.log("Patched ContentResolver");
