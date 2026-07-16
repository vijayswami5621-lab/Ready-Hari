const fs = require('fs');
let code = fs.readFileSync('src/pages/home/HomeScreen.tsx', 'utf8');

// Add import
if (!code.includes("import { QuotesSlider }")) {
  code = code.replace("import { LazyImage } from '../../components/ui/LazyImage';", "import { LazyImage } from '../../components/ui/LazyImage';\nimport { QuotesSlider } from '../../components/QuotesSlider';");
}

// Replace case 'daily_quote':
const dqStart = code.indexOf("case 'daily_quote':");
const dqEnd = code.indexOf("case 'panchang':");
if (dqStart !== -1 && dqEnd !== -1) {
  const replacement = `case 'daily_quote':
              return (
                <div key={section.id}>
                  <QuotesSlider 
                    quotes={quotes} 
                    title={section.title || 'DAILY DIVINE WISDOM'} 
                    onShare={handleShareQuote} 
                  />
                </div>
              );
            `;
  code = code.substring(0, dqStart) + replacement + code.substring(dqEnd);
}

// Replace case 'featured_quote':
const fqStart = code.indexOf("case 'featured_quote':");
const fqEnd = code.indexOf("case 'featured_products':");
if (fqStart !== -1 && fqEnd !== -1) {
  code = code.substring(0, fqStart) + code.substring(fqEnd);
}

// Hide Founder section logic
// "Hide Founder section from User Panel. Do not delete code."
// Actually we can just comment out `if (!section.show) return null;`
// Wait, founder is returned in `case 'founder':`
const founderStart = code.indexOf("case 'founder':");
if (founderStart !== -1) {
  const replacement = `case 'founder':
              // Temporarily hidden based on requirements
              if (true) return null;
              `;
  code = code.replace("case 'founder':", replacement);
}

fs.writeFileSync('src/pages/home/HomeScreen.tsx', code);
