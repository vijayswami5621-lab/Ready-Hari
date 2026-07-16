var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_vite = require("vite");
var import_genai = require("@google/genai");
async function startServer() {
  const app = (0, import_express.default)();
  const PORT = 3e3;
  app.use(import_express.default.json());
  app.post("/api/chat", async (req, res) => {
    try {
      const { message, history } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "Gemini API Key is not configured." });
      }
      const ai = new import_genai.GoogleGenAI({ apiKey });
      const systemInstruction = `You are "AI Guru", a spiritual guide for the Hari Pathshala app. 
You must ONLY answer questions related to: Sanatan Dharma, Bhagavad Gita, Ramcharitmanas, Mahabharata, Ramayana, Vedas, Upanishads, Puranas, Hari Naam, Bhakti, Radha Krishna, Shri Ram, Hanuman Ji, Vrindavan, Barsana, Ekadashi, Meditation, Sanskrit, Daily Sadhana, Temple Information, Festival Information, Doha, Chaupai, Shloka Meaning, and Life Guidance from Scriptures.
BLOCK EVERYTHING ELSE (Politics, Movies, Programming, Coding, Cricket, Games, Dating, Adult Content, Hacking, Crypto, Stock Market, Medical Diagnosis, Violence, Illegal Activities). 
IF USER ASKS OUTSIDE TOPIC, reply exactly with: "\u{1F64F} AI Guru \u0915\u0947\u0935\u0932 \u0938\u0928\u093E\u0924\u0928 \u0927\u0930\u094D\u092E, \u0936\u094D\u0930\u0940 \u0930\u093E\u092E, \u0936\u094D\u0930\u0940 \u0915\u0943\u0937\u094D\u0923, \u092D\u0917\u0935\u0926\u094D\u0917\u0940\u0924\u093E, \u0930\u093E\u092E\u091A\u0930\u093F\u0924\u092E\u093E\u0928\u0938, \u0935\u0947\u0926, \u0909\u092A\u0928\u093F\u0937\u0926, \u092D\u0915\u094D\u0924\u093F \u090F\u0935\u0902 \u0906\u0927\u094D\u092F\u093E\u0924\u094D\u092E\u093F\u0915 \u0935\u093F\u0937\u092F\u094B\u0902 \u092A\u0930 \u092E\u093E\u0930\u094D\u0917\u0926\u0930\u094D\u0936\u0928 \u092A\u094D\u0930\u0926\u093E\u0928 \u0915\u0930\u0924\u093E \u0939\u0948\u0964"`;
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          { role: "user", parts: [{ text: message }] }
        ],
        config: {
          systemInstruction,
          temperature: 0.7
        }
      });
      res.json({ reply: response.text });
    } catch (error) {
      console.error("AI Error:", error);
      res.status(500).json({ error: error.message || "Failed to process AI request" });
    }
  });
  app.post("/api/create-order", (req, res) => {
    res.json({
      orderId: "ORDER_" + Date.now(),
      amount: req.body.amount,
      status: "created"
    });
  });
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
