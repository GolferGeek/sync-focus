import { 
  collection, 
  doc, 
  setDoc, 
  addDoc,
  deleteDoc,
  updateDoc, 
  onSnapshot, 
  query, 
  orderBy,
  where,
} from "firebase/firestore";
import { 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut, 
  onAuthStateChanged,
  updateProfile
} from "firebase/auth";
import { auth, db, googleProvider } from "./firebase";
import { AppData, Task, UserState, TimerStatus, GlobalTimer, Project } from "../types";

const TIMER_DOC_ID = 'timer';
const CONFIG_COLLECTION = 'config';

const DEFAULT_TIMER: GlobalTimer = {
  status: TimerStatus.IDLE,
  startTime: 0,
  endTime: 0,
  duration: 25 * 60,
  remainingTimeStored: 0,
};

// Initial State
let state: AppData = {
  users: {},
  projects: [],
  tasks: [],
  timer: DEFAULT_TIMER,
  authUserId: null,
};

type Listener = (data: AppData) => void;
const listeners: Set<Listener> = new Set();

const notify = () => {
  listeners.forEach((l) => l({ ...state }));
};

// Internal Unsubscribers
let unsubscribeTimer: (() => void) | null = null;
let unsubscribeUsers: (() => void) | null = null;
let unsubscribeProjects: (() => void) | null = null;
let unsubscribeTasks: (() => void) | null = null;

const initListeners = () => {
  // 1. Listen to Global Timer
  unsubscribeTimer = onSnapshot(doc(db, CONFIG_COLLECTION, TIMER_DOC_ID), (docSnap) => {
    if (docSnap.exists()) {
      state.timer = docSnap.data() as GlobalTimer;
    } else {
      setDoc(doc(db, CONFIG_COLLECTION, TIMER_DOC_ID), DEFAULT_TIMER);
      state.timer = DEFAULT_TIMER;
    }
    notify();
  });

  // 2. Listen to Users
  unsubscribeUsers = onSnapshot(query(collection(db, 'users'), orderBy('lastActive', 'desc')), (snapshot) => {
    const users: Record<string, UserState> = {};
    snapshot.forEach((doc) => {
      users[doc.id] = doc.data() as UserState;
    });
    state.users = users;
    notify();
  });

  // 3. Listen to Projects
  unsubscribeProjects = onSnapshot(query(collection(db, 'projects'), orderBy('createdAt', 'asc')), (snapshot) => {
    const projects: Project[] = [];
    snapshot.forEach((doc) => {
      projects.push({ ...doc.data(), id: doc.id } as Project);
    });
    state.projects = projects;
    notify();
  });

  // 4. Listen to All Shared Tasks
  // In a real app, you might only fetch incomplete tasks or paginate
  unsubscribeTasks = onSnapshot(query(collection(db, 'tasks'), orderBy('createdAt', 'desc')), (snapshot) => {
    const tasks: Task[] = [];
    snapshot.forEach((doc) => {
      tasks.push({ ...doc.data(), id: doc.id } as Task);
    });
    state.tasks = tasks;
    notify();
  });
};

