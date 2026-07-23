import React, { useState, useEffect, useRef } from "react";
import { 
  Task, 
  TimeLog, 
  User, 
  Project,
  TodoItem
} from "../types";
import { 
  Play, 
  Square, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Calendar, 
  RefreshCw, 
  Download, 
  CheckSquare, 
  Square as SquareIcon,
  Plus, 
  FileText,
  Sparkles,
  ExternalLink,
  TrendingUp,
  CheckCircle2,
  ListTodo,
  Trash2,
  Search,
  ChevronDown,
  ChevronUp,
  Info,
  Award,
  Copy,
  Check,
  LayoutGrid,
  List
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import TaskDashboard from "./TaskDashboard";

interface UserPanelProps {
  activeUser: User;
  projects: Project[];
  tasks: Task[];
  users: User[];
  timeLogs: TimeLog[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  setTimeLogs: React.Dispatch<React.SetStateAction<TimeLog[]>>;
}

export default function UserPanel({
  activeUser,
  projects,
  tasks,
  users,
  timeLogs,
  setTasks,
  setTimeLogs
}: UserPanelProps) {
  // Filter tasks assigned to active user
  const myTasks = tasks.filter(t => t.assignedUserId === activeUser.id);

  // States
  const [selectedTaskId, setSelectedTaskId] = useState<string>("");
  const [activeLog, setActiveLog] = useState<TimeLog | null>(null);
  const [tickerTime, setTickerTime] = useState("00:00:00");
  const [isSyncingCalendar, setIsSyncingCalendar] = useState(false);
  const [isCalendarConnected, setIsCalendarConnected] = useState(false);
  const [showSyncSuccessAlert, setShowSyncSuccessAlert] = useState(false);

  // Search & Filter state for tasks
  const [taskSearch, setTaskSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | "Pending" | "In Progress" | "Completed">("All");

  // Dynamic subtask adding text
  const [newSubtaskText, setNewSubtaskText] = useState("");

  // AI Standup & Notes states
  const [isStandupModalOpen, setIsStandupModalOpen] = useState(false);
  const [standupText, setStandupText] = useState("");
  const [isGeneratingStandup, setIsGeneratingStandup] = useState(false);
  const [isRefiningNotes, setIsRefiningNotes] = useState(false);
  const [standupTone, setStandupTone] = useState<string>("Professional");

  // Collapsible UI panels for better focus & clean desktop layout
  const [isTimerCollapsed, setIsTimerCollapsed] = useState(false);
  const [isCalendarCollapsed, setIsCalendarCollapsed] = useState(true); // default collapsed to save vertical height!
  const [isStandupCollapsed, setIsStandupCollapsed] = useState(true);   // default collapsed to save vertical height!

  // Additional Premium UX States
  const [sortBy, setSortBy] = useState<"created" | "name" | "hours" | "progress">("created");
  const [logsFilter, setLogsFilter] = useState<"Today" | "All">("Today");
  const [isGeneratingChecklist, setIsGeneratingChecklist] = useState(false);
  const [checklistFeedback, setChecklistFeedback] = useState("");
  const [copiedStandup, setCopiedStandup] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "grid">("grid");

  // Date Period Reporting & Schedule States
  const [reportUserId, setReportUserId] = useState<string>(activeUser.id);
  const [reportStartDate, setReportStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 14); // Past 14 days default for detailed time schedule
    return d.toISOString().split("T")[0];
  });
  const [reportEndDate, setReportEndDate] = useState<string>(() => {
    return new Date().toISOString().split("T")[0];
  });
  const [reportSearchQuery, setReportSearchQuery] = useState("");
  const [isReportingCollapsed, setIsReportingCollapsed] = useState(false);
  const [copiedReportText, setCopiedReportText] = useState(false);

  // Stop Log Modal/Frame State
  const [isStopModalOpen, setIsStopModalOpen] = useState(false);
  const [stopForm, setStopForm] = useState({
    pct: 0,
    notes: ""
  });

  // Track ticker interval
  const tickerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-resolve any missed stop logs upon loading the panel!
  // "if any user is missed to stop the task than for that very day it will be considered as 6 hrs"
  useEffect(() => {
    // Check if there are running logs (endTime === null) from PREVIOUS calendar days
    const todayStr = new Date().toDateString();
    let updated = false;

    const resolvedLogs = timeLogs.map(log => {
      if (log.userId === activeUser.id && !log.endTime && log.startTime) {
        const logDateStr = new Date(log.startTime).toDateString();
        // If it was started on a different day, we force stop it at 6 hours!
        if (logDateStr !== todayStr) {
          updated = true;
          return {
            ...log,
            endTime: new Date(new Date(log.startTime).getTime() + 6 * 60 * 60 * 1000).toISOString(), // start + 6 hours
            durationMinutes: 360, // 6 hours
            percentageOnStop: 100, // assume completed or set custom
            isAutoStopped: true,
            notes: (log.notes ? log.notes + " " : "") + "(System Alert: Forgot to stop. Auto-capped at 6 hours as per company policy.)"
          };
        }
      }
      return log;
    });

    if (updated) {
      setTimeLogs(resolvedLogs);
    }

    // Check if there's a currently running log for today to restore timer
    const currentActive = timeLogs.find(log => log.userId === activeUser.id && !log.endTime);
    if (currentActive) {
      setActiveLog(currentActive);
      setSelectedTaskId(currentActive.taskId);
    } else {
      setActiveLog(null);
      if (myTasks.length > 0 && !selectedTaskId) {
        setSelectedTaskId(myTasks[0].id);
      }
    }
  }, [timeLogs, activeUser.id]);

  // Live Timer Ticker Effect
  useEffect(() => {
    if (activeLog && activeLog.startTime) {
      const startTimeMs = new Date(activeLog.startTime).getTime();
      
      tickerIntervalRef.current = setInterval(() => {
        const nowMs = new Date().getTime();
        const diffMs = nowMs - startTimeMs;
        
        const hrs = Math.floor(diffMs / 3600000);
        const mins = Math.floor((diffMs % 3600000) / 60000);
        const secs = Math.floor((diffMs % 60000) / 1000);
        
        const pad = (num: number) => String(num).padStart(2, "0");
        setTickerTime(`${pad(hrs)}:${pad(mins)}:${pad(secs)}`);
      }, 1000);
    } else {
      setTickerTime("00:00:00");
      if (tickerIntervalRef.current) {
        clearInterval(tickerIntervalRef.current);
      }
    }

    return () => {
      if (tickerIntervalRef.current) {
        clearInterval(tickerIntervalRef.current);
      }
    };
  }, [activeLog]);

  // Handle Starting Activity
  const handleStartTask = () => {
    if (!selectedTaskId) return;
    
    // Check if another task is already running
    if (activeLog) {
      alert("You already have an active running task! Please stop it before starting a new work session.");
      return;
    }

    const newLog: TimeLog = {
      id: `log-${Date.now()}`,
      taskId: selectedTaskId,
      userId: activeUser.id,
      startTime: new Date().toISOString(),
      endTime: null,
      durationMinutes: null,
      percentageOnStop: null,
      isAutoStopped: false,
      notes: ""
    };

    // Update tasks status to In Progress
    setTasks(prev => prev.map(t => t.id === selectedTaskId ? { ...t, status: "In Progress" } : t));
    setTimeLogs(prev => [...prev, newLog]);
    setActiveLog(newLog);
  };

  // Trigger stop modal
  const handleStopTrigger = () => {
    if (!activeLog) return;
    const task = tasks.find(t => t.id === activeLog.taskId);
    setStopForm({
      pct: task ? task.percentage : 0,
      notes: ""
    });
    setIsStopModalOpen(true);
  };

  // Submit Stopped session
  const handleStopTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeLog) return;

    const stopTime = new Date();
    const startTime = new Date(activeLog.startTime);
    const diffMs = stopTime.getTime() - startTime.getTime();
    const durationMins = Math.max(1, Math.floor(diffMs / 60000)); // Minimum 1 minute log

    const isTaskCompleted = stopForm.pct >= 100;

    // 1. Update Time Log
    setTimeLogs(prev => prev.map(log => log.id === activeLog.id ? {
      ...log,
      endTime: stopTime.toISOString(),
      durationMinutes: durationMins,
      percentageOnStop: stopForm.pct,
      notes: stopForm.notes || "Activity logged successfully."
    } : log));

    // 2. Update Task Progress and Status
    setTasks(prev => prev.map(t => t.id === activeLog.taskId ? {
      ...t,
      percentage: stopForm.pct,
      status: isTaskCompleted ? "Completed" : "In Progress",
      completedDate: isTaskCompleted ? stopTime.toISOString() : null
    } : t));

    setIsStopModalOpen(false);
    setActiveLog(null);
  };

  // Toggle checklist tasks
  const handleToggleTodo = (taskId: string, todoId: string) => {
    setTasks(prev => prev.map(task => {
      if (task.id === taskId) {
        const updatedList = task.todoList.map(item => 
          item.id === todoId ? { ...item, completed: !item.completed } : item
        );
        // Recalculate percentage based on checked todo items as helper
        const completedCount = updatedList.filter(i => i.completed).length;
        const autoPct = updatedList.length > 0 ? Math.round((completedCount / updatedList.length) * 100) : task.percentage;

        return {
          ...task,
          todoList: updatedList,
          percentage: autoPct,
          status: autoPct === 100 ? "Completed" : task.status,
          completedDate: autoPct === 100 ? new Date().toISOString() : task.completedDate
        };
      }
      return task;
    }));
  };

  // Toggle entire task completion with all subtasks
  const handleToggleTaskCompletion = (taskId: string) => {
    setTasks(prev => prev.map(task => {
      if (task.id === taskId) {
        const isCurrentlyCompleted = task.status === "Completed";
        const newStatus = isCurrentlyCompleted ? "Pending" : "Completed";
        const newPct = isCurrentlyCompleted ? 0 : 100;
        
        // Mark all subtasks in todoList to match the main task completion
        const updatedTodoList = task.todoList.map(item => ({
          ...item,
          completed: !isCurrentlyCompleted
        }));

        return {
          ...task,
          status: newStatus,
          percentage: newPct,
          todoList: updatedTodoList,
          completedDate: !isCurrentlyCompleted ? new Date().toISOString() : null
        };
      }
      return task;
    }));
  };

  const handleAddSubtask = (taskId: string) => {
    if (!newSubtaskText.trim()) return;
    setTasks(prev => prev.map(task => {
      if (task.id === taskId) {
        const newSubtask = {
          id: `subtask-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          text: newSubtaskText.trim(),
          completed: false
        };
        const updatedList = [...task.todoList, newSubtask];
        const completedCount = updatedList.filter(i => i.completed).length;
        const autoPct = updatedList.length > 0 ? Math.round((completedCount / updatedList.length) * 100) : task.percentage;

        return {
          ...task,
          todoList: updatedList,
          percentage: autoPct,
          status: autoPct === 100 ? "Completed" : task.status,
          completedDate: autoPct === 100 ? new Date().toISOString() : task.completedDate
        };
      }
      return task;
    }));
    setNewSubtaskText("");
  };

  const handleDeleteSubtask = (taskId: string, subtaskId: string) => {
    setTasks(prev => prev.map(task => {
      if (task.id === taskId) {
        const updatedList = task.todoList.filter(item => item.id !== subtaskId);
        const completedCount = updatedList.filter(i => i.completed).length;
        const autoPct = updatedList.length > 0 ? Math.round((completedCount / updatedList.length) * 100) : 0;

        return {
          ...task,
          todoList: updatedList,
          percentage: autoPct,
          status: autoPct === 100 ? "Completed" : task.status,
          completedDate: autoPct === 100 ? new Date().toISOString() : task.completedDate
        };
      }
      return task;
    }));
  };

  // Google Calendar integration simulation
  const handleCalendarConnectToggle = () => {
    if (isCalendarConnected) {
      setIsCalendarConnected(false);
      return;
    }

    setIsSyncingCalendar(true);
    setTimeout(() => {
      setIsSyncingCalendar(false);
      setIsCalendarConnected(true);
      setShowSyncSuccessAlert(true);
      setTimeout(() => setShowSyncSuccessAlert(false), 5000);
    }, 1500);
  };

  const handleGenerateStandup = async () => {
    setIsStandupModalOpen(true);
    setIsGeneratingStandup(true);
    setStandupText("");
    try {
      const completedSubtasksToday = myTasks.flatMap(task => 
        task.todoList.filter(item => item.completed).map(item => `${task.name}: ${item.text}`)
      );
      
      const activeTaskNames = myTasks.filter(t => t.status === "In Progress").map(t => t.name);
      
      const today = new Date().toDateString();
      const myLogs = timeLogs.filter(log => log.userId === activeUser.id);
      const logsTodayList = myLogs.filter(log => {
        const logDate = new Date(log.startTime).toDateString();
        return logDate === today;
      }).map(log => {
        const task = tasks.find(t => t.id === log.taskId);
        const duration = log.durationMinutes ? `${(log.durationMinutes / 60).toFixed(1)} hrs` : "ongoing";
        return `${task?.name || "Task"}: ${duration} logged.`;
      });

      const res = await fetch("/api/gemini/compose-standup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          completedSubtasks: completedSubtasksToday,
          logsToday: logsTodayList,
          activeTasks: activeTaskNames,
          userName: activeUser.fullName,
          tone: standupTone
        })
      });
      if (!res.ok) {
        throw new Error("Failed to contact Gemini API.");
      }
      const data = await res.json();
      setStandupText(data.standup || "No standup notes could be extracted.");
    } catch (err: any) {
      console.error(err);
      setStandupText(`### Error Composing Update\n\n${err.message || "Please check if GEMINI_API_KEY is configured in Settings > Secrets."}`);
    } finally {
      setIsGeneratingStandup(false);
    }
  };

  const handleRefineNotes = async () => {
    if (!stopForm.notes.trim()) return;
    setIsRefiningNotes(true);
    try {
      const activeTaskRef = tasks.find(t => t.id === activeLog?.taskId);
      const res = await fetch("/api/gemini/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `Refine the following developer work log draft into a single, elegant, professional, action-oriented sentence for corporate logging. Start with an action verb (e.g. "Completed", "Refactored", "Optimized") and sound highly polished. Keep it clear, concise and professional. Draft notes: "${stopForm.notes}"`,
          context: {
            taskName: activeTaskRef?.name || "Corporate Task",
            projectName: projects.find(p => p.id === activeTaskRef?.projectId)?.name || "N/A"
          }
        })
      });
      if (!res.ok) {
        throw new Error("Notes refinement failed.");
      }
      const data = await res.json();
      const polishedResult = data.result ? data.result.replace(/^["']|["']$/g, "").trim() : stopForm.notes;
      setStopForm(prev => ({ ...prev, notes: polishedResult }));
    } catch (err) {
      console.error(err);
      alert("Notes refinement temporarily unavailable. Keeping original draft.");
    } finally {
      setIsRefiningNotes(false);
    }
  };

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedStandup(true);
    setTimeout(() => setCopiedStandup(false), 2000);
  };

  const handleAddPresetSubtask = (text: string) => {
    if (!currentTask) return;
    setTasks(prev => prev.map(task => {
      if (task.id === currentTask.id) {
        const newSubtask = {
          id: `subtask-preset-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          text: text,
          completed: false
        };
        const updatedList = [...task.todoList, newSubtask];
        const completedCount = updatedList.filter(i => i.completed).length;
        const autoPct = updatedList.length > 0 ? Math.round((completedCount / updatedList.length) * 100) : task.percentage;

        return {
          ...task,
          todoList: updatedList,
          percentage: autoPct,
          status: autoPct === 100 ? "Completed" : task.status,
          completedDate: autoPct === 100 ? new Date().toISOString() : task.completedDate
        };
      }
      return task;
    }));
  };

  const handleAiChecklistGeneration = async () => {
    if (!currentTask) return;
    setIsGeneratingChecklist(true);
    setChecklistFeedback("");
    try {
      const res = await fetch("/api/gemini/draft-task", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskName: currentTask.name,
          projectName: currentProjectName,
          estimatedHours: currentTask.estimatedHours
        })
      });
      if (!res.ok) {
        throw new Error("Checklist generation failed.");
      }
      const data = await res.json();
      if (data.subtasks && Array.isArray(data.subtasks) && data.subtasks.length > 0) {
        const newItems = data.subtasks.map((st: string) => ({
          id: `subtask-ai-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          text: st,
          completed: false
        }));

        setTasks(prev => prev.map(task => {
          if (task.id === currentTask.id) {
            const updatedList = [...task.todoList, ...newItems];
            const completedCount = updatedList.filter(i => i.completed).length;
            const autoPct = updatedList.length > 0 ? Math.round((completedCount / updatedList.length) * 100) : task.percentage;

            return {
              ...task,
              todoList: updatedList,
              percentage: autoPct,
              status: autoPct === 100 ? "Completed" : task.status,
              completedDate: autoPct === 100 ? new Date().toISOString() : task.completedDate
            };
          }
          return task;
        }));
        setChecklistFeedback("Success! Appended AI checklist.");
        setTimeout(() => setChecklistFeedback(""), 4000);
      } else {
        throw new Error("No checklist items generated.");
      }
    } catch (err: any) {
      console.error(err);
      setChecklistFeedback("Error: " + (err.message || "Check API keys in settings."));
      setTimeout(() => setChecklistFeedback(""), 4000);
    } finally {
      setIsGeneratingChecklist(false);
    }
  };

  const handleExportCSV = () => {
    if (myLogs.length === 0) {
      alert("No time logs recorded yet.");
      return;
    }
    let csv = "Task Name,Project Name,Started At,Completed At,Duration (Minutes),Progress Logged,Notes\n";
    myLogs.forEach(log => {
      const taskRef = tasks.find(t => t.id === log.taskId);
      const projName = taskRef ? (projects.find(p => p.id === taskRef.projectId)?.name || "N/A") : "N/A";
      csv += `"${taskRef?.name || "N/A"}","${projName}","${log.startTime}","${log.endTime || "Running"}","${log.durationMinutes || 0}","${log.percentageOnStop || 0}%","${(log.notes || "").replace(/"/g, '""')}"\n`;
    });
    // Add UTF-8 BOM for Microsoft Excel compatibility
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `timesheet_logs_${activeUser.fullName.replace(/\s+/g, "_")}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportCustomRangeCSV = (filteredLogs: TimeLog[], reportUser: User) => {
    if (filteredLogs.length === 0) {
      alert("No logs to export in this date range.");
      return;
    }
    let csv = "Employee Name,Task Name,Project Name,Started At,Completed At,Duration (Hours),Progress Logged,Notes\n";
    filteredLogs.forEach(log => {
      const taskRef = tasks.find(t => t.id === log.taskId);
      const projName = taskRef ? (projects.find(p => p.id === taskRef.projectId)?.name || "N/A") : "N/A";
      const actualHrs = log.durationMinutes ? (log.durationMinutes / 60).toFixed(2) : (log.isAutoStopped ? "6.00" : "Running");
      csv += `"${reportUser.fullName}","${(taskRef?.name || "N/A").replace(/"/g, '""')}","${projName.replace(/"/g, '""')}","${log.startTime}","${log.endTime || "Running"}","${actualHrs}","${log.percentageOnStop || 0}%","${(log.notes || "").replace(/"/g, '""')}"\n`;
    });
    // Add UTF-8 BOM for Microsoft Excel compatibility
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `timesheet_report_${reportUser.fullName.replace(/\s+/g, "_")}_${reportStartDate}_to_${reportEndDate}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Real ICS file generator to sync with any Google Calendar!
  const handleExportICS = () => {
    if (myTasks.length === 0) {
      alert("No tasks scheduled to export.");
      return;
    }

    let icsContent = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Task Tracker//Enterprise Schedulers//EN\n";

    myTasks.forEach(task => {
      const createdDateFormatted = task.createdDate.replace(/[-:]/g, "").split(".")[0] + "Z";
      // Schedule event duration based on estimated hours
      const startDate = new Date(task.createdDate);
      const endDate = new Date(startDate.getTime() + task.estimatedHours * 60 * 60 * 1000);
      const startDateFormatted = startDate.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
      const endDateFormatted = endDate.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

      icsContent += "BEGIN:VEVENT\n";
      icsContent += `UID:task-${task.id}@company.com\n`;
      icsContent += `DTSTAMP:${createdDateFormatted}\n`;
      icsContent += `DTSTART:${startDateFormatted}\n`;
      icsContent += `DTEND:${endDateFormatted}\n`;
      icsContent += `SUMMARY:[Task] ${task.name}\n`;
      icsContent += `DESCRIPTION:Project: ${projects.find(p => p.id === task.projectId)?.name || "N/A"}\\nEstimated Hours: ${task.estimatedHours}h\\nDescription: ${task.description.replace(/\n/g, "\\n")}\\nProgress: ${task.percentage}%\\n\n`;
      icsContent += "END:VEVENT\n";
    });

    icsContent += "END:VCALENDAR";

    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `my_schedule_tasks.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Resolve active task details
  const currentTask = tasks.find(t => t.id === selectedTaskId);
  const currentProjectName = currentTask ? (projects.find(p => p.id === currentTask.projectId)?.name || "N/A") : "N/A";

  // Daily logged logs for current user
  const myLogs = timeLogs.filter(l => l.userId === activeUser.id);

  // Resolve target user for the report
  const selectedReportUser = users.find(u => u.id === reportUserId) || activeUser;

  // Filter logs for this specific person and date period (inclusive)
  const reportFilteredLogs = timeLogs.filter(log => {
    if (log.userId !== reportUserId) return false;
    if (!log.startTime) return false;
    
    const logDateStr = log.startTime.substring(0, 10);
    const startMatch = reportStartDate ? logDateStr >= reportStartDate : true;
    const endMatch = reportEndDate ? logDateStr <= reportEndDate : true;
    
    const taskRef = tasks.find(t => t.id === log.taskId);
    const projName = taskRef ? (projects.find(p => p.id === taskRef.projectId)?.name || "") : "";
    const matchesSearch = reportSearchQuery ? (
      (taskRef?.name || "").toLowerCase().includes(reportSearchQuery.toLowerCase()) ||
      projName.toLowerCase().includes(reportSearchQuery.toLowerCase()) ||
      (log.notes || "").toLowerCase().includes(reportSearchQuery.toLowerCase())
    ) : true;

    return startMatch && endMatch && matchesSearch;
  });

  // Calculate statistics for the reported period
  const totalReportMinutes = reportFilteredLogs.reduce((acc, log) => acc + (log.durationMinutes || 0), 0);
  const totalReportHours = (totalReportMinutes / 60).toFixed(1);

  // Active Days count
  const activeDaysSet = new Set(reportFilteredLogs.map(log => log.startTime.substring(0, 10)));
  const activeDaysCount = activeDaysSet.size;

  // Average Daily Hours
  const avgDailyHours = activeDaysCount > 0 ? (parseFloat(totalReportHours) / activeDaysCount).toFixed(1) : "0.0";

  // Completed Tasks in this period by this person
  const completedTasksInPeriod = tasks.filter(t => {
    if (t.assignedUserId !== reportUserId) return false;
    if (t.status !== "Completed" || !t.completedDate) return false;
    const compDateStr = t.completedDate.substring(0, 10);
    const startMatch = reportStartDate ? compDateStr >= reportStartDate : true;
    const endMatch = reportEndDate ? compDateStr <= reportEndDate : true;
    return startMatch && endMatch;
  }).length;

  // Project Hour Breakdown
  const projectBreakdown: { [key: string]: { name: string; minutes: number } } = {};
  reportFilteredLogs.forEach(log => {
    const taskRef = tasks.find(t => t.id === log.taskId);
    const projId = taskRef?.projectId || "other";
    const projName = taskRef ? (projects.find(p => p.id === taskRef.projectId)?.name || "Unassigned Project") : "Unassigned Project";
    
    if (!projectBreakdown[projId]) {
      projectBreakdown[projId] = { name: projName, minutes: 0 };
    }
    projectBreakdown[projId].minutes += (log.durationMinutes || 0);
  });

  const projectBreakdownList = Object.values(projectBreakdown).map(item => {
    const hrs = parseFloat((item.minutes / 60).toFixed(1));
    const pct = totalReportMinutes > 0 ? Math.round((item.minutes / totalReportMinutes) * 100) : 0;
    return { ...item, hours: hrs, percentage: pct };
  }).sort((a, b) => b.minutes - a.minutes);

  // Copy Plain Text Report Summary
  const handleCopyReportText = () => {
    let text = `========================================\n`;
    text += `⏱ TIME SCHEDULE REPORT FOR ${selectedReportUser.fullName.toUpperCase()}\n`;
    text += `📅 PERIOD: ${reportStartDate} to ${reportEndDate}\n`;
    text += `========================================\n\n`;
    text += `📊 METRICS SUMMARY:\n`;
    text += `- Total Hours Logged: ${totalReportHours} hrs\n`;
    text += `- Active Workdays: ${activeDaysCount} days\n`;
    text += `- Daily Average Hours: ${avgDailyHours} hrs/day\n`;
    text += `- Workpieces Completed: ${completedTasksInPeriod}\n\n`;
    
    if (projectBreakdownList.length > 0) {
      text += `📂 PROJECT TIME DISTRIBUTION:\n`;
      projectBreakdownList.forEach(p => {
        text += `- ${p.name}: ${p.hours} hrs (${p.percentage}%)\n`;
      });
      text += `\n`;
    }

    text += `📝 DETAILED ENTRY SCHEDULE:\n`;
    if (reportFilteredLogs.length === 0) {
      text += `No work sessions logged during this period.\n`;
    } else {
      reportFilteredLogs.forEach((log, idx) => {
        const taskRef = tasks.find(t => t.id === log.taskId);
        const projName = taskRef ? (projects.find(p => p.id === taskRef.projectId)?.name || "N/A") : "N/A";
        const actualHrs = log.durationMinutes ? (log.durationMinutes / 60).toFixed(1) : "Running";
        const dateStr = new Date(log.startTime).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
        text += `${idx + 1}. [${dateStr}] [${projName}] - ${taskRef?.name || "Corporate Work"}\n`;
        text += `   Duration: ${actualHrs} hrs (${new Date(log.startTime).toLocaleTimeString()} - ${log.endTime ? new Date(log.endTime).toLocaleTimeString() : "Ongoing"})\n`;
        if (log.notes) {
          text += `   Notes: "${log.notes}"\n`;
        }
        text += `\n`;
      });
    }
    
    navigator.clipboard.writeText(text);
    setCopiedReportText(true);
    setTimeout(() => setCopiedReportText(false), 2000);
  };

  // Filter, search & SORT active tasks
  const filteredMyTasks = myTasks.filter(task => {
    const proj = projects.find(p => p.id === task.projectId);
    const matchesSearch = task.name.toLowerCase().includes(taskSearch.toLowerCase()) || 
      (proj?.name || "").toLowerCase().includes(taskSearch.toLowerCase()) ||
      (task.description || "").toLowerCase().includes(taskSearch.toLowerCase());
    const matchesStatus = statusFilter === "All" ? true : task.status === statusFilter;
    return matchesSearch && matchesStatus;
  }).sort((a, b) => {
    if (sortBy === "name") {
      return a.name.localeCompare(b.name);
    }
    if (sortBy === "hours") {
      return b.estimatedHours - a.estimatedHours;
    }
    if (sortBy === "progress") {
      return b.percentage - a.percentage;
    }
    // Default to createdDate (newest first)
    return new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime();
  });

  // Calculate stats for today
  const todayStr = new Date().toDateString();
  const todayLogs = timeLogs.filter(log => {
    if (log.userId !== activeUser.id) return false;
    const logDate = new Date(log.startTime).toDateString();
    return logDate === todayStr;
  });
  const todayMinutes = todayLogs.reduce((acc, log) => acc + (log.durationMinutes || 0), 0);
  const todayHours = (todayMinutes / 60).toFixed(1);

  const totalTasksCount = myTasks.length;
  const completedTasksCount = myTasks.filter(t => t.status === "Completed").length;
  const inProgressTasksCount = myTasks.filter(t => t.status === "In Progress").length;

  // Overall Checklist Completion Health index across assigned tasks
  const totalSubtasks = myTasks.reduce((acc, t) => acc + t.todoList.length, 0);
  const completedSubtasks = myTasks.reduce((acc, t) => acc + t.todoList.filter(item => item.completed).length, 0);
  const subtaskHealthRate = totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0;

  // Weekly hours logged (rolling 7 days)
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const weeklyLogs = myLogs.filter(log => new Date(log.startTime) >= oneWeekAgo);
  const weeklyMinutes = weeklyLogs.reduce((acc, log) => acc + (log.durationMinutes || 0), 0);
  const weeklyHours = (weeklyMinutes / 60).toFixed(1);

  return (
    <div className="space-y-6">
      {/* QUICK STATS & METRICS DASHBOARD */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* User Card */}
        <div className="col-span-2 bg-gradient-to-r from-indigo-950/50 via-slate-900 to-slate-900 p-4 rounded-2xl border border-indigo-500/10 flex items-center gap-3.5 shadow-md">
          <div className="w-11 h-11 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-slate-100 text-sm shadow-md shrink-0">
            {activeUser.fullName.charAt(0)}
          </div>
          <div className="min-w-0">
            <span className="text-[9px] text-indigo-400 font-bold uppercase tracking-wider block">Logged in Employee</span>
            <h3 className="font-bold text-slate-100 text-sm mt-0.5 truncate">{activeUser.fullName}</h3>
            <span className="text-slate-500 text-[10px] block mt-0.5 truncate">{activeUser.email}</span>
          </div>
        </div>

        {/* Total Tasks & Completion Ratio */}
        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center gap-3 shadow-md">
          <div className="p-2.5 bg-slate-900 rounded-xl">
            <ListTodo className="h-5 w-5 text-indigo-400" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 uppercase font-semibold block">Task Finish Ratio</span>
            <span className="text-sm font-mono font-bold text-slate-200 mt-0.5 block">
              {completedTasksCount}/{totalTasksCount}
            </span>
          </div>
        </div>

        {/* In Progress */}
        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center gap-3 shadow-md">
          <div className="p-2.5 bg-slate-900 rounded-xl relative">
            {activeLog && <span className="absolute top-1 right-1 w-2 h-2 bg-emerald-400 rounded-full animate-ping" />}
            <TrendingUp className={`h-5 w-5 ${activeLog ? "text-emerald-400" : "text-amber-400"}`} />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 uppercase font-semibold block">In Progress</span>
            <span className={`text-base font-mono font-bold mt-0.5 block ${activeLog ? "text-emerald-400" : "text-amber-400"}`}>
              {inProgressTasksCount}
            </span>
          </div>
        </div>

        {/* Checklist Health Index */}
        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center gap-3 shadow-md">
          <div className="p-2.5 bg-slate-900 rounded-xl">
            <Award className="h-5 w-5 text-amber-400" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 uppercase font-semibold block">Checklist Health</span>
            <span className="text-base font-mono font-bold text-amber-400 mt-0.5 block">
              {subtaskHealthRate}%
            </span>
          </div>
        </div>

        {/* Hours Logged Today & Week */}
        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center gap-3 shadow-md col-span-1">
          <div className="p-2.5 bg-slate-900 rounded-xl">
            <Clock className="h-5 w-5 text-emerald-400" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 uppercase font-semibold block">Today / Weekly</span>
            <span className="text-xs font-mono font-bold text-emerald-400 mt-0.5 block">
              {todayHours}h / {weeklyHours}h
            </span>
          </div>
        </div>
      </div>

      {/* GRAPHICAL TASK VELOCITY & STATUS DASHBOARD */}
      <TaskDashboard
        tasks={tasks}
        users={users}
        projects={projects}
        activeUser={activeUser}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-xs text-left">
        {/* LEFT COLUMN: ACTIVE WORK PIECE SELECTOR & SYNC TOOLS */}
        <div className="lg:col-span-1 space-y-5">
          
          {/* 1. TIME TRACKER & DAILY STOPWATCH CARD */}
          <div className="bg-slate-950 rounded-2xl border border-slate-800 shadow-lg overflow-hidden transition-all duration-300">
            {/* Header with toggle */}
            <div 
              onClick={() => setIsTimerCollapsed(!isTimerCollapsed)}
              className="px-5 py-4 bg-slate-900/40 border-b border-slate-900 flex items-center justify-between cursor-pointer select-none hover:bg-slate-900/80 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-500" />
                <div>
                  <h4 className="font-semibold text-slate-200 text-xs uppercase tracking-wider">
                    Stopwatch Tracker
                  </h4>
                  {isTimerCollapsed && (
                    <p className="text-[10px] font-mono text-slate-400 mt-0.5">
                      {activeLog ? (
                        <span className="text-emerald-400 font-bold animate-pulse">
                          ⚡ Tracking: {tickerTime}
                        </span>
                      ) : (
                        <span className="text-slate-500">Idle</span>
                      )}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {activeLog && !isTimerCollapsed && (
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                )}
                {isTimerCollapsed ? (
                  <ChevronDown className="h-4 w-4 text-slate-500" />
                ) : (
                  <ChevronUp className="h-4 w-4 text-slate-500" />
                )}
              </div>
            </div>

            <AnimatePresence initial={false}>
              {!isTimerCollapsed && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-5 space-y-4">
                    <p className="text-slate-500 text-[11px] leading-relaxed">
                      Pick any assigned workpiece from your tasks, kick off the stopwatch, and log completion percentage at any point.
                    </p>

                    {/* Live Ticker display */}
                    <div className="py-5 bg-slate-900/30 border border-slate-900 rounded-xl flex flex-col items-center justify-center relative overflow-hidden">
                      {activeLog && (
                        <div className="absolute inset-0 bg-emerald-500/5 animate-pulse pointer-events-none" />
                      )}
                      <span className={`font-mono text-3xl font-bold tracking-widest transition-all ${
                        activeLog ? "text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.3)]" : "text-slate-600"
                      }`}>
                        {tickerTime}
                      </span>
                      <span className="text-[9px] uppercase tracking-wider text-slate-500 font-bold font-mono mt-1 flex items-center gap-1.5">
                        {activeLog ? (
                          <>
                            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />
                            Active Track Session
                          </>
                        ) : (
                          "Stopwatch Offline"
                        )}
                      </span>
                    </div>

                    <div className="space-y-3.5">
                      <div className="space-y-1">
                        <label className="text-slate-500 font-bold text-[10px] uppercase">Active Target Workpiece</label>
                        <select
                          value={selectedTaskId}
                          disabled={!!activeLog}
                          onChange={e => setSelectedTaskId(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-850 text-slate-200 px-3 py-2 rounded-xl focus:outline-none focus:border-amber-500 disabled:opacity-50 disabled:cursor-not-allowed text-xs transition-colors"
                        >
                          {myTasks.length === 0 ? (
                            <option value="">No tasks assigned to you</option>
                          ) : (
                            myTasks.map(t => (
                              <option key={t.id} value={t.id}>
                                [{t.status}] {t.name}
                              </option>
                            ))
                          )}
                        </select>
                      </div>

                      {activeLog ? (
                        <button
                          onClick={handleStopTrigger}
                          className="w-full bg-rose-500 hover:bg-rose-400 text-slate-950 font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg hover:shadow-rose-500/10 transition-all cursor-pointer"
                        >
                          <Square className="h-3.5 w-3.5 fill-slate-950" />
                          Stop & Submit Progress
                        </button>
                      ) : (
                        <button
                          onClick={handleStartTask}
                          disabled={myTasks.length === 0 || !selectedTaskId}
                          className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg hover:shadow-amber-500/10 transition-all cursor-pointer"
                        >
                          <Play className="h-3.5 w-3.5 fill-slate-950" />
                          Start Active Session
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* 2. MY ASSIGNED TO-DO TASKS LIST CARD (The Primary View - Non Collapsible for immediate UX) */}
          <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 shadow-lg space-y-4">
            <div className="flex items-center justify-between border-b border-slate-900 pb-3 gap-2">
              <div className="flex flex-col gap-1 min-w-0">
                <h4 className="font-semibold text-slate-200 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <CheckSquare className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span className="truncate">Assigned Workpieces ({myTasks.length})</span>
                </h4>
                <p className="text-slate-500 text-[10px] truncate">
                  Click cards to open workspace, or check box to toggle completion.
                </p>
              </div>
              
              {/* Layout Toggle Option */}
              <div className="flex bg-slate-900 p-0.5 rounded-lg border border-slate-850 shrink-0">
                <button
                  type="button"
                  onClick={() => setViewMode("list")}
                  className={`p-1 rounded transition-all cursor-pointer ${
                    viewMode === "list" ? "bg-indigo-600 text-slate-100" : "text-slate-500 hover:text-slate-300"
                  }`}
                  title="List View"
                >
                  <List className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  className={`p-1 rounded transition-all cursor-pointer ${
                    viewMode === "grid" ? "bg-indigo-600 text-slate-100" : "text-slate-500 hover:text-slate-300"
                  }`}
                  title="Grid View"
                >
                  <LayoutGrid className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Search and Filters */}
            <div className="space-y-2.5">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search assignments..."
                    value={taskSearch}
                    onChange={e => setTaskSearch(e.target.value)}
                    className="w-full bg-slate-900/60 border border-slate-850 text-slate-200 pl-8.5 pr-3 py-1.5 rounded-xl text-[11px] focus:outline-none focus:border-indigo-500 placeholder-slate-600 transition-colors"
                  />
                </div>
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value as any)}
                  className="bg-slate-900/80 border border-slate-850 text-slate-400 hover:text-slate-200 px-2.5 py-1.5 rounded-xl text-[10px] font-bold focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer shrink-0"
                  title="Sort Assignments"
                >
                  <option value="created">📅 Newest Assigned</option>
                  <option value="name">🔤 Name (A-Z)</option>
                  <option value="hours">⏱ Allocated Hours</option>
                  <option value="progress">📈 Completion %</option>
                </select>
              </div>

              {/* Status Filter Badges (Pills) */}
              <div className="flex flex-wrap gap-1">
                {(["All", "Pending", "In Progress", "Completed"] as const).map(status => {
                  const count = status === "All" ? myTasks.length : myTasks.filter(t => t.status === status).length;
                  const isSelected = statusFilter === status;
                  return (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setStatusFilter(status)}
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
                        isSelected 
                          ? "bg-indigo-600 text-slate-100 shadow-md scale-102" 
                          : "bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-850"
                      }`}
                    >
                      <span>{status}</span>
                      <span className={`text-[9px] px-1 rounded-md ${
                        isSelected ? "bg-indigo-700 text-indigo-100" : "bg-slate-800 text-slate-500"
                      }`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className={`max-h-[350px] overflow-y-auto pr-1 ${
              viewMode === "grid" 
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-3" 
                : "space-y-2.5"
            }`}>
              {filteredMyTasks.length === 0 ? (
                <div className="text-center py-10 text-slate-600 font-medium bg-slate-900/10 border border-slate-850 border-dashed rounded-xl col-span-full">
                  {myTasks.length === 0 ? "No tasks assigned to you." : "No tasks match your filter."}
                </div>
              ) : (
                filteredMyTasks.map(t => {
                  const proj = projects.find(p => p.id === t.projectId);
                  const isSelected = t.id === selectedTaskId;
                  const isCompleted = t.status === "Completed";
                  const taskActive = activeLog && activeLog.taskId === t.id;
                  
                  if (viewMode === "grid") {
                    return (
                      <div
                        key={t.id}
                        className={`p-3 rounded-xl border transition-all flex flex-col justify-between cursor-pointer group hover:scale-[1.01] duration-250 ${
                          isSelected 
                            ? "bg-indigo-950/20 border-indigo-500/40 shadow-lg shadow-indigo-500/5 ring-1 ring-indigo-500/10" 
                            : "bg-slate-900/50 border-slate-900 hover:bg-slate-900 hover:border-slate-800"
                        }`}
                        onClick={() => setSelectedTaskId(t.id)}
                      >
                        {/* Top Row: Project Tag & Status */}
                        <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-850/60">
                          <span className="text-[9px] text-indigo-400 font-mono font-bold tracking-wider truncate">
                            📁 {proj?.name || "N/A"}
                          </span>
                          <span className={`text-[8px] font-bold px-1.5 py-0.2 rounded shrink-0 uppercase tracking-wider ${
                            isCompleted ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                            taskActive ? "bg-emerald-500 text-slate-950 font-bold animate-pulse" :
                            t.status === "In Progress" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse" :
                            "bg-slate-800 text-slate-400 border border-slate-700"
                          }`}>
                            {taskActive ? "Active" : t.status}
                          </span>
                        </div>

                        {/* Middle Content */}
                        <div className="py-2.5 flex-1 flex flex-col justify-between">
                          <div>
                            <div className="flex items-start gap-2">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleTaskCompletion(t.id);
                                }}
                                className="mt-0.5 text-slate-500 hover:text-emerald-400 transition-colors shrink-0 cursor-pointer"
                                title={isCompleted ? "Mark as Pending" : "Mark as Completed"}
                              >
                                {isCompleted ? (
                                  <CheckSquare className="h-4 w-4 text-emerald-400 shrink-0" />
                                ) : (
                                  <SquareIcon className="h-4 w-4 text-slate-600 shrink-0 hover:text-slate-400" />
                                )}
                              </button>
                              <h5 className={`font-semibold text-slate-200 text-xs leading-snug break-words group-hover:text-indigo-300 transition-colors ${
                                isCompleted ? "line-through text-slate-500 decoration-slate-600/60" : ""
                              }`}>
                                {t.name}
                              </h5>
                            </div>
                            {t.description && (
                              <p className="text-slate-500 text-[10px] mt-1.5 line-clamp-2 leading-relaxed pl-6">
                                {t.description}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Bottom Row: Hours & Progress */}
                        <div className="pt-2 border-t border-slate-850/60 mt-auto">
                          <div className="flex items-center justify-between text-[9px] text-slate-400 mb-1">
                            <span className="font-mono">⏳ {t.estimatedHours}h allocated</span>
                            <span className="font-mono font-bold text-slate-300">{t.percentage}% done</span>
                          </div>
                          <div className="w-full bg-slate-950 h-1 rounded-full overflow-hidden border border-slate-850/80">
                            <div 
                              className={`h-full rounded-full transition-all duration-500 ${isCompleted ? "bg-emerald-400" : "bg-indigo-500"}`} 
                              style={{ width: `${t.percentage}%` }} 
                            />
                          </div>
                        </div>
                      </div>
                    );
                  }

                  // Default list view fallback
                  return (
                    <div
                      key={t.id}
                      className={`p-3 rounded-xl border transition-all flex items-start gap-3 cursor-pointer ${
                        isSelected 
                          ? "bg-indigo-950/20 border-indigo-500/40 shadow-md ring-1 ring-indigo-500/10" 
                          : "bg-slate-900/50 border-slate-900 hover:bg-slate-900 hover:border-slate-800"
                      }`}
                      onClick={() => setSelectedTaskId(t.id)}
                    >
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleTaskCompletion(t.id);
                        }}
                        className="mt-0.5 text-slate-500 hover:text-emerald-400 transition-colors shrink-0 cursor-pointer"
                        title={isCompleted ? "Mark as Pending" : "Mark as Completed"}
                      >
                        {isCompleted ? (
                          <CheckSquare className="h-4 w-4 text-emerald-400 shrink-0" />
                        ) : (
                          <SquareIcon className="h-4 w-4 text-slate-600 shrink-0 hover:text-slate-400" />
                        )}
                      </button>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[9px] text-slate-500 font-mono font-bold truncate">
                            {proj?.name || "N/A"}
                          </span>
                          <span className={`text-[8px] font-bold px-1.5 py-0.2 rounded shrink-0 uppercase tracking-wider ${
                            isCompleted ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                            taskActive ? "bg-emerald-500 text-slate-950 font-bold animate-pulse" :
                            t.status === "In Progress" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse" :
                            "bg-slate-800 text-slate-400 border border-slate-700"
                          }`}>
                            {taskActive ? "Active" : t.status}
                          </span>
                        </div>

                        <h5 className={`font-semibold text-slate-200 text-xs mt-1 leading-snug break-words ${
                          isCompleted ? "line-through text-slate-500 decoration-slate-600/60" : ""
                        }`}>
                          {t.name}
                        </h5>

                        <div className="flex items-center justify-between gap-2 mt-2">
                          <span className="text-[9px] text-slate-500 font-mono">
                            {t.estimatedHours}h allocated
                          </span>
                          <div className="flex items-center gap-1.5">
                            <div className="w-12 bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-850">
                              <div className={`h-full rounded-full transition-all duration-500 ${isCompleted ? "bg-emerald-500" : "bg-indigo-500"}`} style={{ width: `${t.percentage}%` }} />
                            </div>
                            <span className="text-[10px] text-slate-400 font-mono font-bold">
                              {t.percentage}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* 3. GOOGLE CALENDAR CARD INTEGRATION (Collapsible) */}
          <div className="bg-slate-950 rounded-2xl border border-slate-800 shadow-lg overflow-hidden transition-all duration-300">
            {/* Header toggle */}
            <div 
              onClick={() => setIsCalendarCollapsed(!isCalendarCollapsed)}
              className="px-5 py-4 bg-slate-900/40 border-b border-slate-900 flex items-center justify-between cursor-pointer select-none hover:bg-slate-900/80 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-emerald-500" />
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-slate-200 text-xs uppercase tracking-wider">
                    Calendar Sync
                  </h4>
                  <span className={`w-1.5 h-1.5 rounded-full ${isCalendarConnected ? "bg-emerald-400 animate-pulse" : "bg-slate-600"}`} />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-500 font-mono">
                  {isCalendarConnected ? "Connected" : "Not Linked"}
                </span>
                {isCalendarCollapsed ? (
                  <ChevronDown className="h-4 w-4 text-slate-500" />
                ) : (
                  <ChevronUp className="h-4 w-4 text-slate-500" />
                )}
              </div>
            </div>

            <AnimatePresence initial={false}>
              {!isCalendarCollapsed && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-5 space-y-4">
                    <p className="text-slate-500 text-[11px] leading-relaxed">
                      Sync deadline schedules automatically to your corporate Google Calendar to map workspace deadlines directly.
                    </p>

                    {showSyncSuccessAlert && (
                      <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-2.5 rounded-xl flex items-center gap-1.5 text-[10px]">
                        <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />
                        <span>Google Workspace authenticated! Synced task deadlines.</span>
                      </div>
                    )}

                    <div className="bg-slate-900 border border-slate-850 p-3 rounded-xl flex items-center justify-between">
                      <span className="font-semibold text-slate-300">Google Services Synced</span>
                      <button
                        onClick={handleCalendarConnectToggle}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          isCalendarConnected ? "bg-emerald-500" : "bg-slate-750"
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-slate-950 shadow ring-0 transition duration-200 ease-in-out ${
                            isCalendarConnected ? "translate-x-4" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={handleExportICS}
                        className="flex-1 bg-slate-900 border border-slate-850 hover:bg-slate-800 text-slate-200 font-semibold py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all text-[11px] cursor-pointer"
                      >
                        <Download className="h-3.5 w-3.5 text-slate-400" />
                        Export ICS Schedule
                      </button>
                      {isCalendarConnected && (
                        <a
                          href="https://calendar.google.com"
                          target="_blank"
                          referrerPolicy="no-referrer"
                          className="bg-slate-900 border border-slate-850 hover:bg-slate-800 text-slate-200 font-medium px-3.5 py-2 rounded-xl flex items-center justify-center gap-1 transition-all"
                          title="Open Calendar Webpage"
                        >
                          <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
                        </a>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* 4. AI STANDUP COMPOSER CARD (Collapsible) */}
          <div className="bg-gradient-to-br from-slate-950 via-indigo-950/5 to-slate-950 rounded-2xl border border-indigo-500/10 shadow-lg overflow-hidden transition-all duration-300">
            {/* Header toggle */}
            <div 
              onClick={() => setIsStandupCollapsed(!isStandupCollapsed)}
              className="px-5 py-4 bg-indigo-950/20 border-b border-indigo-500/10 flex items-center justify-between cursor-pointer select-none hover:bg-indigo-950/40 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-indigo-400" />
                <h4 className="font-semibold text-slate-200 text-xs uppercase tracking-wider">
                  AI Standup Composer
                </h4>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full text-indigo-400 font-bold font-mono">
                  Gemini API
                </span>
                {isStandupCollapsed ? (
                  <ChevronDown className="h-4 w-4 text-indigo-400/70" />
                ) : (
                  <ChevronUp className="h-4 w-4 text-indigo-400/70" />
                )}
              </div>
            </div>

            <AnimatePresence initial={false}>
              {!isStandupCollapsed && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-5 space-y-4">
                    <p className="text-slate-400 text-[11px] leading-relaxed">
                      Generate a beautiful daily agile standup note from your completed subtasks and stopwatch duration logged.
                    </p>

                    {/* Tone Select Dropdown */}
                    <div className="space-y-1">
                      <label className="text-slate-500 font-bold text-[9px] uppercase tracking-wider">Configure Composer Tone</label>
                      <select
                        value={standupTone}
                        onChange={e => setStandupTone(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-850 text-slate-200 px-2.5 py-1.5 rounded-xl text-[11px] focus:outline-none focus:border-indigo-500"
                      >
                        <option value="Professional">💼 Corporate Professional</option>
                        <option value="Casual/Startup">🚀 Casual / Startup Style</option>
                        <option value="Highly Technical">🛠 Highly Technical Details</option>
                        <option value="Ultra Concise">⏱ Ultra Concise Summary</option>
                      </select>
                    </div>

                    <button
                      onClick={handleGenerateStandup}
                      className="w-full bg-indigo-600 hover:bg-indigo-500 text-slate-100 font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg hover:shadow-indigo-500/15 transition-all cursor-pointer"
                    >
                      <Sparkles className="h-3.5 w-3.5 animate-pulse" />
                      Compose Standup Note
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>

        {/* RIGHT COLUMN: ACTIVE WORKSPACE & CHECKLIST INTERACTIVE CANVAS */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Main Selected Workspace Card */}
          <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 shadow-lg min-h-[420px] flex flex-col justify-between relative">
            
            {currentTask ? (
              <div className="space-y-5 flex-1 flex flex-col justify-between">
                
                {/* Workspace Header Block */}
                <div>
                  
                  {/* Dynamic Contextual Stopwatch Control Banner (PREMIUM UX DETAIL) */}
                  {(() => {
                    const taskActive = activeLog && activeLog.taskId === currentTask.id;
                    const differentTaskActive = activeLog && activeLog.taskId !== currentTask.id;
                    const activeTaskRef = activeLog ? tasks.find(t => t.id === activeLog.taskId) : null;

                    if (taskActive) {
                      return (
                        <div className="mb-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 flex flex-col md:flex-row items-center justify-between gap-3 animate-pulse">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                            <div className="text-left">
                              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest block">Timer Running For This Task</span>
                              <span className="text-xs font-semibold text-slate-300">Elapsed session duration: <strong className="font-mono text-emerald-400">{tickerTime}</strong></span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={handleStopTrigger}
                            className="bg-rose-500 hover:bg-rose-400 text-slate-950 font-bold px-4 py-1.5 rounded-xl text-[10px] flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 shadow-md"
                          >
                            <Square className="h-3 w-3 fill-slate-950" />
                            Stop and Log Work
                          </button>
                        </div>
                      );
                    } else if (differentTaskActive) {
                      return (
                        <div className="mb-4 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 flex items-center gap-3">
                          <Info className="h-4 w-4 text-amber-500 shrink-0" />
                          <div className="text-left text-[11px] text-slate-300 flex-1">
                            <span className="font-bold text-amber-400 uppercase tracking-wider block text-[9px]">Stopwatch occupated</span>
                            You are tracking <strong className="text-slate-100">"{activeTaskRef?.name}"</strong>. Stop that session to track this task.
                          </div>
                        </div>
                      );
                    } else {
                      return (
                        <div className="mb-4 bg-slate-900 border border-slate-850 rounded-xl p-3 flex flex-col md:flex-row items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-slate-400 shrink-0" />
                            <div className="text-left">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Stopwatch Idle</span>
                              <span className="text-xs text-slate-400">Ready to record hours? Start tracking now.</span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedTaskId(currentTask.id);
                              handleStartTask();
                            }}
                            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-1.5 rounded-xl text-[10px] flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 shadow-md"
                          >
                            <Play className="h-3 w-3 fill-slate-950" />
                            Start Work Timer
                          </button>
                        </div>
                      );
                    }
                  })()}

                  <div className="flex items-start justify-between border-b border-slate-900 pb-3">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                        Workspace Focus : {currentProjectName}
                      </span>
                      <h3 className="text-base font-bold text-slate-100 mt-1">{currentTask.name}</h3>
                    </div>
                    <span className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase shrink-0 ${
                      currentTask.status === "Completed" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                      currentTask.status === "In Progress" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                      "bg-slate-800 text-slate-400 border border-slate-700"
                    }`}>
                      {currentTask.status}
                    </span>
                  </div>

                  {/* Metadata Grid */}
                  <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-3 border-b border-slate-900 pb-4">
                    <div className="bg-slate-900/40 p-2.5 rounded-lg border border-slate-850/80">
                      <span className="text-slate-500 font-medium block text-[9px] uppercase tracking-wider">Allocated Budget</span>
                      <span className="text-slate-200 font-mono font-bold mt-1 block">{currentTask.estimatedHours} hrs</span>
                    </div>
                    <div className="bg-slate-900/40 p-2.5 rounded-lg border border-slate-850/80">
                      <span className="text-slate-500 font-medium block text-[9px] uppercase tracking-wider">Task Supervisor</span>
                      <span className="text-slate-200 font-bold mt-1 block">
                        {users.find(u => u.id === currentTask.responsibleUserId)?.fullName || "N/A"}
                      </span>
                    </div>
                    <div className="bg-slate-900/40 p-2.5 rounded-lg border border-slate-850/80 col-span-2 md:col-span-1">
                      <span className="text-slate-500 font-medium block text-[9px] uppercase tracking-wider">Created Deadline</span>
                      <span className="text-slate-200 font-mono mt-1 block">
                        {new Date(currentTask.createdDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Scope description */}
                  <div className="mt-4 bg-slate-900/20 p-3.5 rounded-xl border border-slate-900">
                    <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block mb-1.5">Guidelines & Scope of Work:</span>
                    <p className="text-slate-300 leading-relaxed text-[11px] whitespace-pre-line">
                      {currentTask.description || "No specific design guidelines logged."}
                    </p>
                  </div>

                  {/* Attachment specification */}
                  {currentTask.attachmentName && (
                    <div className="mt-4 p-2.5 bg-slate-900 border border-slate-850 rounded-xl flex items-center justify-between gap-3">
                      <div className="min-w-0 flex items-center gap-2">
                        <span className="text-base">📎</span>
                        <div className="min-w-0">
                          <span className="text-slate-500 text-[9px] uppercase font-bold block">Specification Attachment</span>
                          <span className="text-slate-200 font-medium text-[10px] block truncate">
                            {currentTask.attachmentName}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          if (currentTask.attachmentData) {
                            const link = document.createElement("a");
                            link.href = currentTask.attachmentData;
                            link.download = currentTask.attachmentName || "spec_file";
                            link.click();
                          } else {
                            alert("Simulated attached binary file fetch successfully.");
                          }
                        }}
                        className="text-[10px] bg-slate-800 hover:bg-slate-750 text-slate-200 font-semibold px-2.5 py-1.5 rounded-lg border border-slate-700 transition-colors cursor-pointer shrink-0"
                      >
                        Download Binary Spec
                      </button>
                    </div>
                  )}
                </div>

                {/* INTERACTIVE CHECKLIST MODULE */}
                <div className="mt-6 pt-5 border-t border-slate-900 space-y-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5">
                        <CheckSquare className="h-4 w-4 text-amber-500" />
                        Subtask Execution Checklist
                      </span>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        Define custom subtask steps and tick them off to increase completion metrics.
                      </p>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={handleAiChecklistGeneration}
                        disabled={isGeneratingChecklist}
                        className="flex items-center gap-1.5 bg-indigo-950/40 text-indigo-400 hover:bg-indigo-900/40 disabled:opacity-50 disabled:cursor-wait font-bold px-2.5 py-1 rounded-lg border border-indigo-500/10 text-[10px] transition-all cursor-pointer"
                      >
                        <Sparkles className={`h-3 w-3 ${isGeneratingChecklist ? "animate-spin" : ""}`} />
                        {isGeneratingChecklist ? "Generating Steps..." : "⚡ Auto-Breakdown (AI)"}
                      </button>

                      {/* Progress Badge */}
                      <div className="flex items-center gap-2 font-mono text-[10px] text-slate-300 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-850">
                        <span>Subtasks done:</span>
                        <span className="font-bold text-amber-400">
                          {currentTask.todoList.filter(t => t.completed).length}/{currentTask.todoList.length}
                        </span>
                      </div>
                    </div>
                  </div>

                  {checklistFeedback && (
                    <div className={`p-2 rounded-xl text-[10px] font-semibold ${
                      checklistFeedback.startsWith("Error") ? "bg-rose-500/10 text-rose-400 border border-rose-500/20" : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    }`}>
                      {checklistFeedback}
                    </div>
                  )}

                  {/* Micro Progress Bar */}
                  {currentTask.todoList.length > 0 && (
                    <div className="space-y-1">
                      <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-850 p-0.5">
                        <div 
                          className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 rounded-full transition-all duration-500"
                          style={{ width: `${currentTask.percentage}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[9px] text-slate-500 font-mono">
                        <span>0%</span>
                        <span className="text-slate-300 font-bold">{currentTask.percentage}% Completed</span>
                        <span>100%</span>
                      </div>
                    </div>
                  )}

                  {/* Subtask Input Form */}
                  <form 
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleAddSubtask(currentTask.id);
                    }}
                    className="flex gap-2"
                  >
                    <input
                      type="text"
                      required
                      placeholder="Type a new subtask workflow action..."
                      value={newSubtaskText}
                      onChange={(e) => setNewSubtaskText(e.target.value)}
                      className="flex-1 bg-slate-900 border border-slate-850 text-slate-200 px-3 py-1.5 rounded-xl text-[11px] focus:outline-none focus:border-amber-500 placeholder-slate-600 transition-all"
                    />
                    <button
                      type="submit"
                      className="bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold px-3 py-1.5 rounded-xl flex items-center gap-1 transition-colors border border-slate-800 text-[11px] cursor-pointer"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add Item
                    </button>
                  </form>

                  {/* Preset Subtasks Templates */}
                  <div className="flex flex-wrap gap-1.5 items-center bg-slate-900/10 border border-slate-900/60 p-2 rounded-xl">
                    <span className="text-[9px] text-slate-500 font-bold uppercase mr-1">Quick Add Presets:</span>
                    {[
                      { label: "🧪 Cover Unit Tests", text: "Write & verify comprehensive unit tests for business logic" },
                      { label: "🎨 UI/UX Polish", text: "Polish visual aesthetics, layouts, margins, and transition states" },
                      { label: "📝 Developer Docs", text: "Document API endpoints and architecture configurations" },
                      { label: "🐛 Code Review", text: "Submit pull request and complete peer-to-peer reviews" }
                    ].map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleAddPresetSubtask(preset.text)}
                        className="px-2 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-[10px] font-medium text-slate-400 hover:text-slate-200 border border-slate-850/80 transition-all cursor-pointer"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>

                  {currentTask.todoList.length === 0 ? (
                    <div className="text-center py-8 text-slate-600 font-medium bg-slate-900/10 border border-slate-900 border-dashed rounded-xl text-[11px]">
                      No subtask steps listed yet. Register your first item above!
                    </div>
                  ) : (
                    <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
                      {currentTask.todoList.map(item => (
                        <div 
                          key={item.id} 
                          className={`p-2.5 rounded-xl border flex items-center justify-between transition-all ${
                            item.completed 
                              ? "bg-slate-900/20 border-slate-950 text-slate-500" 
                              : "bg-slate-900 hover:bg-slate-850 border-slate-850 text-slate-200"
                          }`}
                        >
                          <div 
                            onClick={() => handleToggleTodo(currentTask.id, item.id)}
                            className="flex items-center gap-2.5 flex-1 cursor-pointer select-none"
                          >
                            <button
                              type="button"
                              className="text-slate-500 hover:text-emerald-400 transition-colors shrink-0 cursor-pointer"
                            >
                              {item.completed ? (
                                <CheckSquare className="h-4 w-4 text-emerald-400 shrink-0" />
                              ) : (
                                <SquareIcon className="h-4 w-4 text-slate-600 shrink-0 hover:text-slate-400" />
                              )}
                            </button>
                            <span className={`transition-all duration-300 break-all text-[11px] ${item.completed ? "line-through text-slate-500 decoration-slate-600/70" : ""}`}>
                              {item.text}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleDeleteSubtask(currentTask.id, item.id)}
                            className="text-slate-600 hover:text-rose-400 p-1 rounded-lg hover:bg-slate-900 transition-colors shrink-0 cursor-pointer"
                            title="Delete step"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center py-16 text-slate-500 font-medium text-center">
                <AlertCircle className="h-10 w-10 text-slate-700 mb-3" />
                <h5 className="text-slate-300 font-semibold text-xs uppercase tracking-wider">No Active Workspace Selected</h5>
                <p className="text-slate-500 text-[11px] mt-1.5 max-w-xs leading-relaxed">
                  Choose one of your assigned workpieces from the left checklist block to load interactive checklists, description briefs, and active stopwatch loggers.
                </p>
              </div>
            )}
          </div>

          {/* HISTORIC TIMESHEET LOGS FOR ACTIVE EMPLOYEE */}
          <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 shadow-lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 border-b border-slate-900 pb-3">
              <div className="flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-indigo-400" />
                <h3 className="font-semibold text-slate-200 text-xs uppercase tracking-wider">
                  Chronological Timesheet Activity Log
                </h3>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {/* Filter Selector */}
                <div className="flex bg-slate-900 p-0.5 rounded-lg border border-slate-850">
                  <button
                    type="button"
                    onClick={() => setLogsFilter("Today")}
                    className={`px-2 py-0.5 rounded text-[9px] uppercase font-bold transition-all cursor-pointer ${
                      logsFilter === "Today" ? "bg-indigo-600 text-slate-100" : "text-slate-500 hover:text-slate-300"
                    }`}
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    onClick={() => setLogsFilter("All")}
                    className={`px-2 py-0.5 rounded text-[9px] uppercase font-bold transition-all cursor-pointer ${
                      logsFilter === "All" ? "bg-indigo-600 text-slate-100" : "text-slate-500 hover:text-slate-300"
                    }`}
                  >
                    All-Time
                  </button>
                </div>

                {/* Export Excel Button */}
                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="px-2 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-[10px] font-bold text-emerald-400 hover:text-emerald-300 border border-slate-800 transition-colors cursor-pointer flex items-center gap-1 shrink-0"
                  title="Export timesheet logs directly to Excel"
                >
                  <Download className="h-3 w-3" />
                  <span>Excel Export</span>
                </button>
              </div>
            </div>

            <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
              {(() => {
                const filteredLogs = myLogs.filter(log => {
                  if (logsFilter === "Today") {
                    const logDate = new Date(log.startTime).toDateString();
                    return logDate === todayStr;
                  }
                  return true;
                });

                if (filteredLogs.length === 0) {
                  return (
                    <div className="text-center py-10 text-slate-600 font-medium text-[11px]">
                      No work sessions recorded under {logsFilter === "Today" ? "today's logs" : "all-time"}. Start the stopwatch to generate entry sheets.
                    </div>
                  );
                }

                return filteredLogs.map(log => {
                  const taskRef = tasks.find(t => t.id === log.taskId);
                  const actualHrs = log.durationMinutes ? (log.durationMinutes / 60).toFixed(1) : (log.isAutoStopped ? "6.0" : "Running");
                  
                  return (
                    <div key={log.id} className="p-3 rounded-xl bg-slate-900/40 border border-slate-900 hover:border-slate-800 transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 text-[11px]">
                      <div className="space-y-1">
                        <div className="font-semibold text-slate-200">{taskRef?.name || "Corporate Workpiece"}</div>
                        <div className="text-[10px] text-slate-500 flex flex-wrap items-center gap-x-2 gap-y-0.5 font-mono">
                          <span>Started: {new Date(log.startTime).toLocaleTimeString()}</span>
                          {log.endTime && (
                            <>
                              <span>•</span>
                              <span>Ended: {new Date(log.endTime).toLocaleTimeString()}</span>
                            </>
                          )}
                          {log.isAutoStopped && (
                            <span className="text-amber-400 bg-amber-500/10 px-1.5 py-0.2 rounded font-semibold text-[8px] uppercase tracking-wider border border-amber-500/20">
                              ⚠ Capped at 6-Hrs (Forgot stop)
                            </span>
                          )}
                        </div>
                        {log.notes && (
                          <div className="mt-1 bg-slate-900/60 p-2 border border-slate-850 rounded-lg text-[10px] text-slate-400 italic font-medium leading-relaxed">
                            {log.notes}
                          </div>
                        )}
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-xs font-mono font-bold text-indigo-400 block">{actualHrs} hrs</span>
                        {log.percentageOnStop !== null && (
                          <span className="text-[9px] bg-slate-900 text-slate-400 border border-slate-850 px-1.5 py-0.5 rounded block mt-1 w-max ml-auto">
                            Logged progress: {log.percentageOnStop}%
                          </span>
                        )}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>

          {/* COMPLETE TIME SCHEDULE REPORT BY DATE PERIOD */}
          <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 shadow-lg space-y-5">
            <div 
              onClick={() => setIsReportingCollapsed(!isReportingCollapsed)}
              className="flex items-center justify-between border-b border-slate-900 pb-3 cursor-pointer select-none"
            >
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-emerald-400" />
                <div>
                  <h3 className="font-semibold text-slate-200 text-xs uppercase tracking-wider">
                    Date-Period Complete Time Schedule Report
                  </h3>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Generate comprehensive scheduled time logs and timesheets for payroll auditing.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-slate-500 hover:text-slate-300">
                {isReportingCollapsed ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronUp className="h-4 w-4" />
                )}
              </div>
            </div>

            <AnimatePresence initial={false}>
              {!isReportingCollapsed && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="space-y-5 overflow-hidden"
                >
                  {/* Selector Controls */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-slate-900/40 p-4 rounded-xl border border-slate-900">
                    {/* Person Selector */}
                    <div className="space-y-1.5 text-left">
                      <label className="text-slate-500 font-bold text-[9px] uppercase tracking-wider block">Audited Person</label>
                      <select
                        value={reportUserId}
                        onChange={(e) => setReportUserId(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-850 text-slate-200 px-3 py-1.5 rounded-lg text-[11px] focus:outline-none focus:border-emerald-500"
                      >
                        {users.map(u => (
                          <option key={u.id} value={u.id}>
                            👤 {u.fullName} {u.id === activeUser.id ? "(You)" : ""}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Start Date */}
                    <div className="space-y-1.5 text-left">
                      <label className="text-slate-500 font-bold text-[9px] uppercase tracking-wider block">Start Date</label>
                      <input
                        type="date"
                        value={reportStartDate}
                        onChange={(e) => setReportStartDate(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-850 text-slate-200 px-3 py-1.5 rounded-lg text-[11px] focus:outline-none focus:border-emerald-500 font-mono"
                      />
                    </div>

                    {/* End Date */}
                    <div className="space-y-1.5 text-left">
                      <label className="text-slate-500 font-bold text-[9px] uppercase tracking-wider block">End Date</label>
                      <input
                        type="date"
                        value={reportEndDate}
                        onChange={(e) => setReportEndDate(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-850 text-slate-200 px-3 py-1.5 rounded-lg text-[11px] focus:outline-none focus:border-emerald-500 font-mono"
                      />
                    </div>

                    {/* Filter Keyword */}
                    <div className="space-y-1.5 text-left">
                      <label className="text-slate-500 font-bold text-[9px] uppercase tracking-wider block">Search Report Logs</label>
                      <div className="relative">
                        <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-600" />
                        <input
                          type="text"
                          placeholder="Search task, project, notes..."
                          value={reportSearchQuery}
                          onChange={(e) => setReportSearchQuery(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-850 text-slate-200 pl-8 pr-3 py-1.5 rounded-lg text-[11px] focus:outline-none focus:border-emerald-500 placeholder-slate-700"
                        />
                      </div>
                    </div>
                  </div>

                  {/* KPIs Summary Row */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-900 text-left">
                      <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Total Tracked Duration</span>
                      <span className="text-lg font-mono font-bold text-emerald-400 block mt-1">{totalReportHours} hrs</span>
                      <span className="text-[8px] text-slate-500 mt-0.5 block">For the selected date range</span>
                    </div>

                    <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-900 text-left">
                      <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Active Shift Days</span>
                      <span className="text-lg font-mono font-bold text-indigo-400 block mt-1">{activeDaysCount} days</span>
                      <span className="text-[8px] text-slate-500 mt-0.5 block">Unique days with timesheets</span>
                    </div>

                    <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-900 text-left">
                      <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Avg Workday Load</span>
                      <span className="text-lg font-mono font-bold text-amber-400 block mt-1">{avgDailyHours} hrs/day</span>
                      <span className="text-[8px] text-slate-500 mt-0.5 block">Average hours per active day</span>
                    </div>

                    <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-900 text-left">
                      <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Completed Tasks</span>
                      <span className="text-lg font-mono font-bold text-sky-400 block mt-1">{completedTasksInPeriod} tasks</span>
                      <span className="text-[8px] text-slate-500 mt-0.5 block">Marked completed in range</span>
                    </div>
                  </div>

                  {/* Project Distribution breakdown list */}
                  {projectBreakdownList.length > 0 && (
                    <div className="bg-slate-900/30 p-4 rounded-xl border border-slate-900 space-y-3 text-left">
                      <h4 className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                        📂 Time Distribution by Client Project
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2.5">
                        {projectBreakdownList.map((p, idx) => (
                          <div key={idx} className="space-y-1 text-xs">
                            <div className="flex justify-between items-center text-[11px]">
                              <span className="font-semibold text-slate-300 truncate max-w-[70%]">{p.name}</span>
                              <span className="font-mono text-slate-400 text-[10px]">
                                <strong>{p.hours} hrs</strong> ({p.percentage}%)
                              </span>
                            </div>
                            <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-slate-900">
                              <div 
                                className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                                style={{ width: `${p.percentage}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Report Actions Row */}
                  <div className="flex flex-wrap justify-between items-center gap-3 bg-slate-900/20 p-3.5 rounded-xl border border-slate-900">
                    <span className="text-[10px] text-slate-500 font-mono">
                      Compiled <strong>{reportFilteredLogs.length}</strong> matching entries for {selectedReportUser.fullName}
                    </span>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleCopyReportText}
                        className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                          copiedReportText 
                            ? "bg-emerald-500 text-slate-950 font-bold" 
                            : "bg-slate-900 hover:bg-slate-800 text-indigo-400 border border-slate-800"
                        }`}
                      >
                        {copiedReportText ? (
                          <>
                            <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                            <span>Copied Summary!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5 text-indigo-400" />
                            <span>Copy Plain-Text Report</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleExportCustomRangeCSV(reportFilteredLogs, selectedReportUser)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black transition-colors cursor-pointer flex items-center gap-1.5"
                        title="Download customized date range Excel report"
                      >
                        <Download className="h-3.5 w-3.5 text-slate-950 font-black" />
                        <span>Export Excel Report</span>
                      </button>
                    </div>
                  </div>

                  {/* Detailed Log Sheet Table */}
                  <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                    {reportFilteredLogs.length === 0 ? (
                      <div className="text-center py-12 text-slate-600 font-medium bg-slate-900/10 border border-slate-900 border-dashed rounded-xl text-[11px]">
                        No schedule entries found matching those criteria during this date range.
                      </div>
                    ) : (
                      reportFilteredLogs.map((log) => {
                        const taskRef = tasks.find(t => t.id === log.taskId);
                        const proj = taskRef ? projects.find(p => p.id === taskRef.projectId) : null;
                        const durationHrs = log.durationMinutes ? (log.durationMinutes / 60).toFixed(1) : "Running";
                        const dateFormatted = new Date(log.startTime).toLocaleDateString(undefined, {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        });

                        return (
                          <div 
                            key={log.id} 
                            className="p-3 bg-slate-900/40 hover:bg-slate-900/70 border border-slate-900 hover:border-slate-800 rounded-xl transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-left"
                          >
                            <div className="space-y-1.5 flex-1 min-w-0">
                              {/* Top row of the row entry */}
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="bg-slate-900 px-2 py-0.5 rounded text-[10px] font-bold text-slate-400 border border-slate-850 font-mono">
                                  📅 {dateFormatted}
                                </span>
                                <span className="text-[10px] text-indigo-400 font-mono font-semibold">
                                  📁 {proj?.name || "Unassigned"}
                                </span>
                              </div>

                              <div className="font-semibold text-slate-200 text-xs">
                                {taskRef?.name || "Corporate Workpiece"}
                              </div>

                              <div className="text-[10px] text-slate-500 flex flex-wrap items-center gap-x-2 font-mono">
                                <span>Started: {new Date(log.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                <span>•</span>
                                <span>Ended: {log.endTime ? new Date(log.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Ongoing"}</span>
                                {log.isAutoStopped && (
                                  <span className="text-amber-500 bg-amber-500/10 px-1 py-0.2 rounded font-bold text-[8px] uppercase tracking-wider">
                                    Capped 6h
                                  </span>
                                )}
                              </div>

                              {log.notes && (
                                <p className="text-slate-400 text-[10px] italic bg-slate-950/40 p-2 rounded-lg border border-slate-900/60 leading-relaxed mt-1">
                                  "{log.notes}"
                                </p>
                              )}
                            </div>

                            <div className="text-right shrink-0">
                              <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono font-bold text-xs block">
                                {durationHrs} hrs
                              </span>
                              {log.percentageOnStop !== null && (
                                <span className="text-[9px] text-slate-500 block mt-1">
                                  Reported progress: {log.percentageOnStop}%
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>
      </div>

      {/* STOP TASK / LOG WORK MODAL */}
      <AnimatePresence>
        {isStopModalOpen && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden"
            >
              <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
                <h3 className="font-semibold text-slate-200 text-sm flex items-center gap-1.5">
                  <Square className="h-4 w-4 text-rose-400 shrink-0 fill-rose-400/20" />
                  Log Daily Task Progress
                </h3>
                <button onClick={() => setIsStopModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-100">
                  ✕
                </button>
              </div>

              <form onSubmit={handleStopTaskSubmit} className="p-6 space-y-5 text-xs">
                {/* Active Task Reference */}
                {(() => {
                  const activeTask = tasks.find(t => t.id === activeLog?.taskId);
                  if (!activeTask) return null;
                  const completedCount = activeTask.todoList.filter(t => t.completed).length;
                  return (
                    <div className="bg-slate-950/40 border border-slate-850 p-3 rounded-xl space-y-1.5">
                      <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider block">Session Workspace Target</span>
                      <h4 className="font-bold text-slate-200 text-xs">{activeTask.name}</h4>
                      {activeTask.todoList.length > 0 && (
                        <div className="mt-2 space-y-1">
                          <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                            <span>Subtask Checklist Progress</span>
                            <span className="text-slate-300 font-semibold">{completedCount}/{activeTask.todoList.length} Done</span>
                          </div>
                          <div className="max-h-[90px] overflow-y-auto space-y-1 pt-1 pr-1 border-t border-slate-900">
                            {activeTask.todoList.map(item => (
                              <div key={item.id} className="flex items-center gap-1.5 text-[10px]">
                                {item.completed ? (
                                  <CheckSquare className="h-3 w-3 text-emerald-400 shrink-0" />
                                ) : (
                                  <SquareIcon className="h-3 w-3 text-slate-700 shrink-0" />
                                )}
                                <span className={item.completed ? "line-through text-slate-500" : "text-slate-400"}>
                                  {item.text}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}

                <div className="space-y-1.5">
                  <label className="block text-slate-400 font-medium">Update Progress Completion %</label>
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 space-y-2">
                    <div className="flex justify-between font-mono font-bold text-slate-200">
                      <span>Percentage Finished</span>
                      <span className={stopForm.pct >= 100 ? "text-emerald-400 font-bold" : "text-amber-500"}>
                        {stopForm.pct}% {stopForm.pct >= 100 ? "(COMPLETED!)" : ""}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={stopForm.pct}
                      onChange={e => setStopForm(prev => ({ ...prev, pct: Number(e.target.value) }))}
                      className="w-full accent-amber-500"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="block text-slate-400 font-medium">Work Notes (What did you achieve?)</label>
                    <button
                      type="button"
                      disabled={isRefiningNotes || !stopForm.notes.trim()}
                      onClick={handleRefineNotes}
                      className="text-amber-400 hover:text-amber-300 disabled:opacity-40 disabled:hover:text-amber-400 font-semibold flex items-center gap-1 transition-colors"
                    >
                      {isRefiningNotes ? (
                        <>
                          <RefreshCw className="h-3 w-3 animate-spin" />
                          Refining...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-3 w-3 animate-pulse" />
                          Refine with AI
                        </>
                      )}
                    </button>
                  </div>

                  {/* Quick Notes Templates Pill Row */}
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-500 font-medium block">Or insert a quick work template:</span>
                    <div className="flex flex-wrap gap-1">
                      {[
                        { label: "🚀 Milestones", text: "Successfully completed core milestone deliverables and resolved cross-functional integration requirements." },
                        { label: "🐛 Bug Fixes", text: "Investigated and fixed core business logic defects, resolved runtime exceptions and completed unit regression tests." },
                        { label: "🧪 Added Tests", text: "Developed complete automated test coverages, ensured critical path security compliance, and executed testing suits." },
                        { label: "📝 Docs & Refactor", text: "Completed architectural refactoring of the codebase to optimize processing speed and compiled thorough developer documentation." },
                        { label: "📞 Feedback", text: "Integrated user review comments, polished interactive dashboard visual interfaces, and updated functional workflows." }
                      ].map(pill => (
                        <button
                          key={pill.label}
                          type="button"
                          onClick={() => {
                            setStopForm(prev => {
                              const base = prev.notes.trim();
                              return {
                                ...prev,
                                notes: base ? `${base} ${pill.text}` : pill.text
                              };
                            });
                          }}
                          className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition-colors text-[9px] font-medium"
                        >
                          {pill.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <textarea
                    rows={3}
                    required
                    placeholder="Log deliverables built, commits pushed, or features completed in this block..."
                    value={stopForm.notes}
                    onChange={e => setStopForm(prev => ({ ...prev, notes: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 px-3 py-2 rounded-xl focus:outline-none focus:border-amber-500 resize-none text-[11px]"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsStopModalOpen(false)}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold px-4 py-2 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-5 py-2 rounded-xl"
                  >
                    Submit Work Logs
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

        {/* DAILY STANDUP MODAL */}
        <AnimatePresence>
          {isStandupModalOpen && (
            <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 text-xs">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden"
              >
                <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
                  <h3 className="font-semibold text-slate-200 text-sm flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4 text-indigo-400 shrink-0 animate-pulse" />
                    Your Daily Standup Bulletin
                  </h3>
                  <button onClick={() => setIsStandupModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-100">
                    ✕
                  </button>
                </div>

                <div className="p-6 space-y-4 text-xs">
                  <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-4 min-h-[220px] max-h-[350px] overflow-y-auto text-slate-300 text-xs font-sans leading-relaxed">
                    {isGeneratingStandup ? (
                      <div className="flex flex-col items-center justify-center py-12 gap-3 text-slate-500">
                        <RefreshCw className="h-6 w-6 text-indigo-400 animate-spin" />
                        <span className="font-medium animate-pulse">Gemini is gathering metrics & crafting standup...</span>
                      </div>
                    ) : (
                      <div className="whitespace-pre-wrap select-all font-sans">
                        {standupText}
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => setIsStandupModalOpen(false)}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold px-4 py-2 rounded-xl text-xs"
                    >
                      Close
                    </button>
                    {!isGeneratingStandup && (
                      <button
                        type="button"
                        onClick={() => handleCopyToClipboard(standupText)}
                        className={`font-bold px-5 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                          copiedStandup 
                            ? "bg-emerald-500 text-slate-950 hover:bg-emerald-400 font-bold shadow-lg shadow-emerald-500/10 scale-102" 
                            : "bg-indigo-600 hover:bg-indigo-500 text-slate-100"
                        }`}
                      >
                        {copiedStandup ? (
                          <>
                            <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                            Copied Bulletin!
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5" />
                            Copy Bulletin
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* FLOATING ACTIVE STOPWATCH WIDGET (PREMIUM PERSISTENT UX DETAIL) */}
        <AnimatePresence>
          {activeLog && (
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.9 }}
              className="fixed bottom-6 right-6 z-40 bg-slate-900/95 backdrop-blur-md border border-emerald-500/30 text-slate-100 p-4 rounded-2xl shadow-2xl flex items-center gap-4.5 max-w-sm"
            >
              <div className="relative shrink-0">
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping" />
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full" />
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-emerald-400" />
                </div>
              </div>
              
              <div className="flex-1 min-w-0 text-left">
                <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest block">Active session tracking</span>
                <span className="text-xs font-bold text-slate-100 truncate block mt-0.5">
                  {tasks.find(t => t.id === activeLog.taskId)?.name || "Corporate Workpiece"}
                </span>
                <span className="text-sm font-mono font-bold text-emerald-400 mt-0.5 block">{tickerTime}</span>
              </div>

              <button
                type="button"
                onClick={handleStopTrigger}
                className="bg-rose-500 hover:bg-rose-400 text-slate-950 font-bold px-3.5 py-2 rounded-xl text-[10px] uppercase tracking-wider flex items-center gap-1 transition-colors cursor-pointer shrink-0 shadow-md shadow-rose-500/10"
              >
                <Square className="h-3 w-3 fill-slate-950" />
                Stop
              </button>
            </motion.div>
          )}
        </AnimatePresence>
    </div>
  );
}
