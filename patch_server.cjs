const fs = require('fs');

let content = fs.readFileSync('server.ts', 'utf8');

// Patch create-order
content = content.replace(/      if \(!key_id \|\| !key_secret \|\| key_id\.includes\('dummy'\) \|\| key_secret\.includes\('dummy'\)\) \{\n        \/\/ Mock payment order for preview mode\n        return res\.json\(\{ \n          orderId: \`mock_order_\$\{Date\.now\(\)\}\`, \n          amount: Math\.round\(amount \* 100\), \n          currency, \n          mode: 'mock' \n        \}\);\n      \}/, `      if (!key_id || !key_secret || key_id.includes('dummy') || key_secret.includes('dummy')) {
        return res.status(400).json({ error: "Payment configuration is incomplete. Please try again later or contact support." });
      }`);

// Patch verify
content = content.replace(/      if \(razorpay_order_id\.startsWith\('mock_order_'\)\) \{\n        isValid = true;\n        mode = 'test';\n      \} else \{\n        const body = razorpay_order_id \+ "\|" \+ razorpay_payment_id;\n        const expectedSignature = crypto\n          \.createHmac\("sha256", key_secret\)\n          \.update\(body\.toString\(\)\)\n          \.digest\("hex"\);\n          \n        isValid = expectedSignature === razorpay_signature;\n      \}/, `      const body = razorpay_order_id + "|" + razorpay_payment_id;
      const expectedSignature = crypto
        .createHmac("sha256", key_secret)
        .update(body.toString())
        .digest("hex");
        
      isValid = expectedSignature === razorpay_signature;`);

// Patch panchang
const panchangTarget = `      // Return mock data if API fails to prevent crashes
      res.json({
        "status": "success",
        "message": "Panchang Details (Mock Fallback)",
        "data": {
          "tithi": { "name": "Pratipada", "end_time": "14:30:00" },
          "nakshatra": { "name": "Ashwini", "end_time": "18:45:00" },
          "yoga": { "name": "Vishkumbha", "end_time": "12:00:00" },
          "karana": { "name": "Bava", "end_time": "08:15:00" },
          "sunrise": "06:15:00",
          "sunset": "18:45:00",
          "moonrise": "19:30:00",
          "moonset": "07:45:00",
          "auspicious_timing": { "abhijit_muhurta": { "start": "11:45:00", "end": "12:30:00" } },
          "inauspicious_timing": { "rahu_kalam": { "start": "13:30:00", "end": "15:00:00" } }
        }
      });`;
      
const panchangReplacement = `      res.status(error.response?.status || 500).json({ error: "Unable to complete your request for Panchang details. Please try again." });`;

content = content.replace(panchangTarget, panchangReplacement);

fs.writeFileSync('server.ts', content);
console.log("Patched server.ts");
