import express from "express";
import axios from "axios";
import YahooFinance from "yahoo-finance2";
const yahooFinance = new YahooFinance();

const router = express.Router();

router.post("/analyze-stock", async (req, res) => {
  const { stock } = req.body;

  try {
    // ✅ STEP 1: Get first stock for chart
    const stockSymbol = stock.split(",")[0].trim() + ".NS";

    // Get last 5 days
    const now = new Date();
    const fiveDaysAgo = new Date();
    fiveDaysAgo.setDate(now.getDate() - 5);

    const data = await yahooFinance.chart(stockSymbol, {
      period1: fiveDaysAgo,
      period2: now,
      interval: "1d",
    });

    const prices = data.quotes.map((q) => ({
      date: new Date(q.date).toLocaleDateString(),
      price: q.close,
    }));

    // ✅ STEP 2: AI Prompt
    const prompt = `
You are a financial AI assistant.

User Portfolio: ${stock}

Analyze the portfolio and return ONLY JSON:

{
  "risk_level": "Low/Medium/High",
  "diversification": "Good/Poor",
  "insight": "short insight",
  "suggestion": "what user should do"
}
`;

    // ✅ STEP 3: Call Groq API
    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama-3.1-8b-instant",
        messages: [{ role: "user", content: prompt }],
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const aiText = response.data.choices[0].message.content;

    let parsed;
    try {
      try {
          const clean = aiText.replace(/```json|```/g, "").trim();
          parsed = JSON.parse(clean);
        } catch {
          parsed = {
            risk_level: "Medium",
            diversification: "Moderate",
            insight: "AI response parsing failed",
            suggestion: "Try again",
          };
        }
    } catch {
      parsed = { raw: aiText };
    }

    // ✅ STEP 4: Send BOTH AI + Chart
    res.json({
      ...parsed,
      chartData: prices,
    });

  } catch (err) {
    console.error("FULL ERROR:", err.response?.data || err.message);
    res.status(500).json({ error: "AI failed", details: err.message });
  }
});

export default router;