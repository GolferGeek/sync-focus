import React, { useEffect, useState, useRef } from 'react';
import { TimerStatus, GlobalTimer } from '../types';
import { Button } from './Button';
import { backend } from '../services/backend';

interface TimerProps {
  timer: GlobalTimer;
  activeTaskTitle?: string;
}

const WORK_TIME = 25 * 60;
const BREAK_TIME = 5 * 60;

export const Timer: React.FC<TimerProps> = ({ timer, activeTaskTitle }) => {
  const [timeLeft, setTimeLeft] = useState(WORK_TIME);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Synchronization Loop
  useEffect(() => {
    const tick = () => {
      const now = Date.now();
      
      if (timer.status === TimerStatus.IDLE) {
        setTimeLeft(WORK_TIME);
      } else if (timer.status === TimerStatus.PAUSED) {
        setTimeLeft(timer.remainingTimeStored);
      } else {
        // Active Running State
        const delta = Math.max(0, Math.ceil((timer.endTime - now) / 1000));
        setTimeLeft(delta);

        // Check for completion
        if (delta === 0) {
          if (audioRef.current) audioRef.current.play();
          backend.completeTimer();
        }
      }
    };

    tick(); // Initial call
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [timer]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  
  // Progress Calculation
  const progress = timer.status === TimerStatus.IDLE ? 100 : 
                   (timeLeft / timer.duration) * 100;
                   
  const strokeColor = timer.status === TimerStatus.BREAK ? '#2dd4bf' : '#6366f1';
  const statusLabel = timer.status === TimerStatus.IDLE ? 'READY' :
                      timer.status === TimerStatus.PAUSED ? 'PAUSED' :
                      timer.status === TimerStatus.WORK ? 'GROUP FOCUS' : 'GROUP BREAK';

  return (
    <div className="flex flex-col items-center justify-center py-8">
      <audio ref={audioRef} src="https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3" />
      
      <div className="relative w-64 h-64">
        {/* Background Circle */}
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="128"
            cy="128"
            r="120"
            stroke="#1f2937"
            strokeWidth="8"
            fill="transparent"
          />
          {/* Progress Circle */}
          <circle
            cx="128"
            cy="128"
            r="120"
            stroke={strokeColor}
            strokeWidth="8"
            fill="transparent"
            strokeDasharray={2 * Math.PI * 120}
            strokeDashoffset={2 * Math.PI * 120 * (1 - progress / 100)}
            className="transition-all duration-1000 ease-linear"
            strokeLinecap="round"
          />
        </svg>
        
        <div className="absolute top-0 left-0 w-full h-full flex flex-col items-center justify-center text-center">
          <div className="text-6xl font-bold font-mono text-white mb-2">
            {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
          </div>
          <div className={`text-sm font-bold tracking-wider px-3 py-1 rounded-full ${
            timer.status === TimerStatus.WORK ? 'bg-indigo-500/20 text-indigo-300' :
            timer.status === TimerStatus.BREAK ? 'bg-teal-500/20 text-teal-300' :
            timer.status === TimerStatus.PAUSED ? 'bg-yellow-500/20 text-yellow-300' :
            'bg-gray-700 text-gray-400'
          }`}>
            {statusLabel}
          </div>
        </div>
      </div>

      <div className="mt-8 flex gap-4">
        {timer.status === TimerStatus.IDLE ? (
          <Button size="lg" onClick={() => backend.startTimer(WORK_TIME, TimerStatus.WORK)} className="w-32 shadow-lg shadow-indigo-500/30">
            Start Group
          </Button>
        ) : (
          <>
            {timer.status === TimerStatus.PAUSED ? (
               <Button variant="secondary" onClick={() => backend.resumeTimer()}>Resume</Button>
            ) : (
               <Button variant="secondary" onClick={() => backend.pauseTimer()}>Pause</Button>
            )}
            
            <Button variant="ghost" onClick={() => backend.stopTimer()}>Reset</Button>
            
            {timer.status === TimerStatus.WORK && (
              <Button variant="ghost" className="text-teal-400 hover:text-teal-300" onClick={() => backend.startTimer(BREAK_TIME, TimerStatus.BREAK)}>
                Skip to Break
              </Button>
            )}
            {timer.status === TimerStatus.BREAK && (
               <Button variant="ghost" className="text-indigo-400 hover:text-indigo-300" onClick={() => backend.startTimer(WORK_TIME, TimerStatus.WORK)}>
                 Start Focus
               </Button>
            )}
          </>
        )}
      </div>

      <div className="mt-6 text-center max-w-sm animate-fade-in min-h-[4rem]">
        {timer.status === TimerStatus.WORK ? (
          <>
             <p className="text-gray-400 text-sm mb-1">Your Objective</p>
             <p className="text-xl font-medium text-gray-100 line-clamp-2">
               {activeTaskTitle || "No active task selected"}
             </p>
             {!activeTaskTitle && (
               <p className="text-xs text-yellow-500 mt-2">Select a task below to track it!</p>
             )}
          </>
        ) : timer.status === TimerStatus.BREAK ? (
          <div className="flex items-center justify-center gap-2 text-teal-200">
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
             <p>Time to recharge. Stretch your legs!</p>
          </div>
        ) : (
          <p className="text-gray-500 text-sm">Waiting for a team member to start the timer...</p>
        )}
      </div>
    </div>
  );
};