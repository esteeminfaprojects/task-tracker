import React, { useState, useMemo } from "react";
import { Task, User, Project } from "../types";
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  TrendingUp, 
  BarChart3, 
  Users, 
  Calendar,
  Layers,
  Sparkles,
  Search,
  CheckCircle,
  HelpCircle,
  ChevronRight,
  PieChart,
  Download
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface TaskDashboardProps {
  tasks: Task[];
  users: User[];
  projects: Project[];
  activeUser: User;
}

export default function TaskDashboard({
  tasks,
  users,
  projects,
  activeUser
}: TaskDashboardProps) {
  // Select which user's task stats to display (defaults to logged-in user)
  const [selectedUserId, setSelectedUserId] = useState<string>(activeUser.id);
  const [activeTab, setActiveTab] = useState<"all" | "pending" | "ongoing" | "completed">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const targetUser = useMemo(() => {
    return users.find(u => u.id === selectedUserId) || activeUser;
  }, [users, selectedUserId, activeUser]);

  // Filter tasks for the selected user
  const userTasks = useMemo(() => {
    return tasks.filter(t => t.assignedUserId === selectedUserId);
  }, [tasks, selectedUserId]);

  // Export current user tasks directly to Excel
  const handleExportTasksToExcel = () => {
    if (userTasks.length === 0) {
      alert("No tasks assigned to export.");
      return;
    }
    let csv = "Task ID,Task Name,Project Name,Assigned Employee,Status,Workload Percentage,Estimated Hours,Description,Checklist Items,Created Date,Completed Date\n";
    userTasks.forEach(task => {
      const proj = projects.find(p => p.id === task.projectId);
      const projName = proj?.name || "Unassigned";
      const totalChecklist = task.todoList.map(item => `${item.text} [${item.completed ? 'Completed' : 'Pending'}]`).join("; ");
      const createdStr = new Date(task.createdDate).toLocaleDateString();
      const completedStr = task.completedDate ? new Date(task.completedDate).toLocaleDateString() : "N/A";
      
      csv += `"${task.id}","${task.name.replace(/"/g, '""')}","${projName.replace(/"/g, '""')}","${targetUser.fullName.replace(/"/g, '""')}","${task.status}","${task.percentage}%","${task.estimatedHours}","${(task.description || "").replace(/"/g, '""')}","${totalChecklist.replace(/"/g, '""')}","${createdStr}","${completedStr}"\n`;
    });
    
    // Add UTF-8 BOM for Microsoft Excel compatibility
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `tasks_report_${targetUser.fullName.replace(/\s+/g, "_")}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Compute states
  // - "Not Started" (Pending)
  // - "Ongoing" (In Progress)
  // - "Completed" (Completed)
  const stats = useMemo(() => {
    const notStarted = userTasks.filter(t => t.status === "Pending");
    const ongoing = userTasks.filter(t => t.status === "In Progress");
    const completed = userTasks.filter(t => t.status === "Completed");
    
    const total = userTasks.length;
    const notStartedPct = total > 0 ? Math.round((notStarted.length / total) * 100) : 0;
    const ongoingPct = total > 0 ? Math.round((ongoing.length / total) * 100) : 0;
    const completedPct = total > 0 ? Math.round((completed.length / total) * 100) : 0;

    return {
      total,
      notStarted,
      ongoing,
      completed,
      notStartedPct,
      ongoingPct,
      completedPct
    };
  }, [userTasks]);

  // Smart suggestions / Insights based on work loads
  const insight = useMemo(() => {
    const { total, ongoing, completed, notStarted } = stats;
    if (total === 0) {
      return {
        text: "This user has no tasks assigned to them currently.",
        color: "text-slate-400 bg-slate-900/30 border-slate-800",
        badge: "Idle"
      };
    }

    const ratio = completed.length / total;
    if (ongoing.length > 4) {
      return {
        text: `High multi-tasking density detected! ${targetUser.fullName} has ${ongoing.length} ongoing workpieces. Consider pausing some to prevent context-switching delays.`,
        color: "text-amber-400 bg-amber-500/10 border-amber-500/20",
        badge: "Resource Alert"
      };
    }

    if (ratio >= 0.75) {
      return {
        text: `Outstanding task progress! ${completed.length} out of ${total} tasks are complete (${Math.round(ratio * 100)}% delivery rate). Workflow execution is highly efficient.`,
        color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
        badge: "Optimal Delivery"
      };
    }

    if (ongoing.length === 0 && notStarted.length > 0) {
      return {
        text: `${notStarted.length} tasks are pending but none are actively ongoing. Encourage starting the highest priority backlog task.`,
        color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
        badge: "Ready to Launch"
      };
    }

    return {
      text: `${targetUser.fullName} is actively driving ${ongoing.length} ongoing workpieces and has completed ${completed.length} tasks in total. Resource utilization is balanced.`,
      color: "text-indigo-400 bg-indigo-500/5 border-indigo-500/10",
      badge: "Healthy Pace"
    };
  }, [stats, targetUser]);

  // Filtering list by tab & search keyword
  const filteredTasksList = useMemo(() => {
    let result = [...userTasks];
    
    if (activeTab === "pending") {
      result = result.filter(t => t.status === "Pending");
    } else if (activeTab === "ongoing") {
      result = result.filter(t => t.status === "In Progress");
    } else if (activeTab === "completed") {
      result = result.filter(t => t.status === "Completed");
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(t => {
        const proj = projects.find(p => p.id === t.projectId);
        return (
          t.name.toLowerCase().includes(query) ||
          (t.description || "").toLowerCase().includes(query) ||
          (proj?.name || "").toLowerCase().includes(query)
        );
      });
    }

    // Sort by status sequence so it's clean
    return result.sort((a, b) => {
      const statusMap = { "In Progress": 0, "Pending": 1, "Completed": 2 };
      return statusMap[a.status] - statusMap[b.status];
    });
  }, [userTasks, activeTab, searchQuery, projects]);

  // Donut SVG calculations
  const donutData = useMemo(() => {
    const { notStarted, ongoing, completed, total } = stats;
    if (total === 0) return null;

    const r = 50; // radius
    const circ = 2 * Math.PI * r; // circumference ~ 314.16

    // Angles
    const completedPct = completed.length / total;
    const ongoingPct = ongoing.length / total;
    const notStartedPct = notStarted.length / total;

    const completedStroke = completedPct * circ;
    const ongoingStroke = ongoingPct * circ;
    const notStartedStroke = notStartedPct * circ;

    return {
      circ,
      completedStroke,
      ongoingStroke,
      notStartedStroke,
      completedOffset: 0,
      ongoingOffset: -completedStroke,
      notStartedOffset: -(completedStroke + ongoingStroke)
    };
  }, [stats]);

  return (
    <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 shadow-xl space-y-6 text-left" id="task-graphical-dashboard">
      {/* Header and User Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-900 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <PieChart className="h-4 w-4 text-indigo-400" />
            <h3 className="font-bold text-slate-100 text-xs uppercase tracking-wider">
              Employee Task Velocity & Status Dashboard
            </h3>
          </div>
          <p className="text-[10px] text-slate-500">
            Interactive, live graphical charts detailing task execution states for team audits.
          </p>
        </div>

        {/* User Selector Dropdown */}
        <div className="flex items-center gap-2.5 bg-slate-900/60 pl-3 pr-1 py-1 rounded-xl border border-slate-800 self-start sm:self-auto">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Users className="h-3 w-3 text-indigo-400" /> Member:
          </span>
          <select
            value={selectedUserId}
            onChange={(e) => {
              setSelectedUserId(e.target.value);
              setActiveTab("all");
            }}
            className="bg-slate-950 border border-slate-850 text-slate-200 px-3 py-1.5 rounded-lg text-[11px] font-semibold focus:outline-none focus:border-indigo-500 cursor-pointer min-w-[170px]"
          >
            {users.map(u => (
              <option key={u.id} value={u.id}>
                👤 {u.fullName} {u.id === activeUser.id ? "(You)" : ""}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Grid: Left is graphical donuts & status breakdown, right is task tracker list */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* GRAPHICAL SECTION (5 Columns on desktop) */}
        <div className="lg:col-span-5 space-y-5 flex flex-col justify-between">
          
          {/* Circular Donut & Side Legends */}
          <div className="bg-slate-900/20 p-5 rounded-2xl border border-slate-900 flex flex-col sm:flex-row items-center justify-center gap-6 flex-1">
            
            {/* SVG Donut Chart */}
            <div className="relative w-36 h-36 shrink-0 flex items-center justify-center">
              {stats.total === 0 ? (
                // Fallback Grey Circle when no tasks
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                  <circle
                    cx="60"
                    cy="60"
                    r="50"
                    fill="transparent"
                    stroke="#1e293b"
                    strokeWidth="11"
                  />
                </svg>
              ) : (
                donutData && (
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                    {/* Background Ring */}
                    <circle
                      cx="60"
                      cy="60"
                      r="50"
                      fill="transparent"
                      stroke="rgba(15, 23, 42, 0.4)"
                      strokeWidth="11"
                    />
                    
                    {/* Completed Segment (Emerald) */}
                    {stats.completed.length > 0 && (
                      <motion.circle
                        cx="60"
                        cy="60"
                        r="50"
                        fill="transparent"
                        stroke="#10b981"
                        strokeWidth="11"
                        strokeDasharray={`${donutData.completedStroke} ${donutData.circ}`}
                        strokeDashoffset={donutData.completedOffset}
                        strokeLinecap="round"
                        initial={{ strokeDasharray: `0 ${donutData.circ}` }}
                        animate={{ strokeDasharray: `${donutData.completedStroke} ${donutData.circ}` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                      />
                    )}

                    {/* Ongoing Segment (Indigo) */}
                    {stats.ongoing.length > 0 && (
                      <motion.circle
                        cx="60"
                        cy="60"
                        r="50"
                        fill="transparent"
                        stroke="#6366f1"
                        strokeWidth="11"
                        strokeDasharray={`${donutData.ongoingStroke} ${donutData.circ}`}
                        strokeDashoffset={donutData.ongoingOffset}
                        strokeLinecap="round"
                        initial={{ strokeDasharray: `0 ${donutData.circ}` }}
                        animate={{ strokeDasharray: `${donutData.ongoingStroke} ${donutData.circ}` }}
                        transition={{ duration: 1, delay: 0.1, ease: "easeOut" }}
                      />
                    )}

                    {/* Not Started Segment (Amber/Slate) */}
                    {stats.notStarted.length > 0 && (
                      <motion.circle
                        cx="60"
                        cy="60"
                        r="50"
                        fill="transparent"
                        stroke="#f59e0b"
                        strokeWidth="11"
                        strokeDasharray={`${donutData.notStartedStroke} ${donutData.circ}`}
                        strokeDashoffset={donutData.notStartedOffset}
                        strokeLinecap="round"
                        initial={{ strokeDasharray: `0 ${donutData.circ}` }}
                        animate={{ strokeDasharray: `${donutData.notStartedStroke} ${donutData.circ}` }}
                        transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
                      />
                    )}
                  </svg>
                )
              )}

              {/* Absolute Center Labels */}
              <div className="absolute text-center select-none">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Total Tasks</span>
                <span className="text-2xl font-black text-slate-100 font-mono tracking-tight block">
                  {stats.total}
                </span>
                {stats.total > 0 && (
                  <span className="text-[9px] text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.2 rounded mt-0.5 inline-block">
                    {stats.completedPct}% Done
                  </span>
                )}
              </div>
            </div>

            {/* Side Legend & Quick Stats List */}
            <div className="flex-1 w-full space-y-3.5 text-left">
              {/* Category: Ongoing */}
              <div 
                onClick={() => setActiveTab("ongoing")}
                className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                  activeTab === "ongoing" 
                    ? "bg-indigo-950/40 border-indigo-500/40 shadow-sm" 
                    : "bg-slate-900/40 border-slate-900/80 hover:bg-slate-900/80"
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-indigo-500" />
                  <span className="font-semibold text-slate-300 text-xs">Ongoing (In Progress)</span>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-slate-200 text-xs block">{stats.ongoing.length}</span>
                  <span className="text-[8px] text-slate-500 font-mono">{stats.ongoingPct}%</span>
                </div>
              </div>

              {/* Category: Not Started */}
              <div 
                onClick={() => setActiveTab("pending")}
                className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                  activeTab === "pending" 
                    ? "bg-amber-950/40 border-amber-500/40 shadow-sm" 
                    : "bg-slate-900/40 border-slate-900/80 hover:bg-slate-900/80"
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-amber-500" />
                  <span className="font-semibold text-slate-300 text-xs">Not Started (Pending)</span>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-slate-200 text-xs block">{stats.notStarted.length}</span>
                  <span className="text-[8px] text-slate-500 font-mono">{stats.notStartedPct}%</span>
                </div>
              </div>

              {/* Category: Completed */}
              <div 
                onClick={() => setActiveTab("completed")}
                className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                  activeTab === "completed" 
                    ? "bg-emerald-950/40 border-emerald-500/40 shadow-sm" 
                    : "bg-slate-900/40 border-slate-900/80 hover:bg-slate-900/80"
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-emerald-500" />
                  <span className="font-semibold text-slate-300 text-xs">Completed Task</span>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-slate-200 text-xs block">{stats.completed.length}</span>
                  <span className="text-[8px] text-slate-500 font-mono">{stats.completedPct}%</span>
                </div>
              </div>
            </div>

          </div>

          {/* AI/Analytics Insight Panel */}
          <div className={`p-4 rounded-xl border text-xs leading-relaxed text-left flex items-start gap-2.5 shadow-sm ${insight.color}`}>
            <Sparkles className="h-4 w-4 shrink-0 mt-0.5 animate-pulse" />
            <div>
              <span className="text-[8px] font-bold uppercase tracking-wider bg-slate-900/60 px-1.5 py-0.5 rounded mr-1.5 inline-block">
                {insight.badge}
              </span>
              <span>{insight.text}</span>
            </div>
          </div>

        </div>

        {/* WORKPIECES LIST & SEARCH BOARD (7 Columns on desktop) */}
        <div className="lg:col-span-7 bg-slate-900/20 p-5 rounded-2xl border border-slate-900 flex flex-col h-full min-h-[380px] justify-between space-y-4">
          
          <div className="space-y-4">
            {/* Search and Tabs Row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-900/60 pb-3">
              {/* Tab Toggles */}
              <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-850 self-start">
                <button
                  type="button"
                  onClick={() => setActiveTab("all")}
                  className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                    activeTab === "all" ? "bg-indigo-600 text-slate-100" : "text-slate-500 hover:text-slate-300"
                  }`}
                >
                  All ({stats.total})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("pending")}
                  className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                    activeTab === "pending" ? "bg-amber-500/10 text-amber-400 font-bold border border-amber-500/20" : "text-slate-500 hover:text-slate-300"
                  }`}
                >
                  Pending ({stats.notStarted.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("ongoing")}
                  className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                    activeTab === "ongoing" ? "bg-indigo-500/10 text-indigo-400 font-bold border border-indigo-500/20" : "text-slate-500 hover:text-slate-300"
                  }`}
                >
                  Ongoing ({stats.ongoing.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("completed")}
                  className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                    activeTab === "completed" ? "bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20" : "text-slate-500 hover:text-slate-300"
                  }`}
                >
                  Completed ({stats.completed.length})
                </button>
              </div>

              {/* Keyword filter input & Export to Excel */}
              <div className="flex items-center gap-2 self-stretch sm:self-auto">
                <div className="relative flex-1 sm:flex-initial">
                  <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-600" />
                  <input
                    type="text"
                    placeholder="Filter by name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full sm:w-[155px] bg-slate-950 border border-slate-850 text-slate-200 pl-8 pr-3 py-1 rounded-lg text-[10px] focus:outline-none focus:border-indigo-500 placeholder-slate-700 font-medium"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleExportTasksToExcel}
                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-slate-950 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 shrink-0"
                  title="Export tasks directly to Excel"
                >
                  <Download className="h-3.5 w-3.5 text-slate-950 font-black" />
                  <span>Export Excel</span>
                </button>
              </div>
            </div>

            {/* List Container with scrollbar */}
            <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
              {filteredTasksList.length === 0 ? (
                <div className="text-center py-16 text-slate-600 font-medium bg-slate-950/20 border border-slate-900 border-dashed rounded-xl">
                  {searchQuery ? "No matched tasks for search filter." : "No tasks in this selected category."}
                </div>
              ) : (
                filteredTasksList.map(task => {
                  const proj = projects.find(p => p.id === task.projectId);
                  
                  // Status pill config
                  let pillStyle = "bg-amber-500/10 border-amber-500/20 text-amber-400";
                  if (task.status === "In Progress") {
                    pillStyle = "bg-indigo-500/10 border-indigo-500/20 text-indigo-400";
                  } else if (task.status === "Completed") {
                    pillStyle = "bg-emerald-500/10 border-emerald-500/20 text-emerald-400";
                  }

                  // Subtasks math
                  const totalSubs = task.todoList.length;
                  const doneSubs = task.todoList.filter(item => item.completed).length;

                  return (
                    <div 
                      key={task.id} 
                      className="p-3 bg-slate-950/40 hover:bg-slate-950/90 border border-slate-900 hover:border-slate-800 rounded-xl transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-left"
                    >
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider border ${pillStyle}`}>
                            {task.status === "In Progress" ? "Ongoing" : (task.status === "Pending" ? "Not Started" : "Completed")}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono font-medium truncate max-w-[140px]">
                            📁 {proj?.name || "Unassigned"}
                          </span>
                        </div>

                        <div className="font-bold text-slate-200 text-xs truncate">
                          {task.name}
                        </div>

                        {task.description && (
                          <p className="text-slate-500 text-[10px] line-clamp-1">
                            {task.description}
                          </p>
                        )}
                        
                        <div className="text-[9px] text-slate-600 flex items-center gap-3">
                          <span className="flex items-center gap-1">
                            <Clock className="h-2.5 w-2.5 text-slate-600" />
                            Est: {task.estimatedHours} hrs
                          </span>
                          {totalSubs > 0 && (
                            <span>
                              📋 Subtasks: {doneSubs}/{totalSubs} ({Math.round((doneSubs/totalSubs)*100)}%)
                            </span>
                          )}
                          <span className="text-slate-600">
                            Created: {new Date(task.createdDate).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <div className="w-full sm:w-auto text-right shrink-0">
                        {/* Dynamic Progress indicator */}
                        <div className="space-y-1 sm:text-right">
                          <span className="text-[10px] font-mono font-bold text-slate-400 block">
                            {task.percentage}% Workload
                          </span>
                          <div className="w-24 bg-slate-900 h-1 rounded-full overflow-hidden border border-slate-900/60 ml-auto">
                            <div 
                              className={`h-full rounded-full transition-all duration-300 ${
                                task.status === "Completed" ? "bg-emerald-500" : (task.status === "In Progress" ? "bg-indigo-500" : "bg-amber-500")
                              }`}
                              style={{ width: `${task.percentage}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Quick instructions bar */}
          <div className="text-[10px] text-slate-500 flex items-center justify-between border-t border-slate-900/60 pt-3">
            <span className="flex items-center gap-1 text-[9px] font-mono text-slate-600">
              <Calendar className="h-3 w-3" /> Real-time synchronised across database tasks
            </span>
            <span className="text-[9px] text-indigo-400 font-semibold">
              Total assigned: {userTasks.length} tasks
            </span>
          </div>

        </div>

      </div>

    </div>
  );
}
