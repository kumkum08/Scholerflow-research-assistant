import React, { useEffect, useState } from 'react';
import { Folder, PencilLine, Plus, Trash2, X } from 'lucide-react';
import { ProjectRecord, isDefaultProjectId } from '../services/dbService';
import { useDarkMode } from '../contexts/DarkModeContext';

interface ProjectManagerModalProps {
  activeProjectId: string;
  projects: ProjectRecord[];
  onClose: () => void;
  onCreateProject: (name: string, description: string) => Promise<void>;
  onDeleteProject: (projectId: string) => Promise<void>;
  onSelectProject: (projectId: string) => void;
  onUpdateProject: (projectId: string, name: string, description: string) => Promise<void>;
}

export default function ProjectManagerModal({
  activeProjectId,
  projects,
  onClose,
  onCreateProject,
  onDeleteProject,
  onSelectProject,
  onUpdateProject,
}: ProjectManagerModalProps) {
  const { isDark } = useDarkMode();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const activeProject = projects.find((project) => project.id === activeProjectId);
    if (!activeProject) return;

    setName(activeProject.name);
    setDescription(activeProject.description || '');
  }, [activeProjectId, projects]);

  const cardClass = isDark ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-900';
  const mutedClass = isDark ? 'text-slate-400' : 'text-slate-500';
  const inputClass = isDark
    ? 'bg-slate-800 border-slate-700 text-slate-100 placeholder-slate-500'
    : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400';

  const resetForm = () => {
    setEditingProjectId(null);
    setName('');
    setDescription('');
    setError('');
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      setError('Project name is required.');
      return;
    }

    setIsSaving(true);
    setError('');
    try {
      await onCreateProject(name, description);
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create project.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingProjectId) return;
    if (!name.trim()) {
      setError('Project name is required.');
      return;
    }

    setIsSaving(true);
    setError('');
    try {
      await onUpdateProject(editingProjectId, name, description);
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update project.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4">
      <div className={`w-full max-w-4xl rounded-3xl border shadow-2xl ${cardClass}`}>
        <div className={`flex items-center justify-between border-b px-6 py-5 ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
          <div>
            <h2 className="text-2xl font-black">Manage Projects</h2>
            <p className={`mt-1 text-sm ${mutedClass}`}>Create, switch, rename, or delete your research workspaces.</p>
          </div>
          <button
            onClick={onClose}
            className={`rounded-xl p-2 transition-colors ${isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-100'}`}
          >
            <X size={20} />
          </button>
        </div>

        <div className="grid gap-0 md:grid-cols-[1.2fr_0.8fr]">
          <div className={`border-b p-6 md:border-b-0 md:border-r ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
            <div className="space-y-3">
              {projects.map((project) => {
                const isActive = project.id === activeProjectId;
                const isDefault = isDefaultProjectId(project.id);

                return (
                  <div
                    key={project.id}
                    className={`rounded-2xl border p-4 transition-colors ${
                      isActive
                        ? isDark
                          ? 'border-indigo-500/40 bg-indigo-500/10'
                          : 'border-indigo-200 bg-indigo-50'
                        : isDark
                          ? 'border-slate-700 bg-slate-950/50'
                          : 'border-slate-200 bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <Folder size={16} className="text-indigo-500" />
                          <h3 className="truncate text-base font-bold">{project.name}</h3>
                          {isActive && (
                            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                              Active
                            </span>
                          )}
                        </div>
                        <p className={`mt-2 text-sm leading-6 ${mutedClass}`}>
                          {project.description || 'No description added yet.'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setEditingProjectId(project.id);
                            setName(project.name);
                            setDescription(project.description || '');
                            setError('');
                          }}
                          className={`rounded-xl p-2 transition-colors ${isDark ? 'hover:bg-slate-800' : 'hover:bg-white'}`}
                          title="Edit project"
                        >
                          <PencilLine size={16} />
                        </button>
                        {!isDefault && (
                          <button
                            onClick={() => void onDeleteProject(project.id)}
                            className="rounded-xl p-2 text-red-500 transition-colors hover:bg-red-500/10"
                            title="Delete project"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 flex items-center gap-3">
                      <button
                        onClick={() => onSelectProject(project.id)}
                        className={`rounded-xl px-4 py-2 text-sm font-bold transition-colors ${
                          isActive
                            ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                            : 'bg-indigo-600 text-white hover:bg-indigo-700'
                        }`}
                      >
                        {isActive ? 'Current Project' : 'Open Project'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-6">
            <div className="mb-5 flex items-center gap-2">
              <Plus size={18} className="text-indigo-500" />
              <h3 className="text-lg font-bold">{editingProjectId ? 'Edit Project' : 'Create New Project'}</h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className={`mb-2 block text-sm font-semibold ${mutedClass}`}>Project Name</label>
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="AI Literature Review"
                  className={`w-full rounded-2xl border px-4 py-3 outline-none transition-colors focus:border-indigo-500 ${inputClass}`}
                />
              </div>

              <div>
                <label className={`mb-2 block text-sm font-semibold ${mutedClass}`}>Description</label>
                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Short note about this project..."
                  rows={4}
                  className={`w-full rounded-2xl border px-4 py-3 outline-none transition-colors focus:border-indigo-500 ${inputClass}`}
                />
              </div>

              {error && (
                <p className="rounded-xl bg-red-500/10 px-4 py-3 text-sm font-medium text-red-500">{error}</p>
              )}

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => void (editingProjectId ? handleUpdate() : handleCreate())}
                  disabled={isSaving}
                  className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-indigo-700 disabled:opacity-60"
                >
                  {isSaving ? 'Saving...' : editingProjectId ? 'Save Changes' : 'Create Project'}
                </button>
                {editingProjectId && (
                  <button
                    onClick={resetForm}
                    className={`rounded-xl px-5 py-3 text-sm font-bold transition-colors ${isDark ? 'bg-slate-800 hover:bg-slate-700' : 'bg-slate-100 hover:bg-slate-200'}`}
                  >
                    Cancel Edit
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
