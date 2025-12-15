import React, { useState } from 'react';
import { Task, Project } from '../types';
import { Button } from './Button';
import { breakDownTask, getMotivation, suggestNextTask } from '../services/geminiService';

interface TaskListProps {
  tasks: Task[];
  projects: Project[];
  activeProjectId: string | null;
  activeTaskId: string | null;
  currentUserId: string;
  onAddTask: (title: string, projectId?: string) => void;
  onToggleTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onSetActiveTask: (id: string | null) => void;
  onAssignTask: (taskId: string, userId: string | null) => void;
}

export const TaskList: React.FC<TaskListProps> = ({ 
  tasks, projects, activeProjectId, activeTaskId, currentUserId,
  onAddTask, onToggleTask, onDeleteTask, onSetActiveTask, onAssignTask
}) => {
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiMessage, setAiMessage] = useState<string | null>(null);
  const [suggestedTaskId, setSuggestedTaskId] = useState<string | null>(null);

  // Filter tasks based on view
  const visibleTasks = tasks.filter(t => {
    if (activeProjectId) return t.projectId === activeProjectId;
    return true; // Show all in "All Tasks" view
  });

  const activeProject = projects.find(p => p.id === activeProjectId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTaskTitle.trim()) {
      onAddTask(newTaskTitle.trim(), activeProjectId || undefined);
      setNewTaskTitle('');
    }
  };

  const handleBreakDown = async (task: Task) => {
    setIsProcessing(true);
    setAiMessage("Analyzing task structure...");
    const subtasks = await breakDownTask(task.title);
    subtasks.forEach(st => onAddTask(st, task.projectId));
    setAiMessage(`Created ${subtasks.length} subtasks!`);
    setTimeout(() => setAiMessage(null), 3000);
    setIsProcessing(false);
  };

  const handleSuggestNext = async () => {
    setIsProcessing(true);
    setAiMessage("AI is prioritizing your workload...");
    
    // Only consider incomplete tasks
    const incompleteTasks = visibleTasks.filter(t => !t.completed);
    const id = await suggestNextTask(incompleteTasks, projects);
    
    if (id) {
      setSuggestedTaskId(id);
      setAiMessage("Here is what you should focus on next!");
    } else {
      setAiMessage("Couldn't find a suggestion. Maybe add more tasks?");
    }
    
    setTimeout(() => setAiMessage(null), 5000);
    setIsProcessing(false);
  };

  const getProjectColor = (projId?: string) => {
    return projects.find(p => p.id === projId)?.color || '#6b7280';
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            {activeProject ? (
              <>
                <span className="w-3 h-3 rounded-full" style={{backgroundColor: activeProject.color}}></span>
                {activeProject.name}
              </>
            ) : "All Tasks"}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {visibleTasks.filter(t => !t.completed).length} pending tasks
          </p>
        </div>
        
        <div className="flex gap-2">
           <Button variant="ghost" size="sm" onClick={handleSuggestNext} disabled={isProcessing} className="text-indigo-400 hover:text-indigo-300">
             ✨ Suggest Next
           </Button>
        </div>
      </div>

      {aiMessage && (
        <div className="mb-4 bg-indigo-900/40 border border-indigo-500/50 p-3 rounded-lg text-indigo-200 text-sm flex items-center gap-2 animate-pulse">
           <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" /></svg>
           {aiMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex gap-2 mb-6">
        <input
          type="text"
          value={newTaskTitle}
          onChange={(e) => setNewTaskTitle(e.target.value)}
          placeholder={activeProject ? `Add task to ${activeProject.name}...` : "Add a task..."}
          className="flex-1 bg-gray-800 border-gray-700 text-white rounded-lg focus:ring-indigo-500 focus:border-indigo-500 px-4 py-3 shadow-sm"
        />
        <Button type="submit" disabled={!newTaskTitle.trim()}>Add Task</Button>
      </form>

      <div className="flex-1 overflow-y-auto space-y-3 pr-2 pb-10">
        {visibleTasks.length === 0 && (
          <div className="flex flex-col items-center justify-center h-40 text-gray-500 border-2 border-dashed border-gray-800 rounded-xl">
            <p>No tasks found.</p>
            <p className="text-sm">Create a task to get started!</p>
          </div>
        )}
        
        {visibleTasks.map(task => {
          const isSuggested = task.id === suggestedTaskId;
          const isAssignedToMe = task.assigneeId === currentUserId;

          return (
            <div 
              key={task.id} 
              className={`group relative flex items-center gap-3 p-4 rounded-xl border transition-all ${
                activeTaskId === task.id 
                  ? 'bg-indigo-900/20 border-indigo-500/50 shadow-lg shadow-indigo-500/10' 
                  : isSuggested 
                    ? 'bg-gradient-to-r from-indigo-900/40 to-purple-900/40 border-indigo-400/50'
                    : 'bg-gray-800/40 border-gray-700 hover:border-gray-600 hover:bg-gray-800/60'
              } ${task.completed ? 'opacity-60' : ''}`}
            >
              {isSuggested && (
                <div className="absolute -top-2 -right-2 bg-indigo-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg">
                  RECOMMENDED
                </div>
              )}

              <button
                onClick={() => onToggleTask(task.id)}
                className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                  task.completed ? 'bg-indigo-600 border-indigo-600' : 'border-gray-600 hover:border-indigo-400'
                }`}
              >
                {task.completed && <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
              </button>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-sm font-medium truncate ${task.completed ? 'line-through text-gray-500' : 'text-gray-200'}`}>
                    {task.title}
                  </span>
                  {!activeProjectId && task.projectId && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-700 text-gray-300" style={{borderLeft: `2px solid ${getProjectColor(task.projectId)}`}}>
                      {projects.find(p => p.id === task.projectId)?.name}
                    </span>
                  )}
                </div>
                
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <button 
                    onClick={() => onAssignTask(task.id, isAssignedToMe ? null : currentUserId)}
                    className={`hover:text-gray-300 transition-colors flex items-center gap-1 ${isAssignedToMe ? 'text-indigo-400' : ''}`}
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                    {isAssignedToMe ? 'Assigned to me' : task.assigneeId ? 'Assigned' : 'Unassigned'}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                 {!task.completed && (
                   <>
                     <button 
                       onClick={() => onSetActiveTask(activeTaskId === task.id ? null : task.id)}
                       title={activeTaskId === task.id ? "Unfocus" : "Focus on this"}
                       className={`p-2 rounded-lg hover:bg-gray-700 transition-colors ${activeTaskId === task.id ? 'text-indigo-400 bg-indigo-900/30' : 'text-gray-400'}`}
                     >
                       <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                     </button>
                     <button
                       onClick={() => handleBreakDown(task)}
                       title="AI Breakdown"
                       className="p-2 rounded-lg hover:bg-gray-700 text-gray-400 hover:text-purple-400 transition-colors"
                     >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                     </button>
                   </>
                 )}
                <button 
                  onClick={() => onDeleteTask(task.id)}
                  className="p-2 rounded-lg hover:bg-red-900/30 text-gray-400 hover:text-red-400 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};