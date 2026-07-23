import React, { useState, useEffect, useRef } from "react";
import { isRemoteEnabled } from "./lib/supabaseClient";
import { loadAllRemote, saveRemote } from "./lib/remoteStore";
import {
  DEFAULT_ROLES,
  DEFAULT_DEPARTMENTS, 
  DEFAULT_PROJECTS, 
  DEFAULT_USERS, 
  DEFAULT_TASKS, 
  DEFAULT_TIMELOGS 
} from "./seedData";
import { Role, Department, Project, User, Task, TimeLog } from "./types";
import AdminPanel from "./components/AdminPanel";
import HodPanel from "./components/HodPanel";
import UserPanel from "./components/UserPanel";
import AiAnalytics from "./components/AiAnalytics";
import { 
  Shield, 
  Building2, 
  Users, 
  Sparkles, 
  User as UserIcon, 
  Briefcase,
  Layers,
  LogOut,
  ChevronDown,
  Clock,
  Settings,
  RefreshCw
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function App() {
  // Load State from LocalStorage or Fallback to SeedData
  const [roles, setRoles] = useState<Role[]>(() => {
    const saved = localStorage.getItem("tracker_roles");
    return saved ? JSON.parse(saved) : DEFAULT_ROLES;
  });

  const [departments, setDepartments] = useState<Department[]>(() => {
    const saved = localStorage.getItem("tracker_departments");
    return saved ? JSON.parse(saved) : DEFAULT_DEPARTMENTS;
  });

  const [projects, setProjects] = useState<Project[]>(() => {
    const saved = localStorage.getItem("tracker_projects");
    return saved ? JSON.parse(saved) : DEFAULT_PROJECTS;
  });

  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem("tracker_users");
    return saved ? JSON.parse(saved) : DEFAULT_USERS;
  });

  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem("tracker_tasks");
    return saved ? JSON.parse(saved) : DEFAULT_TASKS;
  });

  const [timeLogs, setTimeLogs] = useState<TimeLog[]>(() => {
    const saved = localStorage.getItem("tracker_timeLogs");
    return saved ? JSON.parse(saved) : DEFAULT_TIMELOGS;
  });

  // Active logged-in user persona
  const [activeUserId, setActiveUserId] = useState<string>(() => {
    const saved = localStorage.getItem("tracker_active_user");
    return saved || DEFAULT_USERS[0].id; // Defaults to Admin Subrata
  });

  // Active Top-Level View Tab
  const [activeTab, setActiveTab] = useState<"admin" | "hod" | "user" | "ai">("user");
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  // Becomes true once we've loaded shared data from Supabase (or confirmed it's
  // disabled). We must NOT push local defaults to the cloud before hydration,
  // otherwise the first browser to open would overwrite everyone else's data.
  const hydratedRef = useRef(false);

  // One-time hydration from Supabase = the shared, multi-user source of truth.
  // For any collection missing in the cloud, we seed it from current state.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!isRemoteEnabled) {
        hydratedRef.current = true;
        return;
      }
      try {
        const remote = await loadAllRemote();
        if (cancelled) return;
        remote.roles ? setRoles(remote.roles as Role[]) : saveRemote("roles", roles);
        remote.departments ? setDepartments(remote.departments as Department[]) : saveRemote("departments", departments);
        remote.projects ? setProjects(remote.projects as Project[]) : saveRemote("projects", projects);
        remote.users ? setUsers(remote.users as User[]) : saveRemote("users", users);
        remote.tasks ? setTasks(remote.tasks as Task[]) : saveRemote("tasks", tasks);
        remote.timeLogs ? setTimeLogs(remote.timeLogs as TimeLog[]) : saveRemote("timeLogs", timeLogs);
      } catch (err) {
        console.error("[App] remote hydration failed, using local data:", err);
      } finally {
        hydratedRef.current = true;
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync back to local storage (offline cache) AND Supabase (shared) on changes.
  useEffect(() => {
    localStorage.setItem("tracker_roles", JSON.stringify(roles));
    if (hydratedRef.current) saveRemote("roles", roles);
  }, [roles]);

  useEffect(() => {
    localStorage.setItem("tracker_departments", JSON.stringify(departments));
    if (hydratedRef.current) saveRemote("departments", departments);
  }, [departments]);

  useEffect(() => {
    localStorage.setItem("tracker_projects", JSON.stringify(projects));
    if (hydratedRef.current) saveRemote("projects", projects);
  }, [projects]);

  useEffect(() => {
    localStorage.setItem("tracker_users", JSON.stringify(users));
    if (hydratedRef.current) saveRemote("users", users);
  }, [users]);

  useEffect(() => {
    localStorage.setItem("tracker_tasks", JSON.stringify(tasks));
    if (hydratedRef.current) saveRemote("tasks", tasks);
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem("tracker_timeLogs", JSON.stringify(timeLogs));
    if (hydratedRef.current) saveRemote("timeLogs", timeLogs);
  }, [timeLogs]);

  useEffect(() => {
    localStorage.setItem("tracker_active_user", activeUserId);
  }, [activeUserId]);

  // Resolve current user info
  const activeUser = users.find(u => u.id === activeUserId) || users[0] || DEFAULT_USERS[0];
  const activeRole = roles.find(r => r.id === activeUser.roleId);
  const activeDept = departments.find(d => d.id === activeUser.departmentId);

  // Auto route tab on active user change to prevent permission violations
  useEffect(() => {
    if (activeRole) {
      if (activeRole.permissions.adminPanel) {
        setActiveTab("admin");
      } else if (activeRole.permissions.hodPanel) {
        setActiveTab("hod");
      } else {
        setActiveTab("user");
      }
    }
  }, [activeUserId, activeRole]);

  // Quick reset factory defaults helper
  const handleResetToFactory = () => {
    if (window.confirm("This will erase all active edits and restore original corporate master files. Continue?")) {
      localStorage.clear();
      setRoles(DEFAULT_ROLES);
      setDepartments(DEFAULT_DEPARTMENTS);
      setProjects(DEFAULT_PROJECTS);
      setUsers(DEFAULT_USERS);
      setTasks(DEFAULT_TASKS);
      setTimeLogs(DEFAULT_TIMELOGS);
      setActiveUserId(DEFAULT_USERS[0].id);
      setActiveTab("admin");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col">
      {/* PERSUASIVE TOP BAR / CORPORATE HEADER */}
      <header className="bg-slate-900/60 border-b border-slate-800/80 backdrop-blur-md sticky top-0 z-40 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-gradient-to-tr from-amber-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/10">
            <Layers className="h-5 w-5 text-slate-950 font-bold" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold tracking-tight text-slate-100 text-sm">Enterprise Task tracker</span>
              <span className="bg-amber-500/10 text-amber-400 font-mono text-[9px] font-bold px-1.5 py-0.5 rounded border border-amber-500/20">v2.4</span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono block">Integrated Masters & Time Capture Suite</span>
          </div>
        </div>

        {/* INTERACTIVE ROLE PERSPECTIVE SWITCHER */}
        <div className="flex items-center gap-4">
          <div className="relative">
            <button
              id="dropdown-user-persona-trigger"
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              className="bg-slate-950 hover:bg-slate-850 border border-slate-800 px-3.5 py-2 rounded-xl flex items-center gap-2.5 transition-all text-xs text-left cursor-pointer"
            >
              <div className="h-6 w-6 bg-slate-800 rounded-lg flex items-center justify-center shrink-0">
                <UserIcon className="h-3.5 w-3.5 text-amber-500" />
              </div>
              <div className="hidden sm:block">
                <div className="font-semibold text-slate-200">{activeUser.fullName}</div>
                <div className="text-[9px] text-slate-400 uppercase tracking-wider font-semibold flex items-center gap-1 mt-0.5">
                  <span className="w-1 h-1 bg-emerald-400 rounded-full"></span>
                  {activeRole?.name} ({activeDept?.name})
                </div>
              </div>
              <ChevronDown className="h-4 w-4 text-slate-500 shrink-0" />
            </button>

            {/* Dropdown body */}
            <AnimatePresence>
              {showUserDropdown && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowUserDropdown(false)}></div>
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden divide-y divide-slate-800/80 text-xs"
                  >
                    <div className="p-3.5 bg-slate-950/40">
                      <span className="text-[9px] font-bold uppercase text-slate-500 tracking-wider">Select Active Session Persona</span>
                    </div>

                    <div className="p-1 space-y-1">
                      {users.map(u => {
                        const r = roles.find(rl => rl.id === u.roleId);
                        const d = departments.find(dp => dp.id === u.departmentId);
                        return (
                          <button
                            key={u.id}
                            onClick={() => {
                              setActiveUserId(u.id);
                              setShowUserDropdown(false);
                            }}
                            className={`w-full text-left p-2.5 rounded-xl transition-all flex items-center gap-2 hover:bg-slate-800 ${
                              activeUserId === u.id ? "bg-slate-800/60 border border-slate-750 font-semibold" : "border border-transparent"
                            }`}
                          >
                            <div className="h-5 w-5 bg-slate-950 rounded flex items-center justify-center shrink-0">
                              <UserIcon className="h-3 w-3 text-slate-400" />
                            </div>
                            <div className="truncate">
                              <span className="block text-slate-200 truncate">{u.fullName}</span>
                              <span className="block text-[9px] text-slate-500 truncate">{r?.name} • {d?.name}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    <div className="p-1">
                      <button
                        onClick={() => {
                          handleResetToFactory();
                          setShowUserDropdown(false);
                        }}
                        className="w-full text-left p-2.5 rounded-xl hover:bg-rose-500/10 text-rose-400 hover:text-rose-300 transition-colors flex items-center gap-2 font-medium"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                        Reset Factory Defaults
                      </button>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* DASHBOARD TAB SELECTOR */}
      <div className="bg-slate-900 border-b border-slate-800 px-6 py-1 flex items-center justify-between text-xs">
        <div className="flex gap-1 overflow-x-auto py-1">
          {/* Admin tab (guarded) */}
          {activeRole?.permissions.adminPanel && (
            <button
              onClick={() => setActiveTab("admin")}
              className={`px-4 py-2.5 font-semibold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === "admin" ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/5 font-bold" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Shield className="h-4 w-4" />
              Corporate Admin Panel
            </button>
          )}

          {/* HOD tab (guarded) */}
          {activeRole?.permissions.hodPanel && (
            <button
              onClick={() => setActiveTab("hod")}
              className={`px-4 py-2.5 font-semibold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === "hod" ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/5 font-bold" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Building2 className="h-4 w-4" />
              HOD Panel
            </button>
          )}

          {/* User Workspace (available to all) */}
          {activeRole?.permissions.userPanel && (
            <button
              onClick={() => setActiveTab("user")}
              className={`px-4 py-2.5 font-semibold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === "user" ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/5 font-bold" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Clock className="h-4 w-4" />
              My Work Workspace
            </button>
          )}

          {/* AI Auditor Tab */}
          <button
            onClick={() => setActiveTab("ai")}
            className={`px-4 py-2.5 font-semibold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === "ai" ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/5 font-bold" : "text-slate-400 hover:text-slate-200 animate-pulse-subtle"
            }`}
          >
            <Sparkles className="h-4 w-4" />
            Gemini AI Time Copilot
          </button>
        </div>

        {/* Current system status indicator */}
        <div className="hidden md:flex items-center gap-2 text-[11px] text-slate-500 font-medium">
          <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
          <span>Security Context: {activeRole?.name}</span>
        </div>
      </div>

      {/* MAIN MODULE ROUTER CONTENT CONTAINER */}
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${activeTab}-${activeUserId}`}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.15 }}
            className="h-full"
          >
            {activeTab === "admin" && activeRole?.permissions.adminPanel && (
              <AdminPanel
                roles={roles}
                departments={departments}
                projects={projects}
                users={users}
                tasks={tasks}
                timeLogs={timeLogs}
                setRoles={setRoles}
                setDepartments={setDepartments}
                setProjects={setProjects}
                setUsers={setUsers}
                setTasks={setTasks}
                setTimeLogs={setTimeLogs}
              />
            )}

            {activeTab === "hod" && activeRole?.permissions.hodPanel && (
              <HodPanel
                activeUser={activeUser}
                roles={roles}
                departments={departments}
                projects={projects}
                users={users}
                tasks={tasks}
                timeLogs={timeLogs}
                setTasks={setTasks}
              />
            )}

            {activeTab === "user" && activeRole?.permissions.userPanel && (
              <UserPanel
                activeUser={activeUser}
                projects={projects}
                tasks={tasks}
                users={users}
                timeLogs={timeLogs}
                setTasks={setTasks}
                setTimeLogs={setTimeLogs}
              />
            )}

            {activeTab === "ai" && (
              <AiAnalytics
                projects={projects}
                tasks={tasks}
                users={users}
                timeLogs={timeLogs}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* BOTTOM FOOTER */}
      <footer className="bg-slate-950 py-6 border-t border-slate-900 mt-auto text-center text-[11px] text-slate-500">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-3">
          <span>Enterprise Task Management and Time Tracker © 2026. All corporate systems operational.</span>
          <div className="flex gap-4">
            <span>Server Ingress Inbound Port: 3000</span>
            <span>Platform Services Secured</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
