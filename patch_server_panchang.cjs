const fs = require('fs');
const path = require('path');
const p = path.resolve('server.ts');
let content = fs.readFileSync(p, 'utf8');

const target = `      console.log("FreeAstroAPI limit or error:", error.response?.data?.error || error.message);
      res.status(error.response?.status || 500).json({ error: "Failed to fetch Panchang from FreeAstroAPI" });`;

const replacement = `      if (process.env.NODE_ENV !== "production") {
        console.error("Panchang API Error:", error.response?.data?.error || error.message);
      }
      res.status(error.response?.status || 500).json({ error: "Unable to complete your request for Panchang details. Please try again." });`;

content = content.replace(target, replacement);

fs.writeFileSync(p, content);
