export interface Role {
  id: string;
  name: string;
  description: string;
  remarks: string;
  permissions: {
    adminPanel: boolean;
    hodPanel: boolean;
    userPanel: boolean;
    masters: boolean;
    tasks: boolean;
    reports: boolean;
  };
}

export interface Department {
  id: string;
  name: string;
  description: string;
  remarks: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  remarks: string;
}

export interface User {
  id: string;
  fullName: string;
  employeeId: string;
  email: string;
  mobile: string;
  username: string;
  password?: string; // Kept secure
  departmentId: string; // Refers to Department.id
  roleId: string; // Refers to Role.id
  remarks: string;
}

export interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface Task {
  id: string;
  name: string;
  projectId: string; // Refers to Project.id
  parentTaskId: string | null; // Refers to Task.id (for nested/parent hierarchy)
  estimatedHours: number;
  todoList: TodoItem[];
  assignedUserId: string; // Refers to User.id
  responsibleUserId: string; // Refers to User.id
  description: string;
  attachmentName: string | null;
  attachmentData?: string | null; // base64 string
  status: 'Pending' | 'In Progress' | 'Completed';
  percentage: number; // 0 to 100
  createdDate: string; // ISO date-time
  completedDate: string | null; // ISO date-time
}

export interface TimeLog {
  id: string;
  taskId: string;
  userId: string;
  startTime: string; // ISO date-time
  endTime: string | null; // ISO date-time, null if running
  durationMinutes: number | null;
  percentageOnStop: number | null;
  isAutoStopped: boolean; // True if calculated as 6 hours due to missed stop
  notes?: string;
}
