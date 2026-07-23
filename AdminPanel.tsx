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
  Plus, 
  Edit, 
  Trash2, 
  Check, 
  X, 
  Shield, 
  Building2, 
  Briefcase, 
  Users, 
  Calendar, 
  FileText, 
  Upload, 
  AlertCircle, 
  Award,
  CheckCircle,
  Clock,
  Search,
  Filter,
  ArrowRight,
  Download
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface AdminPanelProps {
  roles: Role[];
  departments: Department[];
  projects: Project[];
  users: User[];
  tasks: Task[];
  timeLogs: TimeLog[];
  setRoles: React.Dispatch<React.SetStateAction<Role[]>>;
  setDepartments: React.Dispatch<React.SetStateAction<Department[]>>;
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  setTimeLogs: React.Dispatch<React.SetStateAction<TimeLog[]>>;
}

export default function AdminPanel({
  roles,
  departments,
  projects,
  users,
  tasks,
  timeLogs,
  setRoles,
  setDepartments,
  setProjects,
  setUsers,
  setTasks,
  setTimeLogs
}: AdminPanelProps) {
  // Navigation Tabs within Admin Panel
  const [activeTab, setActiveTab] = useState<"roles" | "departments" | "projects" | "users" | "tasks" | "reports">("tasks");
  const [reportSubTab, setReportSubTab] = useState<"task-report" | "completed-task" | "performance">("task-report");

  // Masters Create/Edit States
  const [editingId, setEditingId] = useState<string | null>(null);

  // Role Form State
  const [roleForm, setRoleForm] = useState<Omit<Role, "id">>({
    name: "",
    description: "",
    remarks: "",
    permissions: { adminPanel: false, hodPanel: true, userPanel: true, masters: false, tasks: true, reports: true }
  });

  // Department Form State
  const [deptForm, setDeptForm] = useState<Omit<Department, "id">>({
    name: "",
    description: "",
    remarks: ""
  });

  // Project Form State
  const [projForm, setProjForm] = useState<Omit<Project, "id">>({
    name: "",
    description: "",
    remarks: ""
  });

  // User Form State
  const [userForm, setUserForm] = useState({
    fullName: "",
    employeeId: "",
    email: "",
    mobile: "",
    username: "",
    password: "",
    rePassword: "",
    departmentId: "",
    roleId: "",
    remarks: ""
  });
  const [userError, setUserError] = useState("");

  // Task Scheduler Form State
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskForm, setTaskForm] = useState({
    name: "",
    projectId: "",
    parentTaskId: "",
    estimatedHours: 8,
    assignedUserId: "",
    responsibleUserId: "",
    description: "",
    attachmentName: null as string | null,
    attachmentData: null as string | null
  });
  const [todoInput, setTodoInput] = useState("");
  const [todoList, setTodoList] = useState<TodoItem[]>([]);
  const [taskError, setTaskError] = useState("");

  // Reports Filters State
  const [taskRepFilterUser, setTaskRepFilterUser] = useState("all");
  const [taskRepFilterStart, setTaskRepFilterStart] = useState("");
  const [taskRepFilterEnd, setTaskRepFilterEnd] = useState("");

  const [compFilterMinPct, setCompFilterMinPct] = useState(100);
  const [compFilterStart, setCompFilterStart] = useState("");
  const [compFilterEnd, setCompFilterEnd] = useState("");

  const [perfFilterUser, setPerfFilterUser] = useState("all");
  const [perfFilterStart, setPerfFilterStart] = useState("");
  const [perfFilterEnd, setPerfFilterEnd] = useState("");

  // File Upload Helper
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setTaskForm(prev => ({
          ...prev,
          attachmentName: file.name,
          attachmentData: reader.result as string
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  // ---------------------------------------------
  // ROLL SUBMISSIONS & ACTIONS
  // ---------------------------------------------
  const handleSaveRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleForm.name.trim()) return;

    if (editingId) {
      setRoles(prev => prev.map(r => r.id === editingId ? { ...r, ...roleForm } : r));
      setEditingId(null);
    } else {
      setRoles(prev => [...prev, { id: `role-${Date.now()}`, ...roleForm }]);
    }
    setRoleForm({
      name: "",
      description: "",
      remarks: "",
      permissions: { adminPanel: false, hodPanel: true, userPanel: true, masters: false, tasks: true, reports: true }
    });
  };

  const handleEditRole = (role: Role) => {
    setEditingId(role.id);
    setRoleForm({
      name: role.name,
      description: role.description,
      remarks: role.remarks,
      permissions: { ...role.permissions }
    });
  };

  const handleDeleteRole = (id: string) => {
    if (window.confirm("Are you sure you want to delete this Role?")) {
      setRoles(prev => prev.filter(r => r.id !== id));
    }
  };

  // ---------------------------------------------
  // DEPARTMENT SUBMISSIONS & ACTIONS
  // ---------------------------------------------
  const handleSaveDept = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deptForm.name.trim()) return;

    if (editingId) {
      setDepartments(prev => prev.map(d => d.id === editingId ? { ...d, ...deptForm } : d));
      setEditingId(null);
    } else {
      setDepartments(prev => [...prev, { id: `dept-${Date.now()}`, ...deptForm }]);
    }
    setDeptForm({ name: "", description: "", remarks: "" });
  };

  const handleEditDept = (dept: Department) => {
    setEditingId(dept.id);
    setDeptForm({
      name: dept.name,
      description: dept.description,
      remarks: dept.remarks
    });
  };

  const handleDeleteDept = (id: string) => {
    if (window.confirm("Are you sure you want to delete this Department?")) {
      setDepartments(prev => prev.filter(d => d.id !== id));
    }
  };

  // ---------------------------------------------
  // PROJECT SUBMISSIONS & ACTIONS
  // ---------------------------------------------
  const handleSaveProj = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projForm.name.trim()) return;

    if (editingId) {
      setProjects(prev => prev.map(p => p.id === editingId ? { ...p, ...projForm } : p));
      setEditingId(null);
    } else {
      setProjects(prev => [...prev, { id: `proj-${Date.now()}`, ...projForm }]);
    }
    setProjForm({ name: "", description: "", remarks: "" });
  };

  const handleEditProj = (proj: Project) => {
    setEditingId(proj.id);
    setProjForm({
      name: proj.name,
      description: proj.description,
      remarks: proj.remarks
    });
  };

  const handleDeleteProj = (id: string) => {
    if (window.confirm("Are you sure you want to delete this Project?")) {
      setProjects(prev => prev.filter(p => p.id !== id));
    }
  };

  // ---------------------------------------------
  // USER SUBMISSIONS & ACTIONS
  // ---------------------------------------------
  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    setUserError("");

    if (!userForm.fullName || !userForm.employeeId || !userForm.email || !userForm.username || !userForm.departmentId || !userForm.roleId) {
      setUserError("Please fill out all required fields.");
      return;
    }

    if (!editingId && userForm.password !== userForm.rePassword) {
      setUserError("Passwords do not match.");
      return;
    }

    if (editingId) {
      setUsers(prev => prev.map(u => u.id === editingId ? {
        ...u,
        fullName: userForm.fullName,
        employeeId: userForm.employeeId,
        email: userForm.email,
        mobile: userForm.mobile,
        username: userForm.username,
        departmentId: userForm.departmentId,
        roleId: userForm.roleId,
        remarks: userForm.remarks,
        ...(userForm.password ? { password: userForm.password } : {})
      } : u));
      setEditingId(null);
    } else {
      // Check if username already exists
      if (users.some(u => u.username.toLowerCase() === userForm.username.toLowerCase())) {
        setUserError("Username already exists.");
        return;
      }
      setUsers(prev => [...prev, {
        id: `user-${Date.now()}`,
        fullName: userForm.fullName,
        employeeId: userForm.employeeId,
        email: userForm.email,
        mobile: userForm.mobile,
        username: userForm.username,
        password: userForm.password || "password",
        departmentId: userForm.departmentId,
        roleId: userForm.roleId,
        remarks: userForm.remarks
      }]);
    }

    setUserForm({
      fullName: "",
      employeeId: "",
      email: "",
      mobile: "",
      username: "",
      password: "",
      rePassword: "",
      departmentId: "",
      roleId: "",
      remarks: ""
    });
  };

  const handleEditUser = (user: User) => {
    setEditingId(user.id);
    setUserForm({
      fullName: user.fullName,
      employeeId: user.employeeId,
      email: user.email,
      mobile: user.mobile,
      username: user.username,
      password: "",
      rePassword: "",
      departmentId: user.departmentId,
      roleId: user.roleId,
      remarks: user.remarks
    });
  };

  const handleDeleteUser = (id: string) => {
    if (window.confirm("Are you sure you want to delete this User?")) {
      setUsers(prev => prev.filter(u => u.id !== id));
    }
  };

  // ---------------------------------------------
  // TASK SCHEDULER ACTIONS
  // ---------------------------------------------
  const handleAddTodoItem = () => {
    if (!todoInput.trim()) return;
    const newItem: TodoItem = {
      id: `todo-${Date.now()}-${Math.random()}`,
      text: todoInput.trim(),
      completed: false
    };
    setTodoList(prev => [...prev, newItem]);
    setTodoInput("");
  };

  const handleRemoveTodoItem = (id: string) => {
    setTodoList(prev => prev.filter(t => t.id !== id));
  };

  const handleSaveTask = (e: React.FormEvent) => {
    e.preventDefault();
    setTaskError("");

    if (!taskForm.name.trim() || !taskForm.projectId || !taskForm.assignedUserId || !taskForm.responsibleUserId) {
      setTaskError("Please fill out all required fields: Task Name, Project, Assignee, and Supervisor.");
      return;
    }

    if (editingId && editingId.startsWith("task-")) {
      setTasks(prev => prev.map(t => t.id === editingId ? {
        ...t,
        name: taskForm.name.trim(),
        projectId: taskForm.projectId,
        parentTaskId: taskForm.parentTaskId ? taskForm.parentTaskId : null,
        estimatedHours: Number(taskForm.estimatedHours) || 1,
        todoList: todoList,
        assignedUserId: taskForm.assignedUserId,
        responsibleUserId: taskForm.responsibleUserId,
        description: taskForm.description,
        attachmentName: taskForm.attachmentName,
        attachmentData: taskForm.attachmentData,
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
        responsibleUserId: taskForm.responsibleUserId,
        description: taskForm.description,
        attachmentName: taskForm.attachmentName,
        attachmentData: taskForm.attachmentData,
        status: "Pending",
        percentage: 0,
        createdDate: new Date().toISOString(),
        completedDate: null
      };

      setTasks(prev => [newTask, ...prev]);
    }

    // Reset Form
    setTaskForm({
      name: "",
      projectId: "",
      parentTaskId: "",
      estimatedHours: 8,
      assignedUserId: "",
      responsibleUserId: "",
      description: "",
      attachmentName: null,
      attachmentData: null
    });
    setTodoList([]);
    setIsTaskModalOpen(false);
  };

  const handleEditTask = (task: Task) => {
    setEditingId(task.id);
    setTaskForm({
      name: task.name,
      projectId: task.projectId,
      parentTaskId: task.parentTaskId || "",
      estimatedHours: task.estimatedHours,
      assignedUserId: task.assignedUserId,
      responsibleUserId: task.responsibleUserId,
      description: task.description,
      attachmentName: task.attachmentName,
      attachmentData: task.attachmentData
    });
    setTodoList([...task.todoList]);
    setIsTaskModalOpen(true);
  };

  const handleDeleteTask = (id: string) => {
    if (window.confirm("Delete this scheduled task?")) {
      setTasks(prev => prev.filter(t => t.id !== id));
    }
  };

  // ---------------------------------------------
  // REQUISITE DATA RESOLVING HELPERS
  // ---------------------------------------------
  const getProjectName = (projId: string) => projects.find(p => p.id === projId)?.name || "N/A";
  const getUserFullName = (uid: string) => users.find(u => u.id === uid)?.fullName || "N/A";
  const getDepartmentName = (did: string) => departments.find(d => d.id === did)?.name || "N/A";
  const getRoleName = (rid: string) => roles.find(r => r.id === rid)?.name || "N/A";

  const getTaskTotalActualHours = (taskId: string) => {
    const logs = timeLogs.filter(l => l.taskId === taskId);
    let totalMinutes = 0;
    logs.forEach(l => {
      if (l.durationMinutes) {
        totalMinutes += l.durationMinutes;
      } else if (l.startTime && !l.endTime) {
        // Fallback or running log
        const start = new Date(l.startTime).getTime();
        const now = new Date().getTime();
        totalMinutes += Math.max(0, Math.floor((now - start) / 60000));
      } else if (l.isAutoStopped) {
        // Auto stop missed timer is considered 6 hours
        totalMinutes += 360;
      }
    });
    return Number((totalMinutes / 60).toFixed(1));
  };

  // ---------------------------------------------
  // REPORTS COMPUTATIONS
  // ---------------------------------------------

  // 1. General Task Report List
  const filteredTasksReport = tasks.filter(task => {
    const matchesUser = taskRepFilterUser === "all" || task.assignedUserId === taskRepFilterUser || task.responsibleUserId === taskRepFilterUser;
    const taskDate = new Date(task.createdDate);
    const matchesStart = !taskRepFilterStart || taskDate >= new Date(taskRepFilterStart + "T00:00:00");
    const matchesEnd = !taskRepFilterEnd || taskDate <= new Date(taskRepFilterEnd + "T23:59:59");
    return matchesUser && matchesStart && matchesEnd;
  });

  // 2. Completed Task List
  const completedTasksReport = tasks.filter(task => {
    if (task.status !== "Completed") return false;
    const matchesPct = task.percentage >= compFilterMinPct;
    const compDate = task.completedDate ? new Date(task.completedDate) : null;
    if (!compDate) return matchesPct;
    const matchesStart = !compFilterStart || compDate >= new Date(compFilterStart + "T00:00:00");
    const matchesEnd = !compFilterEnd || compDate <= new Date(compFilterEnd + "T23:59:59");
    return matchesPct && matchesStart && matchesEnd;
  });

  // 3. User Performance calculations
  const performanceReportData = users.map(user => {
    const userTasks = tasks.filter(t => t.assignedUserId === user.id);
    const totalTasksCount = userTasks.length;
    const completedTasksCount = userTasks.filter(t => t.status === "Completed").length;
    const totalEstHours = userTasks.reduce((acc, t) => acc + t.estimatedHours, 0);

    // Filter time logs within date ranges if specified
    const userLogs = timeLogs.filter(log => {
      if (log.userId !== user.id) return false;
      const logDate = new Date(log.startTime);
      const matchesStart = !perfFilterStart || logDate >= new Date(perfFilterStart + "T00:00:00");
      const matchesEnd = !perfFilterEnd || logDate <= new Date(perfFilterEnd + "T23:59:59");
      return matchesStart && matchesEnd;
    });

    let totalActualMinutes = 0;
    let autoStopCount = 0;
    userLogs.forEach(l => {
      if (l.durationMinutes) {
        totalActualMinutes += l.durationMinutes;
      } else if (l.isAutoStopped) {
        totalActualMinutes += 360; // 6 hours
        autoStopCount += 1;
      }
    });

    const totalActHours = Number((totalActualMinutes / 60).toFixed(1));
    const averageCompletion = totalTasksCount > 0 
      ? Math.round(userTasks.reduce((acc, t) => acc + t.percentage, 0) / totalTasksCount) 
      : 0;

    // Efficiency: Estimated / Actual * 100
    const efficiency = totalActHours > 0 
      ? Math.round((totalEstHours / totalActHours) * 100) 
      : 0;

    return {
      user,
      totalTasksCount,
      completedTasksCount,
      totalEstHours,
      totalActHours,
      averageCompletion,
      efficiency,
      autoStopCount
    };
  }).filter(row => perfFilterUser === "all" || row.user.id === perfFilterUser);

  // Administrative Excel Export Functions
  const handleExportGeneralTaskReportToExcel = () => {
    if (filteredTasksReport.length === 0) {
      alert("No general tasks available to export.");
      return;
    }
    let csv = "Task Name,Project Name,Allocated To,Supervisor,Creation Date,Estimated Hours,Actual Logged Hours,Status,Progress Percentage\n";
    filteredTasksReport.forEach(task => {
      const projName = getProjectName(task.projectId);
      const allocatedTo = getUserFullName(task.assignedUserId);
      const supervisor = getUserFullName(task.responsibleUserId);
      const creationDate = new Date(task.createdDate).toLocaleDateString();
      const estHrs = task.estimatedHours;
      const actHrs = getTaskTotalActualHours(task.id);
      csv += `"${task.name.replace(/"/g, '""')}","${projName.replace(/"/g, '""')}","${allocatedTo.replace(/"/g, '""')}","${supervisor.replace(/"/g, '""')}","${creationDate}","${estHrs}","${actHrs}","${task.status}","${task.percentage}%"\n`;
    });
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `general_task_report_${taskRepFilterStart || "all"}_to_${taskRepFilterEnd || "all"}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportCompletedTaskReportToExcel = () => {
    if (completedTasksReport.length === 0) {
      alert("No completed tasks available to export.");
      return;
    }
    let csv = "Task Name,Project Name,Completed By,Creation Date,Completion Date,Estimated Hours,Actual Spent Hours,Variance (Hours),Performance Variance\n";
    completedTasksReport.forEach(task => {
      const projName = getProjectName(task.projectId);
      const completedBy = getUserFullName(task.assignedUserId);
      const creationDate = new Date(task.createdDate).toLocaleDateString();
      const compDate = task.completedDate ? new Date(task.completedDate).toLocaleDateString() : "N/A";
      const estHrs = task.estimatedHours;
      const actHrs = getTaskTotalActualHours(task.id);
      const diff = estHrs - actHrs;
      const varianceText = diff === 0 ? "On Target" : diff > 0 ? `Saved ${diff} hrs` : `Exceeded ${Math.abs(diff)} hrs`;
      csv += `"${task.name.replace(/"/g, '""')}","${projName.replace(/"/g, '""')}","${completedBy.replace(/"/g, '""')}","${creationDate}","${compDate}","${estHrs}","${actHrs}","${diff}","${varianceText}"\n`;
    });
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `completed_tasks_report_${compFilterStart || "all"}_to_${compFilterEnd || "all"}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPerformanceAuditToExcel = () => {
    if (performanceReportData.length === 0) {
      alert("No performance rows available to export.");
      return;
    }
    let csv = "Employee Name,Department,Allocated Tasks,Completed,Estimated Hours,Actual Logged Hours,Missed Stops Count,Efficiency Score\n";
    performanceReportData.forEach(row => {
      const deptName = getDepartmentName(row.user.departmentId);
      csv += `"${row.user.fullName.replace(/"/g, '""')}","${deptName.replace(/"/g, '""')}","${row.totalTasksCount}","${row.completedTasksCount}","${row.totalEstHours}","${row.totalActHours}","${row.autoStopCount}","${row.efficiency}%"\n`;
    });
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `performance_audit_${perfFilterStart || "all"}_to_${perfFilterEnd || "all"}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div id="admin-panel-container" className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden min-h-[600px] flex flex-col">
      {/* Header Panel */}
      <div className="bg-slate-950 px-6 py-5 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-100 flex items-center gap-2">
            <Shield className="h-5 w-5 text-amber-500" />
            Corporate Administration & Masters Panel
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Maintain organizational master files, schedule enterprise tasks, track work logs, and run analytics reports.
          </p>
        </div>
        {/* Navigation Tabs */}
        <div className="flex flex-wrap bg-slate-900 border border-slate-800 p-1 rounded-xl">
          <button
            onClick={() => { setActiveTab("tasks"); setEditingId(null); }}
            className={`px-4 py-1.5 text-xs font-medium rounded-lg transition-all ${
              activeTab === "tasks" ? "bg-amber-500 text-slate-950" : "text-slate-300 hover:bg-slate-800"
            }`}
          >
            Scheduling
          </button>
          <button
            onClick={() => { setActiveTab("users"); setEditingId(null); }}
            className={`px-4 py-1.5 text-xs font-medium rounded-lg transition-all ${
              activeTab === "users" ? "bg-amber-500 text-slate-950" : "text-slate-300 hover:bg-slate-800"
            }`}
          >
            Users
          </button>
          <button
            onClick={() => { setActiveTab("projects"); setEditingId(null); }}
            className={`px-4 py-1.5 text-xs font-medium rounded-lg transition-all ${
              activeTab === "projects" ? "bg-amber-500 text-slate-950" : "text-slate-300 hover:bg-slate-800"
            }`}
          >
            Projects
          </button>
          <button
            onClick={() => { setActiveTab("departments"); setEditingId(null); }}
            className={`px-4 py-1.5 text-xs font-medium rounded-lg transition-all ${
              activeTab === "departments" ? "bg-amber-500 text-slate-950" : "text-slate-300 hover:bg-slate-800"
            }`}
          >
            Depts
          </button>
          <button
            onClick={() => { setActiveTab("roles"); setEditingId(null); }}
            className={`px-4 py-1.5 text-xs font-medium rounded-lg transition-all ${
              activeTab === "roles" ? "bg-amber-500 text-slate-950" : "text-slate-300 hover:bg-slate-800"
            }`}
          >
            Roles
          </button>
          <button
            onClick={() => { setActiveTab("reports"); setEditingId(null); }}
            className={`px-4 py-1.5 text-xs font-medium rounded-lg transition-all ${
              activeTab === "reports" ? "bg-amber-500 text-slate-950" : "text-slate-300 hover:bg-slate-800"
            }`}
          >
            Reports
          </button>
        </div>
      </div>

      <div className="p-6 flex-1 flex flex-col">
        {/* TAB 1: TASK SCHEDULING & LIST */}
        {activeTab === "tasks" && (
          <div className="space-y-6 flex-1 flex flex-col">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-950 p-4 rounded-xl border border-slate-800">
              <div>
                <h3 className="font-medium text-slate-200 text-sm">Enterprise Task Planner</h3>
                <p className="text-xs text-slate-400 mt-1">Create master deliverables, attach spec files, and allocate tasks to developers.</p>
              </div>
              <button
                id="btn-new-task-trigger"
                onClick={() => {
                  setEditingId(null);
                  setIsTaskModalOpen(true);
                }}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-medium px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 self-start transition-colors"
              >
                <Plus className="h-4 w-4" />
                Schedule New Task
              </button>
            </div>

            <div className="overflow-x-auto border border-slate-800 rounded-xl bg-slate-950/40 flex-1">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/80 text-slate-400 font-medium uppercase tracking-wider">
                    <th className="px-4 py-3.5">Task Name</th>
                    <th className="px-4 py-3.5">Project</th>
                    <th className="px-4 py-3.5">Assignee</th>
                    <th className="px-4 py-3.5">Supervisor (Responsible)</th>
                    <th className="px-4 py-3.5 text-center">Estimate</th>
                    <th className="px-4 py-3.5 text-center">Actual Logged</th>
                    <th className="px-4 py-3.5">Status / Progress</th>
                    <th className="px-4 py-3.5 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {tasks.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-12 text-slate-500 font-medium">
                        No tasks scheduled. Click "Schedule New Task" to begin.
                      </td>
                    </tr>
                  ) : (
                    tasks.map(task => {
                      const actualHours = getTaskTotalActualHours(task.id);
                      return (
                        <tr key={task.id} className="hover:bg-slate-800/30 transition-colors">
                          <td className="px-4 py-4 font-medium">
                            <div>
                              <span className="text-slate-100">{task.name}</span>
                              {task.parentTaskId && (
                                <div className="text-[10px] text-amber-500 flex items-center gap-1 mt-0.5">
                                  <span>Subtask of:</span>
                                  <span className="underline italic">
                                    {tasks.find(t => t.id === task.parentTaskId)?.name || "Parent Task"}
                                  </span>
                                </div>
                              )}
                              {task.attachmentName && (
                                <span className="inline-block mt-1.5 text-[10px] bg-slate-800 border border-slate-700 text-slate-300 px-2 py-0.5 rounded-md">
                                  📎 {task.attachmentName}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-4 text-slate-400">{getProjectName(task.projectId)}</td>
                          <td className="px-4 py-4 font-medium text-slate-200">{getUserFullName(task.assignedUserId)}</td>
                          <td className="px-4 py-4 text-slate-400">{getUserFullName(task.responsibleUserId)}</td>
                          <td className="px-4 py-4 text-center font-mono text-slate-400">{task.estimatedHours} hrs</td>
                          <td className="px-4 py-4 text-center font-mono">
                            <span className={actualHours > task.estimatedHours ? "text-rose-400 font-semibold" : "text-emerald-400"}>
                              {actualHours} hrs
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-2 max-w-[150px]">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide uppercase ${
                                task.status === "Completed" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                                task.status === "In Progress" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                                "bg-slate-700/50 text-slate-400 border border-slate-700"
                              }`}>
                                {task.status}
                              </span>
                              <div className="flex-1 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                <div className="bg-amber-500 h-full rounded-full" style={{ width: `${task.percentage}%` }}></div>
                              </div>
                              <span className="font-mono text-[10px] text-slate-400">{task.percentage}%</span>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => handleEditTask(task)}
                                className="p-1.5 text-slate-400 hover:text-amber-500 hover:bg-amber-500/10 rounded-lg transition-all"
                                title="Edit task"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteTask(task.id)}
                                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all"
                                title="Delete task"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* NEW TASK SCHEDULER FRAME/MODAL */}
            {isTaskModalOpen && (
              <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95, y: 15 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
                >
                  <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
                    <h3 className="font-semibold text-slate-200 text-sm flex items-center gap-2">
                      <Briefcase className="h-4 w-4 text-amber-500" />
                      {editingId && editingId.startsWith("task-") ? "Modify Scheduled Task" : "Create & Allocate Deliverable Task"}
                    </h3>
                    <button 
                      onClick={() => {
                        setIsTaskModalOpen(false);
                        setEditingId(null);
                        setTaskForm({
                          name: "",
                          projectId: "",
                          parentTaskId: "",
                          estimatedHours: 8,
                          assignedUserId: "",
                          responsibleUserId: "",
                          description: "",
                          attachmentName: null,
                          attachmentData: null
                        });
                        setTodoList([]);
                      }}
                      className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-100"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <form onSubmit={handleSaveTask} className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
                    {taskError && (
                      <div className="bg-rose-500/10 text-rose-400 p-3 rounded-lg flex items-center gap-2 border border-rose-500/20">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        <span>{taskError}</span>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Name of the Task */}
                      <div className="space-y-1.5 md:col-span-2">
                        <label className="block text-slate-400 font-medium">Name of the Task <span className="text-amber-500">*</span></label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Architect Core Database Schemas"
                          value={taskForm.name}
                          onChange={e => setTaskForm(prev => ({ ...prev, name: e.target.value }))}
                          className="w-full bg-slate-950 border border-slate-800 text-slate-200 px-3 py-2 rounded-xl focus:outline-none focus:border-amber-500 text-xs"
                        />
                      </div>

                      {/* Select Project Name */}
                      <div className="space-y-1.5">
                        <label className="block text-slate-400 font-medium">Select Project <span className="text-amber-500">*</span></label>
                        <select
                          required
                          value={taskForm.projectId}
                          onChange={e => setTaskForm(prev => ({ ...prev, projectId: e.target.value }))}
                          className="w-full bg-slate-950 border border-slate-800 text-slate-200 px-3 py-2 rounded-xl focus:outline-none focus:border-amber-500 text-xs"
                        >
                          <option value="">-- Choose Project --</option>
                          {projects.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </select>
                      </div>

                      {/* Linked with Parent Task */}
                      <div className="space-y-1.5">
                        <label className="block text-slate-400 font-medium">Linked with Parent Task (Optional)</label>
                        <select
                          value={taskForm.parentTaskId}
                          onChange={e => setTaskForm(prev => ({ ...prev, parentTaskId: e.target.value }))}
                          className="w-full bg-slate-950 border border-slate-800 text-slate-200 px-3 py-2 rounded-xl focus:outline-none focus:border-amber-500 text-xs"
                        >
                          <option value="">-- Standalone Task --</option>
                          {tasks.map(t => (
                            <option key={t.id} value={t.id}>{t.name}</option>
                          ))}
                        </select>
                      </div>

                      {/* Estimated time */}
                      <div className="space-y-1.5">
                        <label className="block text-slate-400 font-medium">Time Required (Estimated Hours)</label>
                        <input
                          type="number"
                          min="1"
                          max="500"
                          value={taskForm.estimatedHours}
                          onChange={e => setTaskForm(prev => ({ ...prev, estimatedHours: Number(e.target.value) }))}
                          className="w-full bg-slate-950 border border-slate-800 text-slate-200 px-3 py-2 rounded-xl focus:outline-none focus:border-amber-500 text-xs font-mono"
                        />
                      </div>

                      {/* File upload attachment */}
                      <div className="space-y-1.5">
                        <label className="block text-slate-400 font-medium">Attachment (Spec / Scope of Work)</label>
                        <div className="relative">
                          <input
                            type="file"
                            onChange={handleFileUpload}
                            className="hidden"
                            id="task-file-upload"
                          />
                          <label
                            htmlFor="task-file-upload"
                            className="w-full bg-slate-950 border border-slate-800 hover:bg-slate-800 text-slate-300 px-3 py-2 rounded-xl focus:outline-none focus:border-amber-500 cursor-pointer flex items-center justify-between gap-1 transition-all"
                          >
                            <span className="truncate">
                              {taskForm.attachmentName || "Select file Spec..."}
                            </span>
                            <Upload className="h-4 w-4 text-slate-400 shrink-0" />
                          </label>
                        </div>
                      </div>

                      {/* Task Assigned User */}
                      <div className="space-y-1.5">
                        <label className="block text-slate-400 font-medium">Task Assigned to Employee <span className="text-amber-500">*</span></label>
                        <select
                          required
                          value={taskForm.assignedUserId}
                          onChange={e => setTaskForm(prev => ({ ...prev, assignedUserId: e.target.value }))}
                          className="w-full bg-slate-950 border border-slate-800 text-slate-200 px-3 py-2 rounded-xl focus:outline-none focus:border-amber-500 text-xs"
                        >
                          <option value="">-- Choose User --</option>
                          {users.map(u => (
                            <option key={u.id} value={u.id}>{u.fullName} ({getDepartmentName(u.departmentId)})</option>
                          ))}
                        </select>
                      </div>

                      {/* Supervisor Responsible person */}
                      <div className="space-y-1.5">
                        <label className="block text-slate-400 font-medium">Responsible Supervisor <span className="text-amber-500">*</span></label>
                        <select
                          required
                          value={taskForm.responsibleUserId}
                          onChange={e => setTaskForm(prev => ({ ...prev, responsibleUserId: e.target.value }))}
                          className="w-full bg-slate-950 border border-slate-800 text-slate-200 px-3 py-2 rounded-xl focus:outline-none focus:border-amber-500 text-xs"
                        >
                          <option value="">-- Choose Supervisor --</option>
                          {users.map(u => (
                            <option key={u.id} value={u.id}>{u.fullName} ({getRoleName(u.roleId)})</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Todo checklist */}
                    <div className="space-y-2 pt-2 border-t border-slate-800/60">
                      <label className="block text-slate-400 font-medium">Included To-Do Checklist Items</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="e.g. Write backend schema tests"
                          value={todoInput}
                          onChange={e => setTodoInput(e.target.value)}
                          onKeyDown={e => e.key === "Enter" && (e.preventDefault(), handleAddTodoItem())}
                          className="flex-1 bg-slate-950 border border-slate-800 text-slate-200 px-3 py-2 rounded-xl focus:outline-none focus:border-amber-500 text-xs"
                        />
                        <button
                          type="button"
                          onClick={handleAddTodoItem}
                          className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium px-4 py-2 rounded-xl text-xs shrink-0 flex items-center gap-1 border border-slate-700 transition-colors"
                        >
                          Add Item
                        </button>
                      </div>

                      {todoList.length > 0 && (
                        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 max-h-[140px] overflow-y-auto divide-y divide-slate-900">
                          {todoList.map(item => (
                            <div key={item.id} className="py-2 flex items-center justify-between text-slate-300">
                              <span className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
                                {item.text}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleRemoveTodoItem(item.id)}
                                className="text-slate-500 hover:text-rose-400 p-0.5 rounded transition-all"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Description */}
                    <div className="space-y-1.5 pt-2 border-t border-slate-800/60">
                      <label className="block text-slate-400 font-medium">Detailed Work Instructions</label>
                      <textarea
                        rows={3}
                        placeholder="Define goals, documentation specs, key criteria, and helpful links..."
                        value={taskForm.description}
                        onChange={e => setTaskForm(prev => ({ ...prev, description: e.target.value }))}
                        className="w-full bg-slate-950 border border-slate-800 text-slate-200 px-3 py-2 rounded-xl focus:outline-none focus:border-amber-500 text-xs resize-none"
                      />
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                      <button
                        type="button"
                        onClick={() => {
                          setIsTaskModalOpen(false);
                          setEditingId(null);
                          setTaskForm({
                            name: "",
                            projectId: "",
                            parentTaskId: "",
                            estimatedHours: 8,
                            assignedUserId: "",
                            responsibleUserId: "",
                            description: "",
                            attachmentName: null,
                            attachmentData: null
                          });
                          setTodoList([]);
                        }}
                        className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold px-4 py-2 rounded-xl transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-5 py-2 rounded-xl transition-colors"
                      >
                        {editingId && editingId.startsWith("task-") ? "Update Task" : "Schedule Task"}
                      </button>
                    </div>
                  </form>
                </motion.div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: USERS MASTER */}
        {activeTab === "users" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 text-xs">
            {/* Create / Edit Form */}
            <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 h-fit space-y-4">
              <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-1.5">
                <Users className="h-4 w-4 text-amber-500" />
                {editingId ? "Modify Existing User Account" : "Register New Team User"}
              </h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Define security credentials, allocate to a corporate department, and assign system roles.
              </p>

              <form onSubmit={handleSaveUser} className="space-y-3 pt-2">
                {userError && (
                  <div className="bg-rose-500/10 text-rose-400 p-2.5 rounded-lg border border-rose-500/20 flex items-center gap-1.5">
                    <AlertCircle className="h-4 w-4" />
                    <span>{userError}</span>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="block text-slate-400 font-medium">Full Employee Name <span className="text-amber-500">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Alice Developer"
                    value={userForm.fullName}
                    onChange={e => setUserForm(prev => ({ ...prev, fullName: e.target.value }))}
                    className="w-full bg-slate-900 border border-slate-800 text-slate-200 px-3 py-1.5 rounded-xl focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="block text-slate-400 font-medium">Employee ID <span className="text-amber-500">*</span></label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. EMP-104"
                      value={userForm.employeeId}
                      onChange={e => setUserForm(prev => ({ ...prev, employeeId: e.target.value }))}
                      className="w-full bg-slate-900 border border-slate-800 text-slate-200 px-3 py-1.5 rounded-xl focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-slate-400 font-medium">Username <span className="text-amber-500">*</span></label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. alice_dev"
                      value={userForm.username}
                      onChange={e => setUserForm(prev => ({ ...prev, username: e.target.value }))}
                      className="w-full bg-slate-900 border border-slate-800 text-slate-200 px-3 py-1.5 rounded-xl focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="block text-slate-400 font-medium">Email Address <span className="text-amber-500">*</span></label>
                    <input
                      type="email"
                      required
                      placeholder="alice@company.com"
                      value={userForm.email}
                      onChange={e => setUserForm(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full bg-slate-900 border border-slate-800 text-slate-200 px-3 py-1.5 rounded-xl focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-slate-400 font-medium">Mobile Contact</label>
                    <input
                      type="text"
                      placeholder="+1 (555) 000-0000"
                      value={userForm.mobile}
                      onChange={e => setUserForm(prev => ({ ...prev, mobile: e.target.value }))}
                      className="w-full bg-slate-900 border border-slate-800 text-slate-200 px-3 py-1.5 rounded-xl focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 bg-slate-900/50 p-3 rounded-xl border border-slate-800/80">
                  <div className="space-y-1.5 col-span-2">
                    <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Access Authorization</span>
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-slate-400 font-medium">Department <span className="text-amber-500">*</span></label>
                    <select
                      required
                      value={userForm.departmentId}
                      onChange={e => setUserForm(prev => ({ ...prev, departmentId: e.target.value }))}
                      className="w-full bg-slate-950 border border-slate-800 text-slate-200 px-2 py-1.5 rounded-xl focus:outline-none focus:border-amber-500"
                    >
                      <option value="">-- Choose --</option>
                      {departments.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-slate-400 font-medium">Corporate Role <span className="text-amber-500">*</span></label>
                    <select
                      required
                      value={userForm.roleId}
                      onChange={e => setUserForm(prev => ({ ...prev, roleId: e.target.value }))}
                      className="w-full bg-slate-950 border border-slate-800 text-slate-200 px-2 py-1.5 rounded-xl focus:outline-none focus:border-amber-500"
                    >
                      <option value="">-- Choose --</option>
                      {roles.map(r => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="block text-slate-400 font-medium">
                      {editingId ? "Update Password (Optional)" : "Set Password"} <span className="text-amber-500">*</span>
                    </label>
                    <input
                      type="password"
                      placeholder="******"
                      value={userForm.password}
                      onChange={e => setUserForm(prev => ({ ...prev, password: e.target.value }))}
                      className="w-full bg-slate-900 border border-slate-800 text-slate-200 px-3 py-1.5 rounded-xl focus:outline-none focus:border-amber-500 font-mono"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-slate-400 font-medium">Re-enter Password</label>
                    <input
                      type="password"
                      placeholder="******"
                      value={userForm.rePassword}
                      onChange={e => setUserForm(prev => ({ ...prev, rePassword: e.target.value }))}
                      className="w-full bg-slate-900 border border-slate-800 text-slate-200 px-3 py-1.5 rounded-xl focus:outline-none focus:border-amber-500 font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-slate-400 font-medium">Administrator Remarks</label>
                  <input
                    type="text"
                    placeholder="e.g. Relocated to Core Web Portal project"
                    value={userForm.remarks}
                    onChange={e => setUserForm(prev => ({ ...prev, remarks: e.target.value }))}
                    className="w-full bg-slate-900 border border-slate-800 text-slate-200 px-3 py-1.5 rounded-xl focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="flex items-center gap-2 pt-3">
                  {editingId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(null);
                        setUserForm({
                          fullName: "", employeeId: "", email: "", mobile: "",
                          username: "", password: "", rePassword: "", departmentId: "", roleId: "", remarks: ""
                        });
                      }}
                      className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium py-2 rounded-xl transition-colors"
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    type="submit"
                    className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-2 rounded-xl transition-all"
                  >
                    {editingId ? "Update Employee" : "Register Employee"}
                  </button>
                </div>
              </form>
            </div>

            {/* List Grid */}
            <div className="lg:col-span-2 space-y-4">
              <h3 className="font-semibold text-slate-200 text-sm flex items-center gap-1.5">
                <Users className="h-4 w-4 text-slate-400" />
                Active Employee Registrations
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {users.map(u => (
                  <div key={u.id} className="bg-slate-950 p-4 rounded-xl border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-semibold text-slate-200">{u.fullName}</h4>
                          <span className="font-mono text-[10px] text-amber-500 mt-0.5 inline-block bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                            {u.employeeId}
                          </span>
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleEditUser(u)}
                            className="p-1 text-slate-400 hover:text-amber-500 hover:bg-amber-500/10 rounded-lg transition-all"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(u.id)}
                            className="p-1 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="mt-4 space-y-1.5 border-t border-slate-900 pt-3">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Department:</span>
                          <span className="text-slate-300 font-medium">{getDepartmentName(u.departmentId)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Security Role:</span>
                          <span className="text-slate-300 font-medium">{getRoleName(u.roleId)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Username:</span>
                          <span className="text-slate-400 font-mono">{u.username}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Contact Email:</span>
                          <span className="text-slate-300 font-mono truncate max-w-[150px]" title={u.email}>{u.email}</span>
                        </div>
                        {u.mobile && (
                          <div className="flex justify-between">
                            <span className="text-slate-500">Mobile:</span>
                            <span className="text-slate-300">{u.mobile}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {u.remarks && (
                      <div className="mt-3 pt-2 border-t border-slate-900 text-[11px] text-slate-400 italic">
                        Remarks: {u.remarks}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: PROJECTS MASTER */}
        {activeTab === "projects" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 text-xs">
            {/* Create / Edit Form */}
            <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 h-fit space-y-4">
              <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-1.5">
                <Briefcase className="h-4 w-4 text-amber-500" />
                {editingId ? "Modify Project Record" : "Establish New Project Master"}
              </h3>
              <p className="text-slate-400 text-xs">
                Log corporate work streams and assign distinct tasks against them.
              </p>

              <form onSubmit={handleSaveProj} className="space-y-3 pt-2">
                <div className="space-y-1.5">
                  <label className="block text-slate-400 font-medium">Project Name <span className="text-amber-500">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Growth Marketing Site"
                    value={projForm.name}
                    onChange={e => setProjForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full bg-slate-900 border border-slate-800 text-slate-200 px-3 py-1.5 rounded-xl focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-slate-400 font-medium">Scope Description</label>
                  <textarea
                    rows={3}
                    placeholder="Define core deliverables, timelines, and main objective..."
                    value={projForm.description}
                    onChange={e => setProjForm(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full bg-slate-900 border border-slate-800 text-slate-200 px-3 py-1.5 rounded-xl focus:outline-none focus:border-amber-500 resize-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-slate-400 font-medium">Remarks / Timeline Notes</label>
                  <input
                    type="text"
                    placeholder="e.g. Deliver before Q3 product sync"
                    value={projForm.remarks}
                    onChange={e => setProjForm(prev => ({ ...prev, remarks: e.target.value }))}
                    className="w-full bg-slate-900 border border-slate-800 text-slate-200 px-3 py-1.5 rounded-xl focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  {editingId && (
                    <button
                      type="button"
                      onClick={() => { setEditingId(null); setProjForm({ name: "", description: "", remarks: "" }); }}
                      className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium py-2 rounded-xl transition-colors"
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    type="submit"
                    className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-2 rounded-xl transition-all"
                  >
                    {editingId ? "Update Project" : "Create Project"}
                  </button>
                </div>
              </form>
            </div>

            {/* List Table */}
            <div className="lg:col-span-2 space-y-4">
              <h3 className="font-semibold text-slate-200 text-sm flex items-center gap-1.5">
                <Briefcase className="h-4 w-4 text-slate-400" />
                Active Project Registries
              </h3>

              <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/40">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950/80 text-slate-400 font-medium uppercase tracking-wider">
                      <th className="px-4 py-3">Project Name</th>
                      <th className="px-4 py-3">Description</th>
                      <th className="px-4 py-3">Remarks / Target Notes</th>
                      <th className="px-4 py-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {projects.map(p => (
                      <tr key={p.id} className="hover:bg-slate-800/20 transition-colors">
                        <td className="px-4 py-3.5 font-semibold text-slate-200">{p.name}</td>
                        <td className="px-4 py-3.5 text-slate-400 max-w-xs truncate" title={p.description}>{p.description}</td>
                        <td className="px-4 py-3.5 text-slate-400">{p.remarks}</td>
                        <td className="px-4 py-3.5 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleEditProj(p)}
                              className="p-1 text-slate-400 hover:text-amber-500 hover:bg-amber-500/10 rounded-lg transition-all"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteProj(p.id)}
                              className="p-1 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: DEPARTMENTS MASTER */}
        {activeTab === "departments" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 text-xs">
            {/* Create / Edit Form */}
            <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 h-fit space-y-4">
              <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-1.5">
                <Building2 className="h-4 w-4 text-amber-500" />
                {editingId ? "Modify Department Record" : "Register New Department Master"}
              </h3>
              <p className="text-slate-400 text-xs">
                Divide personnel and workflows into core organizational business units.
              </p>

              <form onSubmit={handleSaveDept} className="space-y-3 pt-2">
                <div className="space-y-1.5">
                  <label className="block text-slate-400 font-medium">Department Name <span className="text-amber-500">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Engineering & DevOps"
                    value={deptForm.name}
                    onChange={e => setDeptForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full bg-slate-900 border border-slate-800 text-slate-200 px-3 py-1.5 rounded-xl focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-slate-400 font-medium">Department Functions</label>
                  <textarea
                    rows={3}
                    placeholder="Describe main functions, mandates, or responsibility boundaries..."
                    value={deptForm.description}
                    onChange={e => setDeptForm(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full bg-slate-900 border border-slate-800 text-slate-200 px-3 py-1.5 rounded-xl focus:outline-none focus:border-amber-500 resize-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-slate-400 font-medium">Remarks / Supervisor Role</label>
                  <input
                    type="text"
                    placeholder="e.g. Primary delivery cost center"
                    value={deptForm.remarks}
                    onChange={e => setDeptForm(prev => ({ ...prev, remarks: e.target.value }))}
                    className="w-full bg-slate-900 border border-slate-800 text-slate-200 px-3 py-1.5 rounded-xl focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  {editingId && (
                    <button
                      type="button"
                      onClick={() => { setEditingId(null); setDeptForm({ name: "", description: "", remarks: "" }); }}
                      className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium py-2 rounded-xl transition-colors"
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    type="submit"
                    className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-2 rounded-xl transition-all"
                  >
                    {editingId ? "Update Department" : "Create Department"}
                  </button>
                </div>
              </form>
            </div>

            {/* List Table */}
            <div className="lg:col-span-2 space-y-4">
              <h3 className="font-semibold text-slate-200 text-sm flex items-center gap-1.5">
                <Building2 className="h-4 w-4 text-slate-400" />
                Active Corporate Departments
              </h3>

              <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/40">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950/80 text-slate-400 font-medium uppercase tracking-wider">
                      <th className="px-4 py-3">Department Name</th>
                      <th className="px-4 py-3">Functions / Scope</th>
                      <th className="px-4 py-3">Remarks / Cost Code</th>
                      <th className="px-4 py-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {departments.map(d => (
                      <tr key={d.id} className="hover:bg-slate-800/20 transition-colors">
                        <td className="px-4 py-3.5 font-semibold text-slate-200">{d.name}</td>
                        <td className="px-4 py-3.5 text-slate-400 max-w-xs truncate" title={d.description}>{d.description}</td>
                        <td className="px-4 py-3.5 text-slate-400">{d.remarks}</td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleEditDept(d)}
                              className="p-1 text-slate-400 hover:text-amber-500 hover:bg-amber-500/10 rounded-lg transition-all"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteDept(d.id)}
                              className="p-1 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: ROLES MASTER */}
        {activeTab === "roles" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 text-xs">
            {/* Create / Edit Form */}
            <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 h-fit space-y-4">
              <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-1.5">
                <Shield className="h-4 w-4 text-amber-500" />
                {editingId ? "Modify Security Role" : "Register Security Role Master"}
              </h3>
              <p className="text-slate-400 text-xs">
                Maintain authorization groups and allocate modular functional permissions.
              </p>

              <form onSubmit={handleSaveRole} className="space-y-3 pt-2">
                <div className="space-y-1.5">
                  <label className="block text-slate-400 font-medium">Role Name <span className="text-amber-500">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Lead HOD Designer"
                    value={roleForm.name}
                    onChange={e => setRoleForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full bg-slate-900 border border-slate-800 text-slate-200 px-3 py-1.5 rounded-xl focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-slate-400 font-medium">Description</label>
                  <textarea
                    rows={2}
                    placeholder="Responsibilities associated with this role..."
                    value={roleForm.description}
                    onChange={e => setRoleForm(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full bg-slate-900 border border-slate-800 text-slate-200 px-3 py-1.5 rounded-xl focus:outline-none focus:border-amber-500 resize-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-slate-400 font-medium">Administrative Remarks</label>
                  <input
                    type="text"
                    placeholder="e.g. Standard access level"
                    value={roleForm.remarks}
                    onChange={e => setRoleForm(prev => ({ ...prev, remarks: e.target.value }))}
                    className="w-full bg-slate-900 border border-slate-800 text-slate-200 px-3 py-1.5 rounded-xl focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* Granular Permission section */}
                <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800/80 space-y-2">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block border-b border-slate-800 pb-1.5">
                    Module Authorization Permissions
                  </span>
                  
                  <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
                    <label className="flex items-center gap-2 text-slate-300 hover:text-slate-100 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={roleForm.permissions.adminPanel}
                        onChange={e => setRoleForm(prev => ({
                          ...prev,
                          permissions: { ...prev.permissions, adminPanel: e.target.checked }
                        }))}
                        className="rounded accent-amber-500"
                      />
                      Admin Panel
                    </label>

                    <label className="flex items-center gap-2 text-slate-300 hover:text-slate-100 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={roleForm.permissions.hodPanel}
                        onChange={e => setRoleForm(prev => ({
                          ...prev,
                          permissions: { ...prev.permissions, hodPanel: e.target.checked }
                        }))}
                        className="rounded accent-amber-500"
                      />
                      HOD Panel
                    </label>

                    <label className="flex items-center gap-2 text-slate-300 hover:text-slate-100 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={roleForm.permissions.userPanel}
                        onChange={e => setRoleForm(prev => ({
                          ...prev,
                          permissions: { ...prev.permissions, userPanel: e.target.checked }
                        }))}
                        className="rounded accent-amber-500"
                      />
                      User Workspace
                    </label>

                    <label className="flex items-center gap-2 text-slate-300 hover:text-slate-100 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={roleForm.permissions.masters}
                        onChange={e => setRoleForm(prev => ({
                          ...prev,
                          permissions: { ...prev.permissions, masters: e.target.checked }
                        }))}
                        className="rounded accent-amber-500"
                      />
                      Masters CRUD
                    </label>

                    <label className="flex items-center gap-2 text-slate-300 hover:text-slate-100 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={roleForm.permissions.tasks}
                        onChange={e => setRoleForm(prev => ({
                          ...prev,
                          permissions: { ...prev.permissions, tasks: e.target.checked }
                        }))}
                        className="rounded accent-amber-500"
                      />
                      Task Scheduling
                    </label>

                    <label className="flex items-center gap-2 text-slate-300 hover:text-slate-100 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={roleForm.permissions.reports}
                        onChange={e => setRoleForm(prev => ({
                          ...prev,
                          permissions: { ...prev.permissions, reports: e.target.checked }
                        }))}
                        className="rounded accent-amber-500"
                      />
                      Reports Tab
                    </label>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  {editingId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(null);
                        setRoleForm({
                          name: "", description: "", remarks: "",
                          permissions: { adminPanel: false, hodPanel: true, userPanel: true, masters: false, tasks: true, reports: true }
                        });
                      }}
                      className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium py-2 rounded-xl transition-colors"
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    type="submit"
                    className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-2 rounded-xl transition-all"
                  >
                    {editingId ? "Update Role" : "Create Role"}
                  </button>
                </div>
              </form>
            </div>

            {/* List */}
            <div className="lg:col-span-2 space-y-4">
              <h3 className="font-semibold text-slate-200 text-sm flex items-center gap-1.5">
                <Shield className="h-4 w-4 text-slate-400" />
                Active Security Groups & Permissions
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {roles.map(r => (
                  <div key={r.id} className="bg-slate-950 p-4 rounded-xl border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between border-b border-slate-900 pb-2 mb-2">
                        <div>
                          <h4 className="font-bold text-slate-200">{r.name}</h4>
                          <span className="text-[10px] text-slate-500 italic mt-0.5 block">{r.remarks}</span>
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleEditRole(r)}
                            className="p-1 text-slate-400 hover:text-amber-500 hover:bg-amber-500/10 rounded-lg transition-all"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteRole(r.id)}
                            className="p-1 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                      <p className="text-slate-400 text-[11px] leading-relaxed mb-4">{r.description}</p>
                    </div>

                    <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                      <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider block mb-1.5">Allowed Modules:</span>
                      <div className="flex flex-wrap gap-1.5 text-[10px]">
                        {Object.entries(r.permissions).map(([key, val]) => (
                          <span
                            key={key}
                            className={`px-2 py-0.5 rounded-full border font-mono ${
                              val 
                                ? "bg-amber-500/10 text-amber-400 border-amber-500/20" 
                                : "bg-slate-800/40 text-slate-600 border-slate-800/60 font-normal"
                            }`}
                          >
                            {key.replace(/([A-Z])/g, " $1").toLowerCase()}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: REPORTS SUITE */}
        {activeTab === "reports" && (
          <div className="space-y-6 flex-1 flex flex-col text-xs">
            {/* Reports Navigation Row */}
            <div className="flex border-b border-slate-800 pb-px">
              <button
                onClick={() => setReportSubTab("task-report")}
                className={`px-5 py-2.5 font-semibold text-xs border-b-2 transition-all ${
                  reportSubTab === "task-report" ? "border-amber-500 text-slate-100 bg-slate-950/20" : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                1. General Task Report
              </button>
              <button
                onClick={() => setReportSubTab("completed-task")}
                className={`px-5 py-2.5 font-semibold text-xs border-b-2 transition-all ${
                  reportSubTab === "completed-task" ? "border-amber-500 text-slate-100 bg-slate-950/20" : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                2. Completed Tasks Report
              </button>
              <button
                onClick={() => setReportSubTab("performance")}
                className={`px-5 py-2.5 font-semibold text-xs border-b-2 transition-all ${
                  reportSubTab === "performance" ? "border-amber-500 text-slate-100 bg-slate-950/20" : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                3. User Performance Audit
              </button>
            </div>

            {/* REPORT 1: GENERAL TASK REPORT */}
            {reportSubTab === "task-report" && (
              <div className="space-y-4 flex-1 flex flex-col">
                {/* Filters */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                  <div className="space-y-1.5">
                    <label className="text-slate-400 font-medium flex items-center gap-1">
                      <Filter className="h-3.5 w-3.5 text-amber-500" /> Filter by Employee
                    </label>
                    <select
                      value={taskRepFilterUser}
                      onChange={e => setTaskRepFilterUser(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 text-slate-200 px-3 py-1.5 rounded-lg focus:outline-none focus:border-amber-500"
                    >
                      <option value="all">-- All Corporate Employees --</option>
                      {users.map(u => (
                        <option key={u.id} value={u.id}>{u.fullName}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-slate-400 font-medium flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 text-amber-500" /> Creation Date Range (Start)
                    </label>
                    <input
                      type="date"
                      value={taskRepFilterStart}
                      onChange={e => setTaskRepFilterStart(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 text-slate-200 px-3 py-1.5 rounded-lg focus:outline-none focus:border-amber-500 font-mono text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-slate-400 font-medium flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 text-amber-500" /> Creation Date Range (End)
                    </label>
                    <input
                      type="date"
                      value={taskRepFilterEnd}
                      onChange={e => setTaskRepFilterEnd(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 text-slate-200 px-3 py-1.5 rounded-lg focus:outline-none focus:border-amber-500 font-mono text-xs"
                    />
                  </div>
                </div>

                {/* Table Header and Export to Excel */}
                <div className="flex items-center justify-between pt-2">
                  <h4 className="font-semibold text-slate-400 text-xs uppercase tracking-wider">
                    General Task Records ({filteredTasksReport.length})
                  </h4>
                  <button
                    type="button"
                    onClick={handleExportGeneralTaskReportToExcel}
                    className="bg-emerald-600 hover:bg-emerald-500 text-slate-950 px-3.5 py-1.5 rounded-lg font-black text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Export General Task Report to Excel"
                  >
                    <Download className="h-4 w-4 text-slate-950 font-black" />
                    Export to Excel
                  </button>
                </div>

                {/* Table */}
                <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/40 flex-1">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-950/80 text-slate-400 font-medium uppercase tracking-wider text-[11px]">
                        <th className="px-4 py-3">Task Name</th>
                        <th className="px-4 py-3">Project</th>
                        <th className="px-4 py-3">Allocated To</th>
                        <th className="px-4 py-3">Supervisor</th>
                        <th className="px-4 py-3 text-center">Creation Date</th>
                        <th className="px-4 py-3 text-center">Estimated Hrs</th>
                        <th className="px-4 py-3 text-center">Actual Logged Hrs</th>
                        <th className="px-4 py-3">Status / Progress</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-slate-300">
                      {filteredTasksReport.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="text-center py-12 text-slate-500 font-medium">
                            No tasks match your selected filters.
                          </td>
                        </tr>
                      ) : (
                        filteredTasksReport.map(task => {
                          const actual = getTaskTotalActualHours(task.id);
                          return (
                            <tr key={task.id} className="hover:bg-slate-800/10 transition-colors">
                              <td className="px-4 py-3.5 font-medium text-slate-200">{task.name}</td>
                              <td className="px-4 py-3.5 text-slate-400">{getProjectName(task.projectId)}</td>
                              <td className="px-4 py-3.5 font-medium text-slate-300">{getUserFullName(task.assignedUserId)}</td>
                              <td className="px-4 py-3.5 text-slate-400">{getUserFullName(task.responsibleUserId)}</td>
                              <td className="px-4 py-3.5 text-center font-mono text-slate-400">
                                {new Date(task.createdDate).toLocaleDateString()}
                              </td>
                              <td className="px-4 py-3.5 text-center font-mono text-slate-400">{task.estimatedHours} hrs</td>
                              <td className="px-4 py-3.5 text-center font-mono">
                                <span className={actual > task.estimatedHours ? "text-rose-400 font-semibold" : "text-emerald-400"}>
                                  {actual} hrs
                                </span>
                              </td>
                              <td className="px-4 py-3.5">
                                <div className="flex items-center gap-2 max-w-[140px]">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                                    task.status === "Completed" ? "bg-emerald-500/15 text-emerald-400" :
                                    task.status === "In Progress" ? "bg-amber-500/15 text-amber-400" :
                                    "bg-slate-800 text-slate-400"
                                  }`}>
                                    {task.status}
                                  </span>
                                  <span className="font-mono text-[10px] text-slate-400">{task.percentage}%</span>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* REPORT 2: COMPLETED TASKS REPORT */}
            {reportSubTab === "completed-task" && (
              <div className="space-y-4 flex-1 flex flex-col">
                {/* Filters */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                  <div className="space-y-1.5">
                    <label className="text-slate-400 font-medium flex items-center gap-1">
                      <CheckCircle className="h-3.5 w-3.5 text-emerald-400" /> Minimum Progress %
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min="50"
                        max="100"
                        value={compFilterMinPct}
                        onChange={e => setCompFilterMinPct(Number(e.target.value))}
                        className="w-full accent-emerald-500"
                      />
                      <span className="font-mono text-slate-200 w-10 shrink-0 text-right">{compFilterMinPct}%</span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-slate-400 font-medium flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 text-emerald-400" /> Completion Date Range (Start)
                    </label>
                    <input
                      type="date"
                      value={compFilterStart}
                      onChange={e => setCompFilterStart(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 text-slate-200 px-3 py-1.5 rounded-lg focus:outline-none focus:border-emerald-500 font-mono text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-slate-400 font-medium flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 text-emerald-400" /> Completion Date Range (End)
                    </label>
                    <input
                      type="date"
                      value={compFilterEnd}
                      onChange={e => setCompFilterEnd(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 text-slate-200 px-3 py-1.5 rounded-lg focus:outline-none focus:border-emerald-500 font-mono text-xs"
                    />
                  </div>
                </div>

                {/* Table Header and Export to Excel */}
                <div className="flex items-center justify-between pt-2">
                  <h4 className="font-semibold text-slate-400 text-xs uppercase tracking-wider">
                    Completed Task Records ({completedTasksReport.length})
                  </h4>
                  <button
                    type="button"
                    onClick={handleExportCompletedTaskReportToExcel}
                    className="bg-emerald-600 hover:bg-emerald-500 text-slate-950 px-3.5 py-1.5 rounded-lg font-black text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Export Completed Tasks Report to Excel"
                  >
                    <Download className="h-4 w-4 text-slate-950 font-black" />
                    Export to Excel
                  </button>
                </div>

                {/* Table */}
                <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/40 flex-1">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-950/80 text-slate-400 font-medium uppercase tracking-wider text-[11px]">
                        <th className="px-4 py-3">Task Name</th>
                        <th className="px-4 py-3">Project</th>
                        <th className="px-4 py-3">Completed By</th>
                        <th className="px-4 py-3 text-center">Creation Date</th>
                        <th className="px-4 py-3 text-center">Completion Date</th>
                        <th className="px-4 py-3 text-center">Estimated Hrs</th>
                        <th className="px-4 py-3 text-center">Actual Spent Hrs</th>
                        <th className="px-4 py-3 text-center">Overrun / Saving</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-slate-300">
                      {completedTasksReport.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="text-center py-12 text-slate-500 font-medium">
                            No completed tasks match your criteria.
                          </td>
                        </tr>
                      ) : (
                        completedTasksReport.map(task => {
                          const actual = getTaskTotalActualHours(task.id);
                          const diff = task.estimatedHours - actual;
                          return (
                            <tr key={task.id} className="hover:bg-slate-800/10 transition-colors">
                              <td className="px-4 py-3.5 font-medium text-slate-200">
                                <span className="flex items-center gap-1.5">
                                  <CheckCircle className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                                  {task.name}
                                </span>
                              </td>
                              <td className="px-4 py-3.5 text-slate-400">{getProjectName(task.projectId)}</td>
                              <td className="px-4 py-3.5 font-medium text-slate-300">{getUserFullName(task.assignedUserId)}</td>
                              <td className="px-4 py-3.5 text-center font-mono text-slate-400">
                                {new Date(task.createdDate).toLocaleDateString()}
                              </td>
                              <td className="px-4 py-3.5 text-center font-mono text-slate-400">
                                {task.completedDate ? new Date(task.completedDate).toLocaleDateString() : "N/A"}
                              </td>
                              <td className="px-4 py-3.5 text-center font-mono text-slate-400">{task.estimatedHours} hrs</td>
                              <td className="px-4 py-3.5 text-center font-mono text-slate-300">{actual} hrs</td>
                              <td className="px-4 py-3.5 text-center font-mono">
                                {diff === 0 ? (
                                  <span className="text-slate-400">On Target</span>
                                ) : diff > 0 ? (
                                  <span className="text-emerald-400 font-semibold">-{diff} hrs (Saved)</span>
                                ) : (
                                  <span className="text-rose-400 font-semibold">+{Math.abs(diff)} hrs (Exceeded)</span>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* REPORT 3: USER PERFORMANCE REPORT */}
            {reportSubTab === "performance" && (
              <div className="space-y-6 flex-1 flex flex-col">
                {/* Filters */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                  <div className="space-y-1.5">
                    <label className="text-slate-400 font-medium flex items-center gap-1">
                      <Users className="h-3.5 w-3.5 text-indigo-400" /> Focus Employee
                    </label>
                    <select
                      value={perfFilterUser}
                      onChange={e => setPerfFilterUser(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 text-slate-200 px-3 py-1.5 rounded-lg focus:outline-none focus:border-amber-500"
                    >
                      <option value="all">-- All Employees --</option>
                      {users.map(u => (
                        <option key={u.id} value={u.id}>{u.fullName}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-slate-400 font-medium flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 text-indigo-400" /> Work Range (Start)
                    </label>
                    <input
                      type="date"
                      value={perfFilterStart}
                      onChange={e => setPerfFilterStart(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 text-slate-200 px-3 py-1.5 rounded-lg focus:outline-none focus:border-amber-500 font-mono text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-slate-400 font-medium flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 text-indigo-400" /> Work Range (End)
                    </label>
                    <input
                      type="date"
                      value={perfFilterEnd}
                      onChange={e => setPerfFilterEnd(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 text-slate-200 px-3 py-1.5 rounded-lg focus:outline-none focus:border-amber-500 font-mono text-xs"
                    />
                  </div>
                </div>

                {/* Table Header and Export to Excel */}
                <div className="flex items-center justify-between pt-2">
                  <h4 className="font-semibold text-slate-400 text-xs uppercase tracking-wider">
                    Employee Performance Audits ({performanceReportData.length})
                  </h4>
                  <button
                    type="button"
                    onClick={handleExportPerformanceAuditToExcel}
                    className="bg-emerald-600 hover:bg-emerald-500 text-slate-950 px-3.5 py-1.5 rounded-lg font-black text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Export User Performance Audit to Excel"
                  >
                    <Download className="h-4 w-4 text-slate-950 font-black" />
                    Export to Excel
                  </button>
                </div>

                {/* Audit Grid */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 flex-1">
                  {/* Performance Audit Metrics */}
                  <div className="xl:col-span-2 border border-slate-800 rounded-xl overflow-hidden bg-slate-950/40">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-800 bg-slate-950/80 text-slate-400 font-medium uppercase tracking-wider text-[11px]">
                          <th className="px-4 py-3">Employee Name</th>
                          <th className="px-4 py-3">Department</th>
                          <th className="px-4 py-3 text-center">Allocated Tasks</th>
                          <th className="px-4 py-3 text-center">Completed</th>
                          <th className="px-4 py-3 text-center">Est. Hours</th>
                          <th className="px-4 py-3 text-center">Actual Logged Hours</th>
                          <th className="px-4 py-3 text-center">Missed Stops</th>
                          <th className="px-4 py-3 text-center">Efficiency Score</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 text-slate-300">
                        {performanceReportData.map(row => (
                          <tr key={row.user.id} className="hover:bg-slate-800/10 transition-colors">
                            <td className="px-4 py-3.5 font-bold text-slate-200">{row.user.fullName}</td>
                            <td className="px-4 py-3.5 text-slate-400">{getDepartmentName(row.user.departmentId)}</td>
                            <td className="px-4 py-3.5 text-center font-mono font-semibold text-slate-300">{row.totalTasksCount}</td>
                            <td className="px-4 py-3.5 text-center font-mono text-emerald-400 font-semibold">{row.completedTasksCount}</td>
                            <td className="px-4 py-3.5 text-center font-mono text-slate-400">{row.totalEstHours} hrs</td>
                            <td className="px-4 py-3.5 text-center font-mono font-medium text-slate-300">{row.totalActHours} hrs</td>
                            <td className="px-4 py-3.5 text-center font-mono">
                              {row.autoStopCount > 0 ? (
                                <span className="inline-block bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full text-[10px]">
                                  ⚠ {row.autoStopCount} times
                                </span>
                              ) : (
                                <span className="text-slate-500">None</span>
                              )}
                            </td>
                            <td className="px-4 py-3.5 text-center">
                              <span className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-bold font-mono ${
                                row.efficiency >= 100 ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                                row.efficiency >= 70 ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                                row.efficiency > 0 ? "bg-rose-500/10 text-rose-400 border border-rose-500/20" :
                                "bg-slate-800 text-slate-500"
                              }`}>
                                {row.efficiency > 0 ? `${row.efficiency}%` : "No logs"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* VISUAL CHART (CUSTOM RESPONSIVE SVG GRAPHICS) */}
                  <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 flex flex-col justify-between">
                    <div>
                      <h4 className="font-semibold text-slate-200 text-sm flex items-center gap-1.5 mb-2">
                        <Award className="h-4 w-4 text-amber-500" />
                        Workload Allocations & Performance
                      </h4>
                      <p className="text-slate-500 text-[11px] leading-relaxed mb-6">
                        Graphical distribution of estimated workload hours vs. actual spent hours by registered employee.
                      </p>
                    </div>

                    {/* Chart Canvas */}
                    <div className="h-64 flex items-end gap-6 px-4 border-b border-slate-800 pb-2 relative">
                      {/* Grid Lines */}
                      <div className="absolute left-0 right-0 top-0 border-t border-slate-900 border-dashed"></div>
                      <div className="absolute left-0 right-0 top-1/4 border-t border-slate-900 border-dashed"></div>
                      <div className="absolute left-0 right-0 top-2/4 border-t border-slate-900 border-dashed"></div>
                      <div className="absolute left-0 right-0 top-3/4 border-t border-slate-900 border-dashed"></div>

                      {performanceReportData.map(row => {
                        const maxVal = Math.max(...performanceReportData.map(r => Math.max(r.totalEstHours, r.totalActHours)), 10);
                        const estPct = Math.round((row.totalEstHours / maxVal) * 100);
                        const actPct = Math.round((row.totalActHours / maxVal) * 100);

                        return (
                          <div key={row.user.id} className="flex-1 flex flex-col items-center gap-1 h-full justify-end relative group">
                            {/* Bar pair container */}
                            <div className="flex gap-2.5 items-end w-full max-w-[50px] h-full justify-center">
                              {/* Estimated Hours Bar */}
                              <div 
                                className="bg-amber-600/40 hover:bg-amber-600 w-3 rounded-t-md transition-all relative"
                                style={{ height: `${estPct}%` }}
                                title={`Estimated: ${row.totalEstHours} hrs`}
                              >
                                <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-900 border border-slate-800 text-[9px] font-mono rounded px-1 text-slate-300 opacity-0 group-hover:opacity-100 transition-all z-10 pointer-events-none">
                                  {row.totalEstHours}h
                                </div>
                              </div>
                              {/* Actual Logged Hours Bar */}
                              <div 
                                className="bg-emerald-500/40 hover:bg-emerald-500 w-3 rounded-t-md transition-all relative"
                                style={{ height: `${actPct}%` }}
                                title={`Actual: ${row.totalActHours} hrs`}
                              >
                                <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-900 border border-slate-800 text-[9px] font-mono rounded px-1 text-slate-300 opacity-0 group-hover:opacity-100 transition-all z-10 pointer-events-none">
                                  {row.totalActHours}h
                                </div>
                              </div>
                            </div>
                            <span className="text-[10px] text-slate-400 font-medium truncate w-14 text-center mt-2" title={row.user.fullName}>
                              {row.user.fullName.split(" ")[0]}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Chart Legend */}
                    <div className="flex items-center justify-center gap-6 text-[10px] text-slate-400 mt-5 bg-slate-900/50 p-3 rounded-xl border border-slate-800">
                      <span className="flex items-center gap-1.5 font-medium">
                        <span className="w-2.5 h-2.5 bg-amber-600/60 border border-amber-500 rounded-sm"></span>
                        Estimated Hours
                      </span>
                      <span className="flex items-center gap-1.5 font-medium">
                        <span className="w-2.5 h-2.5 bg-emerald-500/60 border border-emerald-400 rounded-sm"></span>
                        Actual Hours Worked
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
