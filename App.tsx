import React, { useState, useEffect, useRef } from "react";
import { isRemoteEnabled } from "./supabaseClient";
import { loadAllRemote, saveRemote } from "./remoteStore";
import {
  DEFAULT_ROLES,
  DEFAULT_DEPARTMENTS, 
  DEFAULT_PROJECTS, 
  DEFAULT_USERS, 
  DEFAULT_TASKS, 
  DEFAULT_TIMELOGS 
} from "./seedData";
import { Role, Department, Project, User, Task, TimeLog } from "./types";
import AdminPanel from "./AdminPanel";
import HodPanel from "./HodPanel";
import UserPanel from "./UserPanel";
import AiAnalytics from "./AiAnalytics";
import LoginScreen from "./LoginScreen";
import CompanyLogo from "./CompanyLogo";
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
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem("tracker_auth_session") === "true";
  });

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
    const saved = localStorage.getItem("tracker_users_v2");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.some(u => u.username === "subrata@dril.net.in")) {
          return parsed;
        }
      } catch (e) {
        console.error("Failed to parse saved users", e);
      }
    }
    return DEFAULT_USERS;
  });

  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem("tracker_tasks_v2");
    return saved ? JSON.parse(saved) : DEFAULT_TASKS;
  });

  const [timeLogs, setTimeLogs] = useState<TimeLog[]>(() => {
    const saved = localStorage.getItem("tracker_timeLogs_v2");
    return saved ? JSON.parse(saved) : DEFAULT_TIMELOGS;
  });

  // Active logged-in user persona
  const [activeUserId, setActiveUserId] = useState<string>(() => {
    const saved = localStorage.getItem("tracker_active_user");
    return saved || "user-subrata";
  });

  // Active Top-Level View Tab
  const [activeTab, setActiveTab] = useState<"admin" | "hod" | "user" | "ai">("user");
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  // Becomes true once shared data has loaded (or Supabase is confirmed off).
  // Prevents pushing local defaults to the cloud before we've read it.
  const hydratedRef = useRef(false);

  // One-time hydration from Supabase = shared source of truth across all
  // browsers/devices. Missing collections are seeded from current state.
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
    localStorage.setItem("tracker_users_v2", JSON.stringify(users));
    if (hydratedRef.current) saveRemote("users", users);
  }, [users]);

  useEffect(() => {
    localStorage.setItem("tracker_tasks_v2", JSON.stringify(tasks));
    if (hydratedRef.current) saveRemote("tasks", tasks);
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem("tracker_timeLogs_v2", JSON.stringify(timeLogs));
    if (hydratedRef.current) saveRemote("timeLogs", timeLogs);
  }, [timeLogs]);

  useEffect(() => {
    localStorage.setItem("tracker_active_user", activeUserId);
  }, [activeUserId]);

  useEffect(() => {
    localStorage.setItem("tracker_auth_session", isAuthenticated ? "true" : "false");
  }, [isAuthenticated]);

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

  // Handle Logout
  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem("tracker_auth_session");
    setShowUserDropdown(false);
  };

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
      setIsAuthenticated(true);
    }
  };

  // If user is not logged in, render Login Screen
  if (!isAuthenticated) {
    return (
      <LoginScreen
        users={users}
        roles={roles}
        departments={departments}
        onLogin={(userId) => {
          setActiveUserId(userId);
          setIsAuthenticated(true);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col">
      {/* PERSUASIVE TOP BAR / CORPORATE HEADER */}
      <header className="bg-slate-900/60 border-b border-slate-800/80 backdrop-blur-md sticky top-0 z-40 px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CompanyLogo variant="header" theme="dark" />
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

                    <div className="p-1 space-y-1">
                      <button
                        onClick={handleLogout}
                        className="w-full text-left p-2.5 rounded-xl hover:bg-rose-500/10 text-rose-400 hover:text-rose-300 transition-colors flex items-center gap-2 font-semibold"
                      >
                        <LogOut className="h-3.5 w-3.5" />
                        Log Out Active Session
                      </button>
                      <button
                        onClick={() => {
                          handleResetToFactory();
                          setShowUserDropdown(false);
                        }}
                        className="w-full text-left p-2.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-slate-300 transition-colors flex items-center gap-2 font-medium"
                      >
                        <RefreshCw className="h-3.5 w-3.5 text-slate-500" />
                        Reset Factory Defaults
                      </button>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          <button
            onClick={handleLogout}
            className="bg-slate-900 hover:bg-rose-500/20 text-slate-300 hover:text-rose-300 border border-slate-800 hover:border-rose-500/30 px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all text-xs font-semibold cursor-pointer"
            title="Log Out of system"
          >
            <LogOut className="h-3.5 w-3.5 text-slate-400 group-hover:text-rose-300" />
            <span className="hidden sm:inline">Log Out</span>
          </button>
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
          <div className="flex flex-col sm:flex-row items-center gap-2">
            <CompanyLogo variant="footer" theme="dark" />
            <span className="hidden sm:inline text-slate-700">|</span>
            <span>Time & Task Management System © 2026</span>
          </div>
          <div className="flex gap-4">
            <span>Server Ingress Inbound Port: 3000</span>
            <span>Platform Services Secured</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
