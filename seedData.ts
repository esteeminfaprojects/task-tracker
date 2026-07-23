import { Role, Department, Project, User, Task, TimeLog } from "./types";

export const DEFAULT_ROLES: Role[] = [
  {
    id: "role-admin",
    name: "Administrator",
    description: "Full system control with access to all masters, tasks, time tracking, and corporate intelligence reports.",
    remarks: "Default system administrator role.",
    permissions: {
      adminPanel: true,
      hodPanel: true,
      userPanel: true,
      masters: true,
      tasks: true,
      reports: true,
    },
  },
  {
    id: "role-hod",
    name: "Head of Department (HOD)",
    description: "Departmental monitoring, performance auditing, and direct task scheduling for team members.",
    remarks: "Assigned to department leaders.",
    permissions: {
      adminPanel: false,
      hodPanel: true,
      userPanel: true,
      masters: false,
      tasks: true,
      reports: true,
    },
  },
  {
    id: "role-user",
    name: "Standard Employee",
    description: "Access to personal workspace, direct task list, checkbox checklists, and active timer controls.",
    remarks: "Assigned to standard project personnel.",
    permissions: {
      adminPanel: false,
      hodPanel: false,
      userPanel: true,
      masters: false,
      tasks: false,
      reports: false,
    },
  },
];

export const DEFAULT_DEPARTMENTS: Department[] = [
  {
    id: "dept-eng",
    name: "Engineering & Dev",
    description: "Software design, DevOps infrastructure, and native platform engineering.",
    remarks: "Primary delivery department.",
  },
  {
    id: "dept-mkt",
    name: "Growth & Marketing",
    description: "User acquisition, digital brand management, and content creation.",
    remarks: "Primary creative department.",
  },
  {
    id: "dept-prod",
    name: "Product & UX",
    description: "Product discovery, user research, wireframing, and user experience engineering.",
    remarks: "Coordinates with Engineering and Growth.",
  },
  {
    id: "dept-hr",
    name: "People Ops & HR",
    description: "Talent acquisition, corporate culture, onboarding, and employee compliance.",
    remarks: "Operational support department.",
  },
];

export const DEFAULT_PROJECTS: Project[] = [
  {
    id: "proj-alpha",
    name: "Enterprise Core Portal",
    description: "Rebuilding the core web service into a high-performance modern React application.",
    remarks: "High-priority corporate initiative.",
  },
  {
    id: "proj-beta",
    name: "Growth Acquisition Web",
    description: "Optimizing landing pages and inbound conversion funnels for global audiences.",
    remarks: "Quarterly marketing goal.",
  },
  {
    id: "proj-gamma",
    name: "Native Mobile Suite",
    description: "Delivering iOS and Android companion apps with fully synchronized offline features.",
    remarks: "Next-phase development product.",
  },
];

export const DEFAULT_USERS: User[] = [
  {
    id: "user-subrata",
    fullName: "Subrata Roy",
    employeeId: "EMP-001",
    email: "subrata.sup@gmail.com",
    mobile: "+1 (555) 019-9231",
    username: "admin",
    password: "password",
    departmentId: "dept-eng",
    roleId: "role-admin",
    remarks: "System Super User / Administrator",
  },
  {
    id: "user-sarah",
    fullName: "Sarah Chen",
    employeeId: "EMP-002",
    email: "sarah.chen@company.com",
    mobile: "+1 (555) 014-4902",
    username: "hod_eng",
    password: "password",
    departmentId: "dept-eng",
    roleId: "role-hod",
    remarks: "Engineering Lead & HOD",
  },
  {
    id: "user-marcus",
    fullName: "Marcus Aurelius",
    employeeId: "EMP-003",
    email: "marcus.a@company.com",
    mobile: "+1 (555) 017-7201",
    username: "hod_mkt",
    password: "password",
    departmentId: "dept-mkt",
    roleId: "role-hod",
    remarks: "Marketing Director & HOD",
  },
  {
    id: "user-alice",
    fullName: "Alice Dev",
    employeeId: "EMP-004",
    email: "alice.dev@company.com",
    mobile: "+1 (555) 012-3456",
    username: "alice",
    password: "password",
    departmentId: "dept-eng",
    roleId: "role-user",
    remarks: "Full-Stack Software Engineer",
  },
  {
    id: "user-bob",
    fullName: "Bob Creative",
    employeeId: "EMP-005",
    email: "bob.designer@company.com",
    mobile: "+1 (555) 015-6789",
    username: "bob",
    password: "password",
    departmentId: "dept-prod",
    roleId: "role-user",
    remarks: "Lead UX Designer",
  },
];

// Helper to get ISO dates in relation to current time
const getDateOffset = (days: number, hours: number = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(d.getHours() + hours);
  return d.toISOString();
};

