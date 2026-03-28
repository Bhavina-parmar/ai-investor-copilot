import express from "express";
import cors from "cors";
import analyzeRoute from "./routes/analyze.js";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
console.log("API KEY:", process.env.GROQ_API_KEY);
app.use("/api", analyzeRoute);

app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});

app.use(cors());

app.get("/test", (req, res) => {
  res.json({ message: "Backend is working " });
});