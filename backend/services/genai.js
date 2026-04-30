const { GoogleGenerativeAI } = require("@google/generative-ai");

// Load from environment variable (dotenv should be configured in server.js or start script)
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "YOUR_API_KEY");

// 🔹 AI Insights
async function generateInsights(data, customPrompt = null) {
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });

  const prompt = customPrompt || `
Analyze academic integrity risk:

Data:
${JSON.stringify(data)}

Give:
- Risks
- Patterns
- Recommendations
`;

  const res = await model.generateContent(prompt);
  return res.response.text();
}

// 🔹 Chatbot
async function askAI(question, context) {
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });

  const prompt = `
You are an academic integrity assistant.

Context:
${JSON.stringify(context)}

User question:
${question}
`;

  const res = await model.generateContent(prompt);
  return res.response.text();
}

// 🔹 Risk Prediction
async function predictRisk(data) {
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });

  const prompt = `
Predict future academic risk:

Data:
${JSON.stringify(data)}

Return:
- Future risk level
- Reason
`;

  const res = await model.generateContent(prompt);
  return res.response.text();
}

module.exports = {
  generateInsights,
  askAI,
  predictRisk
};