export const DEFAULT_TASKS: Task[] = [
  {
    id: "task-1",
    name: "Architect RESTful API Layer",
    projectId: "proj-alpha",
    parentTaskId: null,
    estimatedHours: 12,
    todoList: [
      { id: "todo-1-1", text: "Design database schemas", completed: true },
      { id: "todo-1-2", text: "Configure JWT authentication token strategy", completed: true },
      { id: "todo-1-3", text: "Implement secure API rate limiting", completed: false },
      { id: "todo-1-4", text: "Draft comprehensive OpenAPI swagger specs", completed: false },
    ],
    assignedUserId: "user-alice",
    responsibleUserId: "user-sarah",
    description: "Create an enterprise-grade backend API structure utilizing secure standards. Must coordinate with the UX wireframes and security teams.",
    attachmentName: "api_spec_v2.json",
    attachmentData: "eyJhY3Rpb24iOiAiYXBpX3NwZWMiLCAidmVyc2lvbiI6ICIyLjAifQ==",
    status: "In Progress",
    percentage: 55,
    createdDate: getDateOffset(-5),
    completedDate: null,
  },
  {
    id: "task-2",
    name: "Establish Global Design Tokens",
    projectId: "proj-beta",
    parentTaskId: null,
    estimatedHours: 8,
    todoList: [
      { id: "todo-2-1", text: "Define color palettes (Slate, Amber, Emerald)", completed: true },
      { id: "todo-2-2", text: "Map typography scaling rules (Heading vs Body)", completed: true },
      { id: "todo-2-3", text: "Deliver visual spacing scale guides", completed: true },
    ],
    assignedUserId: "user-bob",
    responsibleUserId: "user-marcus",
    description: "Translate core brand guidelines into clean, structured tailwind utility configurations and visual standards for the marketing site.",
    attachmentName: "brand_tokens.pdf",
    attachmentData: "JSVGRi0xLjQKJ... [Simulated Brand Guide]",
    status: "Completed",
    percentage: 100,
    createdDate: getDateOffset(-7),
    completedDate: getDateOffset(-3),
  },
  {
    id: "task-3",
    name: "Configure Multi-Region Cloud Deployment",
    projectId: "proj-alpha",
    parentTaskId: "task-1", // Subtask of API Layer
    estimatedHours: 6,
    todoList: [
      { id: "todo-3-1", text: "Write Dockerfile configuration", completed: true },
      { id: "todo-3-2", text: "Set up Cloud Run multi-region routing", completed: true },
      { id: "todo-3-3", text: "Verify CDN edge caching headers", completed: true },
    ],
    assignedUserId: "user-alice",
    responsibleUserId: "user-sarah",
    description: "Ensure the backend application is distributed across multiple instances with minimal server cold-starts.",
    attachmentName: null,
    status: "Completed",
    percentage: 100,
    createdDate: getDateOffset(-3),
    completedDate: getDateOffset(-1),
  },
  {
    id: "task-4",
    name: "Draft High-Fidelity App Wireframes",
    projectId: "proj-gamma",
    parentTaskId: null,
    estimatedHours: 16,
    todoList: [
      { id: "todo-4-1", text: "Design user profile screens", completed: false },
      { id: "todo-4-2", text: "Design offline synchronization settings interface", completed: false },
      { id: "todo-4-3", text: "Create interactive clickable prototype", completed: false },
    ],
    assignedUserId: "user-bob",
    responsibleUserId: "user-marcus",
    description: "Create polished Figma prototypes for stakeholder preview before kicking off the mobile suite project.",
    attachmentName: "gamma_wireframes.fig",
    status: "Pending",
    percentage: 0,
    createdDate: getDateOffset(-1),
    completedDate: null,
  }
];

export const DEFAULT_TIMELOGS: TimeLog[] = [
  // Completed logs for Bob (task 2)
  {
    id: "log-1",
    taskId: "task-2",
    userId: "user-bob",
    startTime: getDateOffset(-6, -8), // 6 days ago, started in morning
    endTime: getDateOffset(-6, -4), // worked 4 hours
    durationMinutes: 240,
    percentageOnStop: 50,
    isAutoStopped: false,
    notes: "Completed color mapping and corporate typography styling",
  },
  {
    id: "log-2",
    taskId: "task-2",
    userId: "user-bob",
    startTime: getDateOffset(-5, -7), // 5 days ago, started in morning
    endTime: getDateOffset(-5, -2), // worked 5 hours
    durationMinutes: 300,
    percentageOnStop: 100,
    isAutoStopped: false,
    notes: "Finalized interactive brand tokens and visual guidelines manual.",
  },
  // Completed logs for Alice (task 3)
  {
    id: "log-3",
    taskId: "task-3",
    userId: "user-alice",
    startTime: getDateOffset(-2, -6),
    endTime: getDateOffset(-2, -1.5), // worked 4.5 hours
    durationMinutes: 270,
    percentageOnStop: 100,
    isAutoStopped: false,
    notes: "Configured multi-region ingress routing and deployment configs.",
  },
  // Missed stop log for Alice (task 1) to showcase the 6-hour AI rule!
  {
    id: "log-4",
    taskId: "task-1",
    userId: "user-alice",
    startTime: getDateOffset(-4, -9), // Started 4 days ago at 9am
    endTime: null, // Missed stop, will be auto-processed as 6 hours (360 mins)
    durationMinutes: null, 
    percentageOnStop: null,
    isAutoStopped: true, // Auto-flagged
    notes: "Database structure design. (Auto-stopped by system - 6 Hrs limit applied)",
  },
  // Completed log that actually exceeded estimated hours slightly to show under/over in performance
  {
    id: "log-5",
    taskId: "task-1",
    userId: "user-alice",
    startTime: getDateOffset(-3, -8),
    endTime: getDateOffset(-3, -2), // 6 hours
    durationMinutes: 360,
    percentageOnStop: 40,
    isAutoStopped: false,
    notes: "Coded standard JWT strategy and integrated token refreshes.",
  }
];
