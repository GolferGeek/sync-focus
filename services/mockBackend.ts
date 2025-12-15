import { AppData, Task, UserState, TimerStatus, GlobalTimer, Project } from '../types';

const WORK_TIME = 25 * 60;

// Initial Mock Data
const INITIAL_USERS: Record<string, UserState> = {
  'user-1': {
    userId: 'user-1',
    displayName: 'Alice Engineer',
    avatarUrl: 'https://ui-avatars.com/api/?name=Alice+Engineer&background=6366f1&color=fff',
    currentTaskId: 't1',
    currentTaskTitle: 'Refactor Auth Middleware',
    lastActive: Date.now(),
  },
  'user-2': {
    userId: 'user-2',
    displayName: 'Bob Designer',
    avatarUrl: 'https://ui-avatars.com/api/?name=Bob+Designer&background=10b981&color=fff',
    currentTaskId: null,
    currentTaskTitle: null,
    lastActive: Date.now() - 1000 * 60 * 5,
  },
};

const INITIAL_PROJECTS: Project[] = [
  { id: 'p1', name: 'Website Redesign', color: '#ec4899', createdAt: Date.now() },
  { id: 'p2', name: 'API Migration', color: '#6366f1', createdAt: Date.now() },
];

const INITIAL_TASKS: Task[] = [
  { id: 't1', title: 'Refactor Auth Middleware', projectId: 'p2', assigneeId: 'user-1', completed: false, createdAt: Date.now() },
  { id: 't2', title: 'Update API Documentation', projectId: 'p2', assigneeId: 'user-1', completed: true, createdAt: Date.now() - 10000 },
  { id: 't3', title: 'Design System Audit', projectId: 'p1', assigneeId: 'user-2', completed: false, createdAt: Date.now() },
  { id: 't4', title: 'Fix Navigation Bug', projectId: 'p1', assigneeId: undefined, completed: false, createdAt: Date.now() - 50000 },
];

const INITIAL_TIMER: GlobalTimer = {
  status: TimerStatus.IDLE,
  startTime: 0,
  endTime: 0,
  duration: WORK_TIME,
  remainingTimeStored: 0,
};

// Singleton to hold state
let state: AppData = {
  users: { ...INITIAL_USERS },
  projects: [...INITIAL_PROJECTS],
  tasks: [...INITIAL_TASKS],
  timer: { ...INITIAL_TIMER },
  authUserId: null,
};

type Listener = (data: AppData) => void;
const listeners: Set<Listener> = new Set();

const notify = () => {
  listeners.forEach((l) => l({ ...state }));
};

// Simulation of a backend service
export const backend = {
  subscribe: (callback: Listener) => {
    listeners.add(callback);
    callback({ ...state }); // Initial data
    return () => listeners.delete(callback);
  },

  // Auth Simulation
  signInWithGoogle: async () => {
    // Simulate generic login
    const newId = `user-me`;
    await backend.login("Demo User");
  },

  signInWithEmail: async (email: string) => {
     await backend.login(email.split('@')[0]);
  },

  signUpWithEmail: async (email: string, pass: string, name: string) => {
     await backend.login(name);
  },

  login: async (displayName: string): Promise<string> => {
    const newId = `user-me`;
    const newUser: UserState = {
      userId: newId,
      displayName,
      avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=random`,
      currentTaskId: null,
      currentTaskTitle: null,
      lastActive: Date.now(),
    };
    
    state.users[newId] = newUser;
    state.authUserId = newId;
    notify();
    return newId;
  },
  
  logout: async () => {
    state.authUserId = null;
    notify();
  },

  // --- Projects ---
  addProject: async (name: string, color: string) => {
    const newProject: Project = {
      id: `p-${Date.now()}`,
      name,
      color,
      createdAt: Date.now()
    };
    state.projects = [...state.projects, newProject];
    notify();
  },

  deleteProject: async (projectId: string) => {
    state.projects = state.projects.filter(p => p.id !== projectId);
    // Also cleanup tasks? keeping simple for mock
    notify();
  },

  // --- Tasks ---
  addTask: async (title: string, projectId?: string, assigneeId?: string) => {
    const newTask: Task = {
      id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title,
      projectId,
      assigneeId,
      completed: false,
      createdAt: Date.now(),
    };
    state.tasks = [newTask, ...state.tasks];
    notify();
  },

  toggleTask: async (taskId: string, currentStatus: boolean) => { // args for compatibility
    state.tasks = state.tasks.map(t => 
      t.id === taskId ? { ...t, completed: !t.completed } : t
    );
    notify();
  },

  deleteTask: async (taskId: string) => {
    state.tasks = state.tasks.filter(t => t.id !== taskId);
    
    // Clear active status if needed
    if (state.authUserId && state.users[state.authUserId]?.currentTaskId === taskId) {
      state.users[state.authUserId].currentTaskId = null;
      state.users[state.authUserId].currentTaskTitle = null;
    }
    notify();
  },

  assignTask: async (taskId: string, userId: string | null) => {
    state.tasks = state.tasks.map(t => 
      t.id === taskId ? { ...t, assigneeId: userId || undefined } : t
    );
    notify();
  },

  // --- User State ---
  updateUserTask: async (userId: string, taskId: string | null, taskTitle: string | null = null) => {
    if (state.users[userId]) {
      state.users[userId] = {
        ...state.users[userId],
        currentTaskId: taskId,
        currentTaskTitle: taskTitle,
        lastActive: Date.now(),
      };
      notify();
    }
  },

  updateActivity: async (userId: string) => {
    if (state.users[userId]) {
      state.users[userId].lastActive = Date.now();
      notify();
    }
  },

  // --- Timer Controls ---
  startTimer: async (duration: number, type: TimerStatus) => {
    const now = Date.now();
    state.timer = {
      status: type,
      startTime: now,
      endTime: now + (duration * 1000),
      duration: duration,
      remainingTimeStored: 0,
    };
    notify();
  },

  pauseTimer: async () => {
    if (state.timer.status === TimerStatus.WORK || state.timer.status === TimerStatus.BREAK) {
      const now = Date.now();
      const remaining = Math.max(0, Math.ceil((state.timer.endTime - now) / 1000));
      state.timer = {
        ...state.timer,
        status: TimerStatus.PAUSED,
        remainingTimeStored: remaining,
      };
      notify();
    }
  },

  resumeTimer: async () => {
    if (state.timer.status === TimerStatus.PAUSED) {
      const now = Date.now();
      const isBreak = state.timer.duration === 5 * 60;
      state.timer = {
        ...state.timer,
        status: isBreak ? TimerStatus.BREAK : TimerStatus.WORK,
        startTime: now - ((state.timer.duration - state.timer.remainingTimeStored) * 1000),
        endTime: now + (state.timer.remainingTimeStored * 1000),
        remainingTimeStored: 0,
      };
      notify();
    }
  },

  stopTimer: async () => {
    state.timer = { ...INITIAL_TIMER };
    notify();
  },

  completeTimer: async () => {
    if (state.timer.status === TimerStatus.WORK) {
      // Start Break
      const breakDuration = 5 * 60;
      const now = Date.now();
      state.timer = {
        status: TimerStatus.BREAK,
        startTime: now,
        endTime: now + (breakDuration * 1000),
        duration: breakDuration,
        remainingTimeStored: 0,
      };
    } else {
      // End of Break -> Idle
      state.timer = { ...INITIAL_TIMER };
    }
    notify();
  }
};