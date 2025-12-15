import React from 'react';
import { UserState, TimerStatus, GlobalTimer } from '../types';

interface TeamSidebarProps {
  currentUser: UserState;
  users: Record<string, UserState>;
  timer: GlobalTimer;
}

export const TeamSidebar: React.FC<TeamSidebarProps> = ({ currentUser, users, timer }) => {
  const otherUsers = (Object.values(users) as UserState[]).filter(u => u.userId !== currentUser.userId);

  return (
    <div className="w-full md:w-80 border-t md:border-t-0 md:border-l border-gray-800 bg-gray-900/50 p-6 flex flex-col gap-6 overflow-y-auto">
      <div>
        <h2 className="text-lg font-semibold text-gray-100 mb-4 flex items-center justify-between">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            Team Pulse
          </div>
          <span className={`text-xs font-mono px-2 py-0.5 rounded ${
            timer.status === TimerStatus.WORK ? 'bg-indigo-900 text-indigo-300' :
            timer.status === TimerStatus.BREAK ? 'bg-teal-900 text-teal-300' :
            'bg-gray-800 text-gray-500'
          }`}>
             {timer.status === TimerStatus.IDLE ? 'OFFLINE' : timer.status}
          </span>
        </h2>
        
        {otherUsers.length === 0 ? (
          <p className="text-gray-500 text-sm">No one else is here yet.</p>
        ) : (
          <div className="space-y-4">
            {otherUsers.map(user => {
              const hasActiveTask = !!user.currentTaskTitle;
              
              return (
                <div key={user.userId} className="bg-gray-800/50 rounded-lg p-3 border border-gray-700/50">
                  <div className="flex items-center gap-3 mb-2">
                    <img src={user.avatarUrl} alt={user.displayName} className="w-8 h-8 rounded-full bg-gray-700" />
                    <div>
                      <div className="text-sm font-medium text-gray-200">{user.displayName}</div>
                      {hasActiveTask ? (
                         <div className="text-xs text-indigo-400 flex items-center gap-1">
                           <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
                           Working
                         </div>
                      ) : (
                        <div className="text-xs text-gray-500">Idle</div>
                      )}
                    </div>
                  </div>
                  
                  {hasActiveTask && (
                    <div className="mt-2 text-xs bg-indigo-900/20 text-indigo-200 p-2 rounded border border-indigo-500/10">
                      <span className="opacity-60 mr-1">Task:</span>
                      <span className="font-medium truncate block">{user.currentTaskTitle}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="mt-auto bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-4 border border-gray-700">
        <h3 className="text-sm font-medium text-gray-300 mb-2">Your Status</h3>
        <div className="flex items-center gap-3">
          <img src={currentUser.avatarUrl} alt="You" className="w-10 h-10 rounded-full ring-2 ring-indigo-500/30" />
          <div>
            <div className="text-sm font-bold text-white">{currentUser.displayName}</div>
            <div className="text-xs text-gray-400">
              {currentUser.currentTaskId ? 'Active' : 'No task selected'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};