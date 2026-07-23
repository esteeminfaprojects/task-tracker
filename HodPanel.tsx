import React, { useState } from "react";
import { 
  Role, 
  Department, 
  Project, 
  User, 
  Task, 
  TimeLog,
  TodoItem
} from "./types";
import { 
  ShieldCheck, 
  Lock, 
  Unlock, 
  Plus, 
  Clock, 
  CheckCircle, 
  Users, 
  Filter, 
  FileText, 
  TrendingUp, 
  Building2,
  Calendar,
  AlertCircle,
  X,
  Edit,
  Sparkles,
  RefreshCw,
  Download
} from "lucide-react";
import { motion } from "motion/react";

interface HodPanelProps {
  activeUser: User;
  roles: Role[];
  departments: Department[];
  projects: Project[];
  users: User[];
  tasks: Task[];
  timeLogs: TimeLog[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
}

export default function HodPanel({
  activeUser,
  roles,
  departments,
  projects,
  users,
  tasks,
  timeLogs,
  setTasks
}: HodPanelProps) {
  // Resolve HOD's department
  const hodDept = departments.find(d => d.id === activeUser.departmentId);
  const hodRole = roles.find(r => r.id === activeUser.roleId);

  // Filter users inside this HOD's department
  const deptUsers = users.filter(u => u.departmentId === activeUser.departmentId);
  const deptUserIds = deptUsers.map(u => u.id);

  // Filter tasks assigned to department employees OR supervised by HOD
  const deptTasks = tasks.filter(t => 
    deptUserIds.includes(t.assignedUserId) || t.responsibleUserId === activeUser.id
  );

  // Local Scheduling Modal (only for department)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [taskForm, setTaskForm] = useState({
    name: "",
    projectId: "",
    parentTaskId: "",
    estimatedHours: 8,
    assignedUserId: "",
    description: ""
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [todoInput, setTodoInput] = useState("");
  const [todoList, setTodoList] = useState<TodoItem[]>([]);
  const [error, setError] = useState("");

  // AI UX States
  const [isDrafting, setIsDrafting] = useState(false);
  const [isEstimating, setIsEstimating] = useState(false);
  const [aiRationale, setAiRationale] = useState("");

  const handleAiDraftTask = async () => {
    if (!taskForm.name.trim()) {
      setError("Please fill out the Task Name first so the AI knows what to draft.");
      return;
    }
    setError("");
    setIsDrafting(true);
    try {
      const projName = getProjectName(taskForm.projectId) || "General Workpiece";
      const res = await fetch("/api/gemini/draft-task", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskName: taskForm.name,
          projectName: projName,
          estimatedHours: taskForm.estimatedHours
        })
      });
      if (!res.ok) {
        throw new Error("Failed to connect to drafting service.");
      }
      const data = await res.json();
      if (data.description) {
        setTaskForm(prev => ({ ...prev, description: data.description }));
      }
      if (data.subtasks && Array.isArray(data.subtasks)) {
        const mappedTodos = data.subtasks.map((st: string, idx: number) => ({
          id: `todo-${Date.now()}-${idx}`,
          text: st,
          completed: false
        }));
        setTodoList(mappedTodos);
      }
    } catch (err: any) {
      console.error(err);
      setError("AI Drafting temporarily unavailable. Please verify your Gemini API key.");
    } finally {
      setIsDrafting(false);
    }
  };

  const handleAiEstimateHours = async () => {
    if (!taskForm.name.trim()) {
      setError("Please fill out the Task Name first so the AI has context.");
      return;
    }
    setError("");
    setIsEstimating(true);
    setAiRationale("");
    try {
      const projName = getProjectName(taskForm.projectId) || "General Workpiece";
      const res = await fetch("/api/gemini/estimate-hours", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskName: taskForm.name,
          taskDescription: taskForm.description,
          projectName: projName
        })
      });
      if (!res.ok) {
        throw new Error("Failed to connect to estimation service.");
      }
      const data = await res.json();
      if (data.suggestedHours) {
        setTaskForm(prev => ({ ...prev, estimatedHours: Number(data.suggestedHours) }));
      }
      if (data.rationale) {
        setAiRationale(data.rationale);
      }
    } catch (err: any) {
      console.error(err);
      setError("AI Pacing prediction temporarily unavailable. Please verify your Gemini API key.");
    } finally {
      setIsEstimating(false);
    }
  };

  const handleAddTodo = () => {
    if (!todoInput.trim()) return;
    setTodoList(prev => [...prev, {
      id: `todo-${Date.now()}`,
      text: todoInput.trim(),
      completed: false
    }]);
    setTodoInput("");
  };

  const handleSaveTask = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!taskForm.name.trim() || !taskForm.projectId || !taskForm.assignedUserId) {
      setError("Please fill out required fields: Task Name, Project, and Assignee.");
      return;
    }

    if (editingId) {
      setTasks(prev => prev.map(t => t.id === editingId ? {
        ...t,
        name: taskForm.name.trim(),
        projectId: taskForm.projectId,
        parentTaskId: taskForm.parentTaskId ? taskForm.parentTaskId : null,
        estimatedHours: Number(taskForm.estimatedHours) || 1,
        todoList: todoList,
        assignedUserId: taskForm.assignedUserId,
        description: taskForm.description,
      } : t));
      setEditingId(null);
    } else {
      const newTask: Task = {
        id: `task-${Date.now()}`,
        name: taskForm.name.trim(),
        projectId: taskForm.projectId,
        parentTaskId: taskForm.parentTaskId ? taskForm.parentTaskId : null,
        estimatedHours: Number(taskForm.estimatedHours) || 1,
        todoList: todoList,
        assignedUserId: taskForm.assignedUserId,
        responsibleUserId: activeUser.id, // HOD is the supervisor
        description: taskForm.description,
        attachmentName: null,
        status: "Pending",
        percentage: 0,
        createdDate: new Date().toISOString(),
        completedDate: null
      };

      setTasks(prev => [newTask, ...prev]);
    }

    setIsModalOpen(false);
    setTodoList([]);
    setAiRationale("");
    setTaskForm({
      name: "",
      projectId: "",
      parentTaskId: "",
      estimatedHours: 8,
      assignedUserId: "",
      description: ""
    });
  };

  const handleEditTask = (task: Task) => {
    setEditingId(task.id);
    setAiRationale("");
    setTaskForm({
      name: task.name,
      projectId: task.projectId,
      parentTaskId: task.parentTaskId || "",
      estimatedHours: task.estimatedHours,
      assignedUserId: task.assignedUserId,
      description: task.description || ""
    });
    setTodoList([...task.todoList]);
    setIsModalOpen(true);
  };

  // Helper values
  const getProjectName = (pid: string) => projects.find(p => p.id === pid)?.name || "N/A";
  const getEmployeeName = (uid: string) => users.find(u => u.id === uid)?.fullName || "N/A";

  const handleExportDeptTasksToExcel = () => {
    if (deptTasks.length === 0) {
      alert("No department tasks allocated to export.");
      return;
    }
    let csv = "Task ID,Task Name,Project Name,Assigned Employee,Estimated Hours,Status,Progress Percentage,Description,Checklist Steps\n";
    deptTasks.forEach(task => {
      const projName = getProjectName(task.projectId);
      const empName = getEmployeeName(task.assignedUserId);
      const totalChecklist = task.todoList.map(item => `${item.text} [${item.completed ? 'Completed' : 'Pending'}]`).join("; ");
      
      csv += `"${task.id}","${task.name.replace(/"/g, '""')}","${projName.replace(/"/g, '""')}","${empName.replace(/"/g, '""')}","${task.estimatedHours}","${task.status}","${task.percentage}%","${(task.description || "").replace(/"/g, '""')}","${totalChecklist.replace(/"/g, '""')}"\n`;
    });
    
    // Add UTF-8 BOM for Microsoft Excel compatibility
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `dept_tasks_${(hodDept?.name || "department").replace(/\s+/g, "_")}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Calculate department workload
  const totalTasks = deptTasks.length;
  const completedTasks = deptTasks.filter(t => t.status === "Completed").length;
  const inProgressTasks = deptTasks.filter(t => t.status === "In Progress").length;
  const pendingTasks = deptTasks.filter(t => t.status === "Pending").length;

  const totalEstHrs = deptTasks.reduce((acc, t) => acc + t.estimatedHours, 0);

  // Time logging calculations for department
  let totalActMinutes = 0;
  let deptMissedStops = 0;
  timeLogs.forEach(log => {
    if (deptUserIds.includes(log.userId)) {
      if (log.durationMinutes) {
        totalActMinutes += log.durationMinutes;
      } else if (log.isAutoStopped) {
        totalActMinutes += 360; // 6 hours
        deptMissedStops += 1;
      }
    }
  });
  const totalActHrs = Number((totalActMinutes / 60).toFixed(1));

  return (
    <div className="space-y-6">
      {/* Banner Card */}
      <div className="bg-gradient-to-r from-slate-950 to-indigo-950 p-6 rounded-2xl border border-indigo-900/40 shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 opacity-10 pointer-events-none translate-x-12 -translate-y-12">
          <Building2 className="h-64 w-64 text-indigo-400" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <span className="bg-indigo-500/20 text-indigo-300 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider border border-indigo-500/30">
              Department Operations Center
            </span>
            <h2 className="text-xl font-bold text-slate-100 mt-2 flex items-center gap-2">
              <Building2 className="h-5 w-5 text-indigo-400" />
              {hodDept?.name || "Corporate Unit"} Operations Portal
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-xl leading-relaxed">
              Managing team logs, monitoring active timers, and scheduling sprint resources for <strong className="text-slate-200">{deptUsers.length} employee(s)</strong> within your division.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-slate-900/80 border border-slate-800 p-3 rounded-xl">
            <ShieldCheck className="h-5 w-5 text-emerald-400 shrink-0" />
            <div className="text-left text-xs">
              <div className="font-semibold text-slate-200">{hodRole?.name}</div>
              <div className="text-[10px] text-slate-500 font-mono">ID: {activeUser.employeeId}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-xs">
        {/* HOD STATS SUMMARY */}
        <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 flex flex-col justify-between">
          <h3 className="font-semibold text-slate-200 text-xs uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-1.5">
            <TrendingUp className="h-4 w-4 text-indigo-400" />
            Division Metrics Radar
          </h3>

          <div className="grid grid-cols-2 gap-4 flex-1 items-center">
            <div className="bg-slate-900/50 p-3.5 rounded-xl border border-slate-800/80 text-center">
              <span className="text-slate-500 block font-medium">Department Tasks</span>
              <span className="text-2xl font-bold text-slate-100 mt-1 block">{totalTasks}</span>
            </div>
            <div className="bg-slate-900/50 p-3.5 rounded-xl border border-slate-800/80 text-center">
              <span className="text-slate-500 block font-medium">Completion Rate</span>
              <span className="text-2xl font-bold text-emerald-400 mt-1 block">
                {totalTasks > 0 ? `${Math.round((completedTasks / totalTasks) * 100)}%` : "0%"}
              </span>
            </div>
            <div className="bg-slate-900/50 p-3.5 rounded-xl border border-slate-800/80 text-center">
              <span className="text-slate-500 block font-medium">Est. Budget Hours</span>
              <span className="text-2xl font-bold text-amber-500 mt-1 block font-mono">{totalEstHrs}h</span>
            </div>
            <div className="bg-slate-900/50 p-3.5 rounded-xl border border-slate-800/80 text-center">
              <span className="text-slate-500 block font-medium">Actual Worked Hrs</span>
              <span className="text-2xl font-bold text-indigo-400 mt-1 block font-mono">{totalActHrs}h</span>
            </div>
          </div>

          {deptMissedStops > 0 && (
            <div className="mt-4 bg-amber-500/10 border border-amber-500/20 text-amber-400 p-3 rounded-lg flex items-center gap-2.5">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <div>
                <span className="font-semibold block">Auto-Stops Detected ({deptMissedStops})</span>
                <span className="text-[10px] text-slate-400">Team members missed stopping tasks. System auto-logged 6 hours.</span>
              </div>
            </div>
          )}
        </div>

        {/* COMPREHENSIVE SECURITY & PERMISSIONS BLUEPRINT */}
        <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 flex flex-col justify-between">
          <div>
            <h3 className="font-semibold text-slate-200 text-xs uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              Role Authorization Blueprint
            </h3>
            <p className="text-slate-500 text-[11px] mb-4">
              Below is the structural security permission profile assigned to your Corporate Profile by System Administrators.
            </p>
          </div>

          <div className="space-y-2 flex-1 pt-1 justify-center flex flex-col">
            {hodRole && Object.entries(hodRole.permissions).map(([key, val]) => (
              <div 
                key={key} 
                className={`flex items-center justify-between p-2 rounded-lg border text-[11px] ${
                  val 
                    ? "bg-emerald-500/5 border-emerald-500/10 text-slate-200" 
                    : "bg-slate-900/40 border-slate-900/60 text-slate-500"
                }`}
              >
                <span className="capitalize font-medium flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full ${val ? "bg-emerald-400" : "bg-slate-700"}`}></span>
                  {key.replace(/([A-Z])/g, " $1")}
                </span>
                <span className="font-mono font-bold flex items-center gap-1">
                  {val ? (
                    <>
                      <Unlock className="h-3 w-3 text-emerald-400" />
                      <span className="text-[10px] text-emerald-400">UNLOCKED</span>
                    </>
                  ) : (
                    <>
                      <Lock className="h-3 w-3 text-slate-600" />
                      <span className="text-[10px] text-slate-500">LOCKED</span>
                    </>
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* TEAM EMPLOYEES INDEX */}
        <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 flex flex-col justify-between">
          <div>
            <h3 className="font-semibold text-slate-200 text-xs uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
              <Users className="h-4 w-4 text-indigo-400" />
              Active Division Team
            </h3>
            <p className="text-slate-500 text-[11px] mb-4">
              Directory of employees belonging to <strong className="text-slate-300">{hodDept?.name}</strong>.
            </p>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto max-h-[160px] pr-1">
            {deptUsers.map(emp => (
              <div key={emp.id} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900/50 border border-slate-800/80">
                <div>
                  <div className="font-semibold text-slate-200">{emp.fullName}</div>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">{emp.email}</div>
                </div>
                <span className="font-mono text-[9px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded">
                  {emp.employeeId}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* DEPARTMENT SCHEDULING HEADER */}
      <div className="bg-slate-950 px-6 py-4 rounded-xl border border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="font-semibold text-slate-200 text-sm">Sprint Task Scheduler for {hodDept?.name}</h3>
          <p className="text-xs text-slate-500 mt-1">Assign deliverables specifically to your unit team members with supervisor oversight.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleExportDeptTasksToExcel}
            className="bg-emerald-600 hover:bg-emerald-500 text-slate-950 px-4 py-2 rounded-xl font-black text-xs flex items-center gap-1.5 transition-colors"
            title="Export department tasks directly to Excel"
          >
            <Download className="h-4 w-4 text-slate-950 font-black" />
            Export to Excel
          </button>
          {hodRole?.permissions.tasks ? (
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-indigo-500 hover:bg-indigo-400 text-slate-100 px-4 py-2 rounded-xl font-medium text-xs flex items-center gap-1.5 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Schedule Dept Task
            </button>
          ) : (
            <div className="text-xs text-rose-400 bg-rose-500/5 border border-rose-500/10 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5" /> Tasks Master Locked
            </div>
          )}
        </div>
      </div>

      {/* TEAM TASK TABLE */}
      <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/40">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-950/80 text-slate-400 font-medium uppercase tracking-wider">
              <th className="px-4 py-3">Task Name</th>
              <th className="px-4 py-3">Project</th>
              <th className="px-4 py-3">Assigned Team Member</th>
              <th className="px-4 py-3 text-center">Estimated</th>
              <th className="px-4 py-3">Workflow Status</th>
              <th className="px-4 py-3">Progress</th>
              {hodRole?.permissions.tasks && <th className="px-4 py-3 text-center">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-slate-300">
            {deptTasks.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-slate-500 font-medium">
                  No active tasks allocated in this department.
                </td>
              </tr>
            ) : (
              deptTasks.map(task => (
                <tr key={task.id} className="hover:bg-slate-800/20 transition-colors">
                  <td className="px-4 py-3.5 font-semibold text-slate-200">
                    <div>
                      {task.name}
                      {task.parentTaskId && (
                        <span className="block text-[9px] text-amber-500 italic mt-0.5">
                          Subtask of: {tasks.find(t => t.id === task.parentTaskId)?.name}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-slate-400">{getProjectName(task.projectId)}</td>
                  <td className="px-4 py-3.5 font-medium text-slate-300">{getEmployeeName(task.assignedUserId)}</td>
                  <td className="px-4 py-3.5 text-center font-mono text-slate-400">{task.estimatedHours} hrs</td>
                  <td className="px-4 py-3.5">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                      task.status === "Completed" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                      task.status === "In Progress" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                      "bg-slate-800 text-slate-400"
                    }`}>
                      {task.status}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2 max-w-[150px]">
                      <div className="flex-1 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${task.percentage}%` }}></div>
                      </div>
                      <span className="font-mono text-slate-400">{task.percentage}%</span>
                    </div>
                  </td>
                  {hodRole?.permissions.tasks && (
                    <td className="px-4 py-3.5 text-center">
                      <button
                        onClick={() => handleEditTask(task)}
                        className="p-1.5 text-slate-400 hover:text-amber-500 hover:bg-amber-500/10 rounded-lg transition-all"
                        title="Edit task"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* DEPARTMENTAL SCHEDULER DIALOG */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full shadow-2xl flex flex-col overflow-hidden text-xs text-left">
            <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <h3 className="font-semibold text-slate-200 text-sm flex items-center gap-1.5">
                <Plus className="h-4 w-4 text-indigo-400" />
                {editingId ? `Modify Department Task (${hodDept?.name})` : `Schedule Department Task (${hodDept?.name})`}
              </h3>
              <button 
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingId(null);
                  setTodoList([]);
                  setAiRationale("");
                  setTaskForm({
                    name: "",
                    projectId: "",
                    parentTaskId: "",
                    estimatedHours: 8,
                    assignedUserId: "",
                    description: ""
                  });
                }}
                className="p-1 hover:bg-slate-800 rounded-lg text-slate-400"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveTask} className="p-6 space-y-4">
              {error && (
                <div className="bg-rose-500/10 text-rose-400 p-2.5 rounded-lg border border-rose-500/20 flex items-center gap-1.5">
                  <AlertCircle className="h-4 w-4" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-slate-400 font-medium">Task Name <span className="text-amber-500">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Design user profiles screen"
                  value={taskForm.name}
                  onChange={e => setTaskForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 px-3 py-2 rounded-xl focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-slate-400 font-medium">Project <span className="text-amber-500">*</span></label>
                  <select
                    required
                    value={taskForm.projectId}
                    onChange={e => setTaskForm(prev => ({ ...prev, projectId: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 px-3 py-2 rounded-xl focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">-- Select --</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-slate-400 font-medium">Assigned Team Member <span className="text-amber-500">*</span></label>
                  <select
                    required
                    value={taskForm.assignedUserId}
                    onChange={e => setTaskForm(prev => ({ ...prev, assignedUserId: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 px-3 py-2 rounded-xl focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">-- Choose Employee --</option>
                    {deptUsers.map(u => (
                      <option key={u.id} value={u.id}>{u.fullName}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="block text-slate-400 font-medium">Estimated Time (Hours)</label>
                    <button
                      type="button"
                      disabled={isEstimating || !taskForm.name.trim()}
                      onClick={handleAiEstimateHours}
                      className="text-amber-400 hover:text-amber-300 disabled:opacity-40 disabled:hover:text-amber-400 font-semibold flex items-center gap-1 transition-colors text-[10px]"
                    >
                      {isEstimating ? (
                        <>
                          <RefreshCw className="h-3 w-3 animate-spin" />
                          Predicting...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-3 w-3" />
                          AI Predict
                        </>
                      )}
                    </button>
                  </div>
                  <input
                    type="number"
                    min="1"
                    value={taskForm.estimatedHours}
                    onChange={e => setTaskForm(prev => ({ ...prev, estimatedHours: Number(e.target.value) }))}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 px-3 py-2 rounded-xl focus:outline-none"
                  />
                  {aiRationale && (
                    <p className="text-[10px] text-amber-400 leading-normal italic bg-amber-500/5 p-1.5 rounded-lg border border-amber-500/10 mt-1 col-span-1">
                      🔮 AI Predict: {aiRationale}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="block text-slate-400 font-medium">Parent Task Link (Optional)</label>
                  <select
                    value={taskForm.parentTaskId}
                    onChange={e => setTaskForm(prev => ({ ...prev, parentTaskId: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 px-3 py-2 rounded-xl focus:outline-none"
                  >
                    <option value="">-- Standalone Task --</option>
                    {deptTasks.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Todo checklist input */}
              <div className="space-y-2 pt-2 border-t border-slate-800/60">
                <label className="block text-slate-400 font-medium">Task Checklist</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add step..."
                    value={todoInput}
                    onChange={e => setTodoInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && (e.preventDefault(), handleAddTodo())}
                    className="flex-1 bg-slate-950 border border-slate-800 text-slate-200 px-3 py-2 rounded-xl focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddTodo}
                    className="bg-slate-800 text-slate-200 px-3 py-2 rounded-xl hover:bg-slate-700 font-medium shrink-0 border border-slate-700"
                  >
                    Add
                  </button>
                </div>

                {todoList.length > 0 && (
                  <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 max-h-[100px] overflow-y-auto">
                    {todoList.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between py-1 text-slate-300">
                        <span>• {item.text}</span>
                        <button 
                          type="button" 
                          onClick={() => setTodoList(prev => prev.filter((_, i) => i !== idx))}
                          className="text-slate-500 hover:text-rose-400"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-1.5 pt-2 border-t border-slate-800/60">
                <div className="flex justify-between items-center">
                  <label className="block text-slate-400 font-medium">Work Instructions</label>
                  <button
                    type="button"
                    disabled={isDrafting || !taskForm.name.trim()}
                    onClick={handleAiDraftTask}
                    className="text-indigo-400 hover:text-indigo-300 disabled:opacity-40 disabled:hover:text-indigo-400 font-semibold flex items-center gap-1 transition-colors text-[10px]"
                  >
                    {isDrafting ? (
                      <>
                        <RefreshCw className="h-3 w-3 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-3 w-3" />
                        AI Draft Description & Steps
                      </>
                    )}
                  </button>
                </div>
                <textarea
                  rows={2}
                  placeholder="Enter detailed goals or specs..."
                  value={taskForm.description}
                  onChange={e => setTaskForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 px-3 py-2 rounded-xl focus:outline-none resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingId(null);
                    setTodoList([]);
                    setAiRationale("");
                    setTaskForm({
                      name: "",
                      projectId: "",
                      parentTaskId: "",
                      estimatedHours: 8,
                      assignedUserId: "",
                      description: ""
                    });
                  }}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold px-4 py-2 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-indigo-500 hover:bg-indigo-400 text-slate-100 font-bold px-5 py-2 rounded-xl"
                >
                  {editingId ? "Update Task" : "Create Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
