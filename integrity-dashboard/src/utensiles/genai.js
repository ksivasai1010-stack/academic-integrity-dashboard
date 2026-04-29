import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI("YOUR_API_KEY");

// 🔹 AI Insights
export async function generateInsights(data) {
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });

  const prompt = `
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
export async function askAI(question, context) {
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
export async function predictRisk(data) {
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