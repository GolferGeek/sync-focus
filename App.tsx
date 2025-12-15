import React, { useEffect, useState } from 'react';
import { Login } from './components/Login';
import { Timer } from './components/Timer';
import { TaskList } from './components/TaskList';
import { TeamSidebar } from './components/TeamSidebar';
import { ProjectManager } from './components/ProjectManager';
import { backend } from './services/backend';
import { AppData, Task } from './types';
import { Button } from './components/Button';

function App() {
  const [data, setData] = useState<AppData | null>(null);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = backend.subscribe((newData) => {
      setData(newData);
    });
    return () => { unsubscribe(); };
  }, []);

  const handleSetActiveTask = (taskId: string | null) => {
    if (data?.authUserId) {
      const taskTitle = taskId 
        ? data.tasks.find(t => t.id === taskId)?.title || null
        : null;
      backend.updateUserTask(data.authUserId, taskId, taskTitle);
    }
  };

  if (!data) {
    return <div className="min-h-screen bg-gray-950 flex items-center justify-center text-gray-500">Loading SyncFocus...</div>;
  }

  if (!data.authUserId) {
    return <Login />;
  }

  const currentUser = data.users[data.authUserId];
  if (!currentUser) {
    return <div className="min-h-screen bg-gray-950 flex items-center justify-center text-gray-500">Setting up workspace...</div>;
  }

  // Active task derived from shared tasks list
  const activeTask = data.tasks.find(t => t.id === currentUser.currentTaskId);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 font-sans flex flex-col overflow-hidden">
      
      {/* Top Navigation */}
      <header className="h-14 border-b border-gray-800 flex items-center justify-between px-4 bg-gray-900 z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-600/20">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <span className="font-bold text-lg tracking-tight">SyncFocus</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-xs text-gray-400 font-medium">
             {currentUser.displayName}
          </div>
          <Button variant="ghost" size="sm" onClick={() => backend.logout()}>Sign Out</Button>
        </div>
      </header>

      {/* Main Content Layout */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left: Project Manager */}
        <ProjectManager 
          projects={data.projects}
          activeProjectId={activeProjectId}
          onSelectProject={setActiveProjectId}
          onAddProject={backend.addProject}
        />

        {/* Center: Dashboard */}
        <div className="flex-1 overflow-y-auto bg-gray-950/50 p-6">
          <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-6 h-full">
            
            {/* Task Management Area */}
            <div className="flex-1 flex flex-col min-h-[500px]">
               <TaskList 
                 tasks={data.tasks}
                 projects={data.projects}
                 activeProjectId={activeProjectId}
                 activeTaskId={currentUser.currentTaskId}
                 currentUserId={data.authUserId}
                 onAddTask={backend.addTask}
                 onToggleTask={(id) => {
                   const t = data.tasks.find(x => x.id === id);
                   if (t) backend.toggleTask(id, t.completed);
                 }}
                 onDeleteTask={backend.deleteTask}
                 onSetActiveTask={handleSetActiveTask}
                 onAssignTask={backend.assignTask}
               />
            </div>

            {/* Right Side of Center: Timer (Sticky) */}
            <div className="w-full lg:w-80 flex-shrink-0">
               <div className="sticky top-0 space-y-6">
                 <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-xl flex flex-col items-center">
                    <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-4">Team Timer</h3>
                    <Timer 
                      timer={data.timer}
                      activeTaskTitle={activeTask?.title}
                    />
                 </div>
                 
                 {/* Mini Stats or Info could go here */}
                 <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 text-xs text-gray-500">
                   <p>💡 Tip: Assign a task to yourself to let your team know what you are focusing on.</p>
                 </div>
               </div>
            </div>

          </div>
        </div>

        {/* Right: Team Sidebar */}
        <TeamSidebar 
          currentUser={currentUser}
          users={data.users}
          timer={data.timer}
        />
      </div>
    </div>
  );
}

export default App;