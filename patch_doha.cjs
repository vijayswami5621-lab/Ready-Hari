const fs = require('fs');
let code = fs.readFileSync('src/pages/home/HomeScreen.tsx', 'utf8');

// Add import
if (!code.includes("import { DohaSlider }")) {
  code = code.replace("import { QuotesSlider } from '../../components/QuotesSlider';", "import { QuotesSlider } from '../../components/QuotesSlider';\nimport { DohaSlider } from '../../components/DohaSlider';");
}

const dohaStart = code.indexOf("case 'doha':");
const dohaEnd = code.indexOf("case 'featured_products':");
if (dohaStart !== -1 && dohaEnd !== -1) {
  const replacement = `case 'doha':
              return (
                <section key={section.id}>
                  <DohaSlider title={section.title} />
                </section>
              );
            `;
  code = code.substring(0, dohaStart) + replacement + code.substring(dohaEnd);
}

fs.writeFileSync('src/pages/home/HomeScreen.tsx', code);
