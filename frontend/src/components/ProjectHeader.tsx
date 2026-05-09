import React, { useState } from 'react';
import { ChevronRight, Settings, Plus, Folder, Info } from 'lucide-react';
import { useDarkMode } from '../contexts/DarkModeContext';

interface ProjectHeaderProps {
  activeSection: string;
  activeProjectName?: string;
  userName?: string;
  onProjectInfo?: () => void;
  onShowProjectManager?: () => void;
  onShowUserProfile?: () => void;
}

export default function ProjectHeader({
  activeSection,
  activeProjectName = 'Project 01',
  userName = 'User',
  onProjectInfo,
  onShowProjectManager,
  onShowUserProfile,
}: ProjectHeaderProps) {
  const [showProjectMenu, setShowProjectMenu] = useState(false);
  const { isDark } = useDarkMode();

  const bgClass = isDark ? 'bg-slate-900/50 border-slate-700' : 'bg-white/80 border-slate-200';
  const textClass = isDark ? 'text-slate-100' : 'text-slate-800';
  const labelClass = isDark ? 'text-slate-500' : 'text-slate-400';

  return (
    <header className={`h-20 ${bgClass} backdrop-blur-md border-b flex items-center justify-between px-10 z-10 transition-colors`}>
      <div>
        <div className={`flex items-center gap-2 text-xs font-bold ${labelClass} mb-0.5`}>
          <Folder size={12} />
          <span>{activeProjectName.toUpperCase()}</span>
          <ChevronRight size={10} />
          <button
            onClick={onProjectInfo}
            className="flex items-center gap-1 text-indigo-500 hover:text-indigo-600 transition-colors"
          >
            <Info size={10} />
            What is a Project?
          </button>
        </div>
        <h2 className={`font-extrabold text-xl ${textClass}`}>{activeSection}</h2>
      </div>
      
      <div className="flex items-center gap-4">
        <div className={`text-right text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
          <button
            onClick={onShowUserProfile}
            className="font-semibold transition-colors hover:text-indigo-500"
          >
            {userName}
          </button>
          <p className="text-xs opacity-75">Research Assistant</p>
        </div>
        
        <div className="relative">
          <button
            onClick={() => setShowProjectMenu(!showProjectMenu)}
            className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-100'}`}
          >
            <Settings size={20} />
          </button>

          {showProjectMenu && (
            <div className={`absolute right-0 mt-2 w-48 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'} border rounded-lg shadow-lg z-50`}>
              <button
                onClick={() => {
                  setShowProjectMenu(false);
                  onShowProjectManager?.();
                }}
                className={`w-full text-left px-4 py-2.5 flex items-center gap-2 font-semibold text-sm ${isDark ? 'hover:bg-slate-700' : 'hover:bg-slate-50'} transition-colors border-b ${isDark ? 'border-slate-700' : 'border-slate-100'}`}
              >
                <Plus size={16} />
                New Project
              </button>
              <button
                onClick={() => {
                  setShowProjectMenu(false);
                  onShowProjectManager?.();
                }}
                className={`w-full text-left px-4 py-2.5 flex items-center gap-2 font-semibold text-sm ${isDark ? 'hover:bg-slate-700' : 'hover:bg-slate-50'} transition-colors`}
              >
                <Folder size={16} />
                Manage Projects
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
