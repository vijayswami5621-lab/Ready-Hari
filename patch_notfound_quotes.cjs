const fs = require('fs');
const path = require('path');
const p = path.resolve('src/pages/info/QuotesScreen.tsx');
let content = fs.readFileSync(p, 'utf8');

if (!content.includes('NotFoundScreen')) {
  content = content.replace(/import \{ Search \} from "lucide-react";/, 'import { Search } from "lucide-react";\nimport { NotFoundScreen } from "../misc/NotFoundScreen";');
  
  content = content.replace(/const filteredQuotes = dbQuotes\.filter\(\(q\) => \{[\s\S]*?\}\);/, `const filteredQuotes = dbQuotes.filter((q) => {
    if (id && q.id !== id) return false;
    const matchesSearch =
      q.text?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.source?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "All" || q.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (!loading && id && filteredQuotes.length === 0) {
    return <NotFoundScreen />;
  }`);
  fs.writeFileSync(p, content);
}
