import React, { useState } from 'react';
import { Project } from '../types';
import { Button } from './Button';

interface ProjectManagerProps {
  projects: Project[];
  activeProjectId: string | null;
  onSelectProject: (id: string | null) => void;
  onAddProject: (name: string, color: string) => void;
}

const COLORS = ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#3b82f6', '#8b5cf6'];

export const ProjectManager: React.FC<ProjectManagerProps> = ({ 
  projects, activeProjectId, onSelectProject, onAddProject 
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newName.trim()) {
      onAddProject(newName.trim(), selectedColor);
      setNewName('');
      setIsAdding(false);
    }
  };

  return (
    <div className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col h-full">
      <div className="p-4 border-b border-gray-800">
        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Projects</h2>
        
        <div className="space-y-1">
          <button
            onClick={() => onSelectProject(null)}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeProjectId === null 
                ? 'bg-gray-800 text-white' 
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
            }`}
          >
            All Tasks
          </button>
          
          {projects.map(project => (
            <button
              key={project.id}
              onClick={() => onSelectProject(project.id)}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeProjectId === project.id 
                  ? 'bg-gray-800 text-white' 
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: project.color }}></span>
              {project.name}
            </button>
          ))}
        </div>

        {!isAdding ? (
          <button 
            onClick={() => setIsAdding(true)}
            className="mt-4 flex items-center gap-2 text-xs text-indigo-400 hover:text-indigo-300 px-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            New Project
          </button>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 bg-gray-800 p-3 rounded-lg border border-gray-700">
            <input
              type="text"
              autoFocus
              placeholder="Project Name"
              className="w-full bg-gray-900 border-gray-700 rounded px-2 py-1 text-xs text-white mb-2 focus:ring-1 focus:ring-indigo-500"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
            <div className="flex gap-1 mb-3">
              {COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setSelectedColor(c)}
                  className={`w-4 h-4 rounded-full ${selectedColor === c ? 'ring-2 ring-white' : ''}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
            <div className="flex gap-2">
              <Button type="submit" size="sm" className="w-full text-xs py-1">Add</Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => setIsAdding(false)} className="w-full text-xs py-1">Cancel</Button>
            </div>
          </form>
        )}
      </div>

      <div className="p-4 mt-auto">
        <div className="bg-gradient-to-br from-indigo-900/20 to-purple-900/20 rounded-xl p-4 border border-indigo-500/10">
          <p className="text-xs text-indigo-200 mb-2 font-medium">✨ AI Manager</p>
          <p className="text-[10px] text-gray-400 leading-relaxed">
            Need direction? Use the "Suggest Next" button in your task list to let AI prioritize your work.
          </p>
        </div>
      </div>
    </div>
  );
};