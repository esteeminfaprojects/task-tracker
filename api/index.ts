// Vercel serverless function that exposes the same Gemini API routes as the
// local Express server (server.ts). On Vercel, requests to /api/* are rewritten
// to this function (see vercel.json), and Express matches the full paths below.
//
// The GEMINI_API_KEY stays server-side only and is never shipped to the browser.
import express from "express";
import { GoogleGenAI } from "@google/genai";

const app = express();
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ limit: "15mb", extended: true }));

const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;
if (apiKey && apiKey !== "MY_GEMINI_API_KEY" && apiKey.trim() !== "") {
  ai = new GoogleGenAI({
    apiKey,
    httpOptions: { headers: { "User-Agent": "aistudio-build" } },
  });
}

const NO_KEY = {
  error:
    "Gemini API key is not configured. Add GEMINI_API_KEY in your Vercel Project → Settings → Environment Variables.",
};

// 1) Executive analysis
app.post("/api/gemini/analyze", async (req: any, res: any) => {
  try {
    if (!ai) return res.status(400).json(NO_KEY);
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

// 2) Task drafting (description + checklist)
app.post("/api/gemini/draft-task", async (req: any, res: any) => {
  try {
    if (!ai) return res.status(400).json(NO_KEY);
    const { taskName, projectName, estimatedHours } = req.body;
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Create a detailed professional task description and a checklist of 3-6 actionable subtasks for a task titled "${taskName}" under the project "${projectName}" (estimated: ${estimatedHours || 8} hours).

        You must return a JSON object with the following exact structure:
        {
          "description": "A clear, detailed description explaining task objectives, standard requirements, and key outcomes.",
          "subtasks": ["Subtask step 1", "Subtask step 2", "Subtask step 3"]
        }`,
      config: { responseMimeType: "application/json" },
    });
    res.json(JSON.parse(response.text || "{}"));
  } catch (error: any) {
    console.error("Gemini Task Draft Error:", error);
    res.status(500).json({ error: error.message || "An error occurred during task drafting." });
  }
});

// 3) Hour estimation + rationale
app.post("/api/gemini/estimate-hours", async (req: any, res: any) => {
  try {
    if (!ai) return res.status(400).json(NO_KEY);
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
      config: { responseMimeType: "application/json" },
    });
    res.json(JSON.parse(response.text || "{}"));
  } catch (error: any) {
    console.error("Gemini Estimator Error:", error);
    res.status(500).json({ error: error.message || "An error occurred during hour estimation." });
  }
});

// 4) Standup composer
app.post("/api/gemini/compose-standup", async (req: any, res: any) => {
  try {
    if (!ai) return res.status(400).json(NO_KEY);
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
      config: { responseMimeType: "application/json" },
    });
    res.json(JSON.parse(response.text || "{}"));
  } catch (error: any) {
    console.error("Gemini Standup Error:", error);
    res.status(500).json({ error: error.message || "An error occurred during standup composition." });
  }
});

export default app;
