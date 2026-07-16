const fs = require('fs');
const path = require('path');
const p = path.resolve('src/hooks/useShareContent.ts');
let content = fs.readFileSync(p, 'utf8');

content = content.replace(/await Share\.share\(\{[\s\S]*?\}\);/g, `const { value } = await Share.canShare();
      if (value || (navigator && navigator.share)) {
        try {
          await Share.share({
            title: shareTitle,
            text: combinedText,
            url: fullUrl,
            dialogTitle: dialogTitle || 'Share with friends',
          });
        } catch (err) {
          // Fallback if rejected or fails on web
          if (navigator.clipboard) {
            await navigator.clipboard.writeText(fullUrl);
            alert("Link copied to clipboard!");
          }
        }
      } else {
        if (navigator.clipboard) {
          await navigator.clipboard.writeText(fullUrl);
          alert("Link copied to clipboard!");
        }
      }`);

fs.writeFileSync(p, content);