// Auth State Listener
onAuthStateChanged(auth, async (user) => {
  if (user) {
    state.authUserId = user.uid;
    const userRef = doc(db, 'users', user.uid);
    await setDoc(userRef, {
      userId: user.uid,
      displayName: user.displayName || user.email?.split('@')[0] || 'Anonymous',
      email: user.email,
      avatarUrl: user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || 'User')}&background=random`,
      lastActive: Date.now(),
    }, { merge: true });
    
    if (!unsubscribeTimer) initListeners();
  } else {
    state.authUserId = null;
    state.projects = [];
    state.tasks = [];
    notify();
  }
});

export const backend = {
  subscribe: (callback: Listener) => {
    listeners.add(callback);
    callback({ ...state });
    return () => listeners.delete(callback);
  },

  signInWithGoogle: async () => {
    await signInWithPopup(auth, googleProvider);
  },

  signInWithEmail: async (email: string, pass: string) => {
    await signInWithEmailAndPassword(auth, email, pass);
  },

  signUpWithEmail: async (email: string, pass: string, name: string) => {
    const res = await createUserWithEmailAndPassword(auth, email, pass);
    if (res.user) {
      await updateProfile(res.user, { displayName: name });
    }
  },

  logout: async () => {
    await signOut(auth);
  },

  // --- Project Methods ---
  addProject: async (name: string, color: string) => {
    await addDoc(collection(db, 'projects'), {
      name,
      color,
      createdAt: Date.now()
    });
  },

  deleteProject: async (projectId: string) => {
    // Note: In production, you'd also want to delete all tasks associated with this project
    await deleteDoc(doc(db, 'projects', projectId));
  },

  // --- Task Methods ---
  addTask: async (title: string, projectId?: string, assigneeId?: string) => {
    const newTask = {
      title,
      projectId: projectId || null,
      assigneeId: assigneeId || null, // null means unassigned
      completed: false,
      createdAt: Date.now(),
    };
    await addDoc(collection(db, 'tasks'), newTask);
    if (state.authUserId) backend.updateActivity(state.authUserId);
  },

  toggleTask: async (taskId: string, currentStatus: boolean) => {
    await updateDoc(doc(db, 'tasks', taskId), {
      completed: !currentStatus
    });
    if (state.authUserId) backend.updateActivity(state.authUserId);
  },

  assignTask: async (taskId: string, userId: string | null) => {
    await updateDoc(doc(db, 'tasks', taskId), {
      assigneeId: userId
    });
  },

  deleteTask: async (taskId: string) => {
    await deleteDoc(doc(db, 'tasks', taskId));
    
    // If active task, clear status
    if (state.authUserId && state.users[state.authUserId]?.currentTaskId === taskId) {
      backend.updateUserTask(state.authUserId, null, null);
    }
  },

  // --- User State ---
  updateUserTask: async (userId: string, taskId: string | null, taskTitle: string | null) => {
    await updateDoc(doc(db, 'users', userId), {
      currentTaskId: taskId,
      currentTaskTitle: taskTitle,
      lastActive: Date.now()
    });
  },

  updateActivity: async (userId: string) => {
    await updateDoc(doc(db, 'users', userId), {
      lastActive: Date.now()
    });
  },

  // --- Timer Methods (Same as before) ---
  startTimer: async (duration: number, type: TimerStatus) => {
    const now = Date.now();
    await setDoc(doc(db, CONFIG_COLLECTION, TIMER_DOC_ID), {
      status: type,
      startTime: now,
      endTime: now + (duration * 1000),
      duration: duration,
      remainingTimeStored: 0,
    });
  },

  pauseTimer: async () => {
    const { timer } = state;
    if (timer.status === TimerStatus.WORK || timer.status === TimerStatus.BREAK) {
      const now = Date.now();
      const remaining = Math.max(0, Math.ceil((timer.endTime - now) / 1000));
      await updateDoc(doc(db, CONFIG_COLLECTION, TIMER_DOC_ID), {
        status: TimerStatus.PAUSED,
        remainingTimeStored: remaining
      });
    }
  },

  resumeTimer: async () => {
    const { timer } = state;
    if (timer.status === TimerStatus.PAUSED) {
      const now = Date.now();
      const isBreak = timer.duration === 5 * 60;
      await updateDoc(doc(db, CONFIG_COLLECTION, TIMER_DOC_ID), {
        status: isBreak ? TimerStatus.BREAK : TimerStatus.WORK,
        startTime: now - ((timer.duration - timer.remainingTimeStored) * 1000),
        endTime: now + (timer.remainingTimeStored * 1000),
        remainingTimeStored: 0,
      });
    }
  },

  stopTimer: async () => {
    await setDoc(doc(db, CONFIG_COLLECTION, TIMER_DOC_ID), DEFAULT_TIMER);
  },

  completeTimer: async () => {
    const { timer } = state;
    if (timer.status === TimerStatus.WORK) {
      const breakDuration = 5 * 60;
      const now = Date.now();
      await setDoc(doc(db, CONFIG_COLLECTION, TIMER_DOC_ID), {
        status: TimerStatus.BREAK,
        startTime: now,
        endTime: now + (breakDuration * 1000),
        duration: breakDuration,
        remainingTimeStored: 0,
      });
    } else {
      await setDoc(doc(db, CONFIG_COLLECTION, TIMER_DOC_ID), DEFAULT_TIMER);
    }
  }
};