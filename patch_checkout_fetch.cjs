const fs = require('fs');
const path = require('path');
const p = path.resolve('src/pages/store/CheckoutScreen.tsx');
let content = fs.readFileSync(p, 'utf8');

// For createOrderRes
content = content.replace(/      let orderDataResponse;\n      try \{\n        orderDataResponse = await createOrderRes\.json\(\);\n      \} catch \(err\) \{\n        throw new Error\(\n          \(await createOrderRes\.text\(\)\) \|\| "Failed to parse server response"\n        \);\n      \}/, `
      let orderDataResponse;
      const createOrderResClone = createOrderRes.clone();
      try {
        orderDataResponse = await createOrderRes.json();
      } catch (err) {
        throw new Error(
          (await createOrderResClone.text()) || "Failed to parse server response"
        );
      }`);

// For verifyRes
content = content.replace(/      let verifyData;\n      try \{\n        verifyData = await verifyRes\.json\(\);\n      \} catch\(err\) \{\n        throw new Error\(\n          \(await verifyRes\.text\(\)\) \|\| "Failed to parse server response"\n        \);\n      \}/, `
      let verifyData;
      const verifyResClone = verifyRes.clone();
      try {
        verifyData = await verifyRes.json();
      } catch(err) {
        throw new Error(
          (await verifyResClone.text()) || "Failed to parse server response"
        );
      }`);

fs.writeFileSync(p, content);
