import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Set limits to handle attachments if sent over API
  app.use(express.json({ limit: "15mb" }));
  app.use(express.urlencoded({ limit: "15mb", extended: true }));

  // Initialize Gemini client safely
  const apiKey = process.env.GEMINI_API_KEY;
  let ai: GoogleGenAI | null = null;
  if (apiKey && apiKey !== "MY_GEMINI_API_KEY" && apiKey.trim() !== "") {
    ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }

  // API Route for Gemini analysis
  app.post("/api/gemini/analyze", async (req: any, res: any) => {
    try {
      if (!ai) {
        return res.status(400).json({
          error: "Gemini API key is not configured. Please add GEMINI_API_KEY in Settings > Secrets."
        });
      }

      const { prompt, context } = req.body;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `You are an expert project management, time optimization, and performance auditor AI assistant.
Review the following contextual data from our Bitrix24/Redmine/Asana style Task Tracker:
${JSON.stringify(context, null, 2)}

User Prompt/Query: ${prompt}

Analyze the tasks, time logs, department metrics, and users.
Provide an executive, actionable, and visually clean markdown report.
Specifically focus on:
1. Task time involvement: comparison of actual logged hours vs. estimated hours.
2. Missing stop alerts: Highlight logs where users missed stopping their task and the system automatically fell back to a 6-hour log. Recommend improvements (e.g. better task pacing or reminder triggers).
3. Employee performance and department workload analysis.
4. Suggestions for project timelines or task priority revisions.

Keep your response extremely professional, elegant, and directly useful, without meta-talk about prompts or instructions.`,
      });

      res.json({ result: response.text });
    } catch (error: any) {
      console.error("Gemini API Error:", error);
      res.status(500).json({ error: error.message || "An error occurred during AI analysis." });
    }
  });

  // API Route for AI Task drafting (description and checklists)
  app.post("/api/gemini/draft-task", async (req: any, res: any) => {
    try {
      if (!ai) {
        return res.status(400).json({
          error: "Gemini API key is not configured. Please add GEMINI_API_KEY in Settings > Secrets."
        });
      }

      const { taskName, projectName, estimatedHours } = req.body;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Create a detailed professional task description and a checklist of 3-6 actionable subtasks for a task titled "${taskName}" under the project "${projectName}" (estimated: ${estimatedHours || 8} hours).
        
        You must return a JSON object with the following exact structure:
        {
          "description": "A clear, detailed description explaining task objectives, standard requirements, and key outcomes.",
          "subtasks": ["Subtask step 1", "Subtask step 2", "Subtask step 3"]
        }`,
        config: {
          responseMimeType: "application/json",
        }
      });

      const data = JSON.parse(response.text || "{}");
      res.json(data);
    } catch (error: any) {
      console.error("Gemini Task Draft Error:", error);
      res.status(500).json({ error: error.message || "An error occurred during task drafting." });
    }
  });

  // API Route for AI Hour estimation & rationale
  app.post("/api/gemini/estimate-hours", async (req: any, res: any) => {
    try {
      if (!ai) {
        return res.status(400).json({
          error: "Gemini API key is not configured. Please add GEMINI_API_KEY in Settings > Secrets."
        });
      }

      const { taskName, taskDescription, projectName } = req.body;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Analyze the following task and predict a realistic, professional hour estimate for completion:
        Task Name: "${taskName}"
        Task Description: "${taskDescription || "No description provided."}"
        Project Context: "${projectName || "General Project"}"
        
        Provide a single best integer estimate in hours, and a short, insightful rationale explaining the estimate.
        
        You must return a JSON object with the following exact structure:
        {
          "suggestedHours": 10,
          "rationale": "A brief, professional single-sentence explanation of why this task requires this duration."
        }`,
        config: {
          responseMimeType: "application/json",
        }
      });

      const data = JSON.parse(response.text || "{}");
      res.json(data);
    } catch (error: any) {
      console.error("Gemini Estimator Error:", error);
      res.status(500).json({ error: error.message || "An error occurred during hour estimation." });
    }
  });

  // API Route for AI Standup Composer
  app.post("/api/gemini/compose-standup", async (req: any, res: any) => {
    try {
      if (!ai) {
        return res.status(400).json({
          error: "Gemini API key is not configured. Please add GEMINI_API_KEY in Settings > Secrets."
        });
      }

      const { completedSubtasks, logsToday, activeTasks, userName, tone } = req.body;

      const toneGuideline = 
        tone === "Casual/Startup" ? "friendly, lighthearted, modern startup style with relevant emojis" :
        tone === "Highly Technical" ? "engineering-focused, rigorous, detailing technical metrics or systems" :
        tone === "Ultra Concise" ? "extremely brief, bullet-points-only, fast to read and zero fluff" :
        "highly professional, corporate, clear, structured and articulate";

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `You are an agile team lead and copywriter.
        Compose a Daily Standup update (formatted beautifully in Markdown) for developer ${userName || "Team Member"} based on today's activities.
        
        Tone & Style required: ${toneGuideline}
        
        Context:
        - Completed Checklist Items: ${JSON.stringify(completedSubtasks)}
        - Time Logged Today: ${JSON.stringify(logsToday)}
        - Active/In-Progress Tasks: ${JSON.stringify(activeTasks)}
        
        Structure your standup beautifully with clear bullet points using emojis (e.g. ✅ Yesterday/Today, 🎯 Focus, ⚠️ Blockers/Risks). Maintain the selected style, avoiding boilerplate greetings or conversational fillers.
        
        You must return a JSON object with the following exact structure:
        {
          "standup": "The complete formatted markdown string representing the Daily Standup report."
        }`,
        config: {
          responseMimeType: "application/json",
        }
      });

      const data = JSON.parse(response.text || "{}");
      res.json(data);
    } catch (error: any) {
      console.error("Gemini Standup Error:", error);
      res.status(500).json({ error: error.message || "An error occurred during standup composition." });
    }
  });

  // Serve static assets or mount Vite dev server
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
