import React, { useState } from "react";
import Markdown from "react-markdown";
import { Task, TimeLog, User, Project } from "./types";
import { 
  Sparkles, 
  Brain, 
  Clock, 
  ShieldAlert, 
  Send, 
  ArrowRight, 
  RefreshCw, 
  Copy, 
  Check, 
  Lightbulb, 
  BarChart4 
} from "lucide-react";
import { motion } from "motion/react";

interface AiAnalyticsProps {
  projects: Project[];
  tasks: Task[];
  users: User[];
  timeLogs: TimeLog[];
}

export default function AiAnalytics({
  projects,
  tasks,
  users,
  timeLogs
}: AiAnalyticsProps) {
  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pre-calculated stats for the AI dashboard
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === "Completed").length;
  
  const totalEstimatedHours = tasks.reduce((acc, t) => acc + t.estimatedHours, 0);
  
  // Calculate total actual hours logged
  let totalActualMinutes = 0;
  let autoStoppedCount = 0;
  timeLogs.forEach(log => {
    if (log.durationMinutes) {
      totalActualMinutes += log.durationMinutes;
    } else if (log.isAutoStopped) {
      totalActualMinutes += 360; // 6 hours
      autoStoppedCount += 1;
    }
  });
  const totalActualHours = Number((totalActualMinutes / 60).toFixed(1));

  // Auto-calculated efficiency
  const overallEfficiency = totalActualHours > 0 
    ? Math.round((totalEstimatedHours / totalActualHours) * 100) 
    : 100;

  // Preset query trigger helper
  const handleQueryPreset = async (presetPrompt: string) => {
    setPrompt(presetPrompt);
    await handleAnalyze(presetPrompt);
  };

  const handleAnalyze = async (customPrompt?: string) => {
    const queryText = customPrompt || prompt;
    if (!queryText.trim()) return;

    setIsLoading(true);
    setError(null);
    setResponse(null);

    // Prepare dense context for Gemini to save tokens but preserve rich metrics
    const dataContext = {
      summary: {
        totalProjects: projects.length,
        totalTasks,
        completedTasks,
        totalEstimatedHours,
        totalActualHours,
        autoStoppedCount_missed_stops: autoStoppedCount,
        overallEfficiency_percent: overallEfficiency
      },
      projectsList: projects.map(p => ({ id: p.id, name: p.name, remarks: p.remarks })),
      usersList: users.map(u => ({ id: u.id, fullName: u.fullName, employeeId: u.employeeId, deptId: u.departmentId })),
      tasksList: tasks.map(t => ({
        id: t.id,
        name: t.name,
        projectId: t.projectId,
        assignedTo: t.assignedUserId,
        estimatedHours: t.estimatedHours,
        actualHoursSpent: Number((timeLogs.filter(l => l.taskId === t.id).reduce((acc, l) => acc + (l.durationMinutes || (l.isAutoStopped ? 360 : 0)), 0) / 60).toFixed(1)),
        progress: t.percentage,
        status: t.status,
        hasParent: !!t.parentTaskId
      })),
      timeLogsSample: timeLogs.map(l => ({
        taskId: l.taskId,
        userId: l.userId,
        durationMinutes: l.durationMinutes || (l.isAutoStopped ? 360 : null),
        isMissedStopAutoCapped: l.isAutoStopped,
        notes: l.notes
      }))
    };

    try {
      const res = await fetch("/api/gemini/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: queryText,
          context: dataContext
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to contact Gemini Copilot.");
      }

      setResponse(data.result);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred. Please check network logs.");
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!response) return;
    navigator.clipboard.writeText(response);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 text-xs text-left">
      {/* Banner Card */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 p-6 rounded-2xl border border-indigo-500/10 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 opacity-10 pointer-events-none translate-x-12 -translate-y-12">
          <Sparkles className="h-48 w-48 text-amber-400" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-amber-500/10 text-amber-400 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider border border-amber-500/20 flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                Gemini AI Engine Live
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-100 mt-2 flex items-center gap-2">
              <Brain className="h-5 w-5 text-amber-400" />
              Corporate Time & Task Analytics Copilot
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Use generative AI to conduct deep audit analyses over your team's time logs, catch scheduling overruns, identify pacing issues, and generate optimization recommendations automatically.
            </p>
          </div>
        </div>
      </div>

      {/* METRIC CHIP BOARD */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Stat 1 */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center gap-3">
          <div className="p-2.5 bg-amber-500/10 rounded-lg border border-amber-500/20 shrink-0">
            <Clock className="h-4 w-4 text-amber-400" />
          </div>
          <div>
            <span className="text-slate-500 font-medium block">Corporate Task Efficiency</span>
            <span className="text-base font-bold text-slate-200 mt-0.5 block font-mono">{overallEfficiency}%</span>
          </div>
        </div>

        {/* Stat 2 */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center gap-3">
          <div className="p-2.5 bg-emerald-500/10 rounded-lg border border-emerald-500/20 shrink-0">
            <BarChart4 className="h-4 w-4 text-emerald-400" />
          </div>
          <div>
            <span className="text-slate-500 font-medium block">Allocated vs Logged</span>
            <span className="text-base font-bold text-slate-200 mt-0.5 block font-mono">
              {totalEstimatedHours}h / {totalActualHours}h
            </span>
          </div>
        </div>

        {/* Stat 3 */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center gap-3">
          <div className="p-2.5 bg-rose-500/10 rounded-lg border border-rose-500/20 shrink-0">
            <ShieldAlert className="h-4 w-4 text-rose-400" />
          </div>
          <div>
            <span className="text-slate-500 font-medium block">Forgot to Stop Alerts</span>
            <span className={`text-base font-bold mt-0.5 block font-mono ${autoStoppedCount > 0 ? "text-rose-400" : "text-slate-400"}`}>
              {autoStoppedCount} log(s)
            </span>
          </div>
        </div>

        {/* Stat 4 */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center gap-3">
          <div className="p-2.5 bg-indigo-500/10 rounded-lg border border-indigo-500/20 shrink-0">
            <Lightbulb className="h-4 w-4 text-indigo-400" />
          </div>
          <div>
            <span className="text-slate-500 font-medium block">Project Pipeline Health</span>
            <span className="text-base font-bold text-slate-200 mt-0.5 block">
              {completedTasks}/{totalTasks} Finished
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* INTERACTIVE INPUT CARD */}
        <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-4 h-fit">
          <h3 className="font-semibold text-slate-200 text-xs uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Send className="h-4 w-4 text-amber-500" />
            Audit Prompt Console
          </h3>
          <p className="text-slate-500 text-[11px] leading-relaxed">
            Write a custom analytical prompt, or select one of our pre-packaged audit templates to query Gemini instantly.
          </p>

          <div className="space-y-1.5">
            <textarea
              rows={4}
              placeholder="e.g., Audit our core developer logged hours and locate any tasks where work exceeded estimates significantly..."
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 text-slate-200 px-3 py-2 rounded-xl focus:outline-none focus:border-amber-500 text-xs resize-none placeholder:text-slate-600"
            />
            <button
              onClick={() => handleAnalyze()}
              disabled={isLoading || !prompt.trim()}
              className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 transition-colors"
            >
              Run Audit Analysis
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          {/* Presets */}
          <div className="space-y-2 pt-4 border-t border-slate-900">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">PACKAGED AUDIT TEMPLATES:</span>
            
            <button
              onClick={() => handleQueryPreset("Perform a strict workload and time-efficiency audit. Highlight tasks with budget overruns, and locate users who frequently miss stopping their stopwatch.")}
              className="w-full text-left bg-slate-900 hover:bg-slate-850 border border-slate-850 p-2.5 rounded-lg text-[11px] text-slate-300 transition-colors block leading-relaxed"
            >
              📊 <strong>Time Log & Stopwatch Audit</strong>
              <span className="text-slate-500 block text-[10px] mt-0.5">Scans overnight missed stops, and rates overall stopwatch logging quality.</span>
            </button>

            <button
              onClick={() => handleQueryPreset("Identify resource allocation bottlenecks. Recommend which employees have light workload, who is overburdened, and suggestions to balance the upcoming tasks.")}
              className="w-full text-left bg-slate-900 hover:bg-slate-850 border border-slate-850 p-2.5 rounded-lg text-[11px] text-slate-300 transition-colors block leading-relaxed"
            >
              ⚖️ <strong>Resource Workload Balancing</strong>
              <span className="text-slate-500 block text-[10px] mt-0.5">Highlights under-utilized or bottlenecked developers in active projects.</span>
            </button>

            <button
              onClick={() => handleQueryPreset("Provide a comprehensive project progress and delivery timeline forecast. Based on actual speed, will we hit target deadlines?")}
              className="w-full text-left bg-slate-900 hover:bg-slate-850 border border-slate-850 p-2.5 rounded-lg text-[11px] text-slate-300 transition-colors block leading-relaxed"
            >
              📅 <strong>Timeline Delivery Forecast</strong>
              <span className="text-slate-500 block text-[10px] mt-0.5">Forecasts release timelines based on historic sprint completion paces.</span>
            </button>
          </div>
        </div>

        {/* RESPONSE RENDER CONTAINER */}
        <div className="lg:col-span-2 bg-slate-950 border border-slate-800 rounded-2xl p-6 min-h-[380px] flex flex-col justify-between">
          <div className="flex-1 flex flex-col justify-between">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-900 pb-3 mb-4">
              <h4 className="font-semibold text-slate-200 text-sm flex items-center gap-1.5">
                <Brain className="h-4 w-4 text-indigo-400" />
                Gemini Executive Audit Report
              </h4>

              {response && (
                <button
                  onClick={copyToClipboard}
                  className="p-1.5 bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 rounded-lg flex items-center gap-1 transition-all"
                  title="Copy Report"
                >
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                      <span className="text-[10px] text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span className="text-[10px]">Copy</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Main Area */}
            <div className="flex-1 overflow-y-auto max-h-[500px] text-slate-300 pr-1 leading-relaxed">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-4">
                  <RefreshCw className="h-8 w-8 text-amber-500 animate-spin" />
                  <div className="text-center">
                    <span className="font-semibold text-slate-200 text-xs block">AI Auditor Analyzing Logs...</span>
                    <span className="text-[10px] text-slate-500 mt-1 block">Cross-referencing estimates, calculating efficiencies, and auditing missed logs...</span>
                  </div>
                </div>
              ) : error ? (
                <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-xl text-rose-400 flex items-start gap-3">
                  <ShieldAlert className="h-5 w-5 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block">Audit Interrupted</span>
                    <span className="text-[10px] text-slate-400 block mt-1">{error}</span>
                  </div>
                </div>
              ) : response ? (
                /* Correct method of rendering markdown without className on component */
                <div className="markdown-body">
                  <Markdown>{response}</Markdown>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-24 text-slate-500 font-medium">
                  <Sparkles className="h-10 w-10 text-slate-700 mb-2" />
                  Enter a custom prompt or launch a packaged template on the left to generate your corporate report.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
