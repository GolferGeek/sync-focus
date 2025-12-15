export enum TimerStatus {
  IDLE = 'IDLE',
  WORK = 'WORK',
  BREAK = 'BREAK',
  PAUSED = 'PAUSED',
}

export interface Project {
  id: string;
  name: string;
  color: string; // Hex code
  createdAt: number;
}

export interface Task {
  id: string;
  title: string;
  projectId?: string;
  assigneeId?: string; // null = unassigned (anyone can pick up)
  completed: boolean;
  createdAt: number;
}

export interface GlobalTimer {
  status: TimerStatus;
  startTime: number;
  endTime: number;
  duration: number;
  remainingTimeStored: number;
}

export interface UserState {
  userId: string;
  displayName: string;
  email?: string;
  avatarUrl: string; 
  currentTaskId: string | null; 
  currentTaskTitle: string | null;
  lastActive: number;
}

// Representing the "Backend" data structure
export interface AppData {
  users: Record<string, UserState>;
  projects: Project[];
  tasks: Task[]; // Flat list of all shared tasks
  timer: GlobalTimer;
  authUserId: string | null;
}

export interface TimerConfig {
  workDuration: number;
  breakDuration: number;
}