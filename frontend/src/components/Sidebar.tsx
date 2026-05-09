import React, { useState } from 'react';
import { 
  ChevronRight, GraduationCap, FileText, Menu, X, Moon, Sun, LogOut, User
} from 'lucide-react';
import { useDarkMode } from '../contexts/DarkModeContext';

interface SidebarProps {
  sections: string[];
  activeSection: string;
  onSectionChange: (section: string) => void;
  importedDocs: Array<{ id?: number; fileName: string }>;
  activeDocumentId: number | null;
  onDocumentChange: (id: number) => void;
  isOnline: boolean;
  onUserClick: () => void;
  onLogout: () => void;
}

export default function Sidebar({
  sections,
  activeSection,
  onSectionChange,
  importedDocs,
  activeDocumentId,
  onDocumentChange,
  isOnline,
  onUserClick,
  onLogout,
}: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { isDark, toggleDarkMode } = useDarkMode();

  const bgClass = isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200';
  const textClass = isDark ? 'text-slate-100' : 'text-slate-900';
  const mutedClass = isDark ? 'text-slate-400' : 'text-slate-500';
  const hoverClass = isDark ? 'hover:bg-slate-800 hover:text-slate-100' : 'hover:bg-slate-50 hover:text-slate-800';
  const activeBgClass = isDark ? 'bg-indigo-600/20 text-indigo-400 ring-indigo-600/30' : 'bg-indigo-50 text-indigo-700 ring-indigo-100';
  const labelClass = isDark ? 'text-slate-500' : 'text-slate-400';
  const dividerClass = isDark ? 'border-slate-700' : 'border-slate-100';

  return (
    <aside className={`${bgClass} border-r ${isCollapsed ? 'w-20' : 'w-72'} flex flex-col transition-all duration-300 shadow-[4px_0_24px_rgba(0,0,0,0.02)] h-screen`}>
      {/* Header */}
      <div className="p-4 flex items-center justify-between">
        {!isCollapsed && (
          <div className="flex items-center gap-3 flex-1">
            <div className="bg-indigo-600 p-2.5 rounded-xl shadow-lg shadow-indigo-200">
              <GraduationCap className="text-white w-6 h-6" />
            </div>
            <div>
              <h1 className={`font-bold text-lg tracking-tight leading-none ${textClass}`}>ScholarFlow</h1>
              <p className="text-[9px] font-semibold uppercase tracking-[0.1em] mt-0.5 text-slate-400">AI Suite</p>
            </div>
          </div>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-100'}`}
        >
          {isCollapsed ? <Menu size={18} /> : <X size={18} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {!isCollapsed && (
          <div className="flex items-center gap-2 px-4 mb-4">
            <FileText size={14} className={labelClass} />
            <span className={`text-[11px] font-bold uppercase tracking-widest ${labelClass}`}>Research Paper</span>
          </div>
        )}
        
        {sections.map(section => (
          <button
            key={section}
            onClick={() => onSectionChange(section)}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group ${
              activeSection === section 
                ? `${activeBgClass} shadow-sm ring-1` 
                : `${mutedClass} ${hoverClass}`
            }`}
            title={isCollapsed ? section : ''}
          >
            <div className={`w-1.5 h-1.5 rounded-full transition-all ${activeSection === section ? 'bg-indigo-600 scale-125' : 'bg-slate-200 group-hover:bg-slate-300'}`} />
            {!isCollapsed && (
              <>
                <span className="text-sm font-semibold flex-1">{section}</span>
                {activeSection === section && <ChevronRight size={14} className="opacity-50" />}
              </>
            )}
          </button>
        ))}

        {!isCollapsed && importedDocs.length > 0 && (
          <div className="mt-6 px-4 pt-4 border-t border-slate-200 dark:border-slate-700">
            <p className={`text-[11px] font-bold uppercase tracking-widest mb-3 ${labelClass}`}>Imported Docs</p>
            {importedDocs.map((doc) => (
              <button
                key={doc.id}
                onClick={() => onDocumentChange(doc.id ?? 0)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors truncate ${
                  activeDocumentId === doc.id 
                    ? 'bg-indigo-50 dark:bg-indigo-600/20 text-indigo-700 dark:text-indigo-400' 
                    : `${mutedClass} ${hoverClass}`
                }`}
                title={doc.fileName}
              >
                {doc.fileName}
              </button>
            ))}
          </div>
        )}
      </nav>

      {/* Status & Footer */}
      <div className={`p-4 border-t ${dividerClass} space-y-3`}>
        {!isCollapsed && (
          <div className={`flex items-center gap-2 text-[11px] font-bold px-3 py-2 rounded-lg border shadow-sm transition-colors ${
            isOnline 
              ? `text-emerald-700 dark:text-emerald-400 bg-white dark:bg-slate-800 border-emerald-100 dark:border-emerald-900/30` 
              : `text-amber-700 dark:text-amber-400 bg-white dark:bg-slate-800 border-amber-100 dark:border-amber-900/30`
          }`}>
            <div className={`w-2 h-2 rounded-full animate-pulse ${isOnline ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            {isOnline ? 'AI ENGINE ACTIVE' : 'LOCAL CACHE MODE'}
          </div>
        )}

        <div className={`flex items-center gap-2 ${isCollapsed ? 'justify-center' : ''}`}>
          <button
            onClick={toggleDarkMode}
            className={`flex-1 ${isCollapsed ? 'flex justify-center' : ''} p-2 rounded-lg transition-colors ${isDark ? 'bg-slate-800 text-yellow-400 hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            title="Toggle dark mode"
          >
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <button
            onClick={onUserClick}
            className={`flex-1 ${isCollapsed ? 'flex justify-center' : ''} p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-100'}`}
            title="User profile"
          >
            <User size={16} />
          </button>
          <button
            onClick={onLogout}
            className={`flex-1 ${isCollapsed ? 'flex justify-center' : ''} p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-slate-800 text-red-400' : 'hover:bg-slate-100 text-red-600'}`}
            title="Logout"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
