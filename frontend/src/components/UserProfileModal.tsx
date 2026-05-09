import React from 'react';
import { FolderOpen, Mail, UserRound, X } from 'lucide-react';
import { useDarkMode } from '../contexts/DarkModeContext';

interface UserProfileModalProps {
  activeProjectName: string;
  projectCount: number;
  user: {
    email: string;
    id: string;
    name: string;
  };
  onClose: () => void;
  onLogout: () => void;
}

export default function UserProfileModal({
  activeProjectName,
  projectCount,
  user,
  onClose,
  onLogout,
}: UserProfileModalProps) {
  const { isDark } = useDarkMode();
  const cardClass = isDark ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-900';
  const mutedClass = isDark ? 'text-slate-400' : 'text-slate-500';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4">
      <div className={`w-full max-w-md rounded-3xl border p-6 shadow-2xl ${cardClass}`}>
        <div className="mb-6 flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg">
              <UserRound size={28} />
            </div>
            <div>
              <h2 className="text-2xl font-black">{user.name}</h2>
              <p className={`text-sm ${mutedClass}`}>ScholarFlow Research User</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`rounded-xl p-2 transition-colors ${isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-100'}`}
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-3">
          <div className={`rounded-2xl border p-4 ${isDark ? 'border-slate-700 bg-slate-950/50' : 'border-slate-200 bg-slate-50'}`}>
            <div className="mb-1 flex items-center gap-2 text-sm font-bold">
              <Mail size={16} className="text-indigo-500" />
              Email
            </div>
            <p className={`text-sm ${mutedClass}`}>{user.email}</p>
          </div>

          <div className={`rounded-2xl border p-4 ${isDark ? 'border-slate-700 bg-slate-950/50' : 'border-slate-200 bg-slate-50'}`}>
            <div className="mb-1 flex items-center gap-2 text-sm font-bold">
              <FolderOpen size={16} className="text-indigo-500" />
              Active Project
            </div>
            <p className="text-sm font-semibold">{activeProjectName}</p>
            <p className={`mt-1 text-xs ${mutedClass}`}>{projectCount} total project{projectCount === 1 ? '' : 's'}</p>
          </div>

          <div className={`rounded-2xl border p-4 ${isDark ? 'border-slate-700 bg-slate-950/50' : 'border-slate-200 bg-slate-50'}`}>
            <div className="mb-1 text-sm font-bold">User ID</div>
            <p className={`break-all text-xs ${mutedClass}`}>{user.id}</p>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            onClick={onLogout}
            className="flex-1 rounded-2xl bg-red-600 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-red-700"
          >
            Logout
          </button>
          <button
            onClick={onClose}
            className={`flex-1 rounded-2xl px-5 py-3 text-sm font-bold transition-colors ${isDark ? 'bg-slate-800 hover:bg-slate-700' : 'bg-slate-100 hover:bg-slate-200'}`}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
