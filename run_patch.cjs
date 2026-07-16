const fs = require('fs');
const path = require('path');
const target = path.join(__dirname, 'node_modules', '@swisseph', 'browser', 'dist', 'swisseph-browser.js');
const source = path.join(__dirname, 'patch_swisseph.cjs');
if (fs.existsSync(source) && fs.existsSync(path.dirname(target))) {
  // restore export syntax for the browser build
  let content = fs.readFileSync(source, 'utf8');
  content = content.replace(/if \(typeof module !== "undefined" && module.exports\) \{[\s\S]*?\}/, 'export {\n  SwissEphemeris,\n  swisseph_browser_default as default,\n  swisseph\n};');
  fs.writeFileSync(target, content);
  console.log("Patched swisseph-browser.js");
}
