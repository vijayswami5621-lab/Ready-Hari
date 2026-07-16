const fs = require('fs');
const path = require('path');

let p = path.resolve('src/hooks/useShareContent.ts');
let content = fs.readFileSync(p, 'utf8');

content = content.replace(/catch \(err\) \{[\s\S]*?if \(navigator.clipboard\) \{[\s\S]*?await navigator.clipboard.writeText\(fullUrl\);[\s\S]*?alert\("Link copied to clipboard!"\);[\s\S]*?\}[\s\S]*?\}/, `catch (err: any) {
          // Fallback if rejected or fails on web, but ignore AbortError/cancellation
          const msg = err?.message || err?.toString() || '';
          if (msg.includes('canceled') || msg.includes('cancel') || msg.includes('AbortError')) {
             return false;
          }
          if (navigator.clipboard && document.hasFocus()) {
            try {
              await navigator.clipboard.writeText(fullUrl);
              alert("Link copied to clipboard!");
            } catch(clipboardErr) {
              console.warn("Clipboard fallback failed", clipboardErr);
            }
          }
        }`);
fs.writeFileSync(p, content);

