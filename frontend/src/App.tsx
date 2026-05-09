import React, { useEffect, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { DarkModeProvider } from './contexts/DarkModeContext';
import UserPage from './components/UserPage';
import MainChat from './components/MainChat';
import ProjectInfo from './components/ProjectInfo';
import ProjectManagerModal from './components/ProjectManagerModal';
import UserProfileModal from './components/UserProfileModal';
import {
  createProject,
  deleteProject,
  ensureDefaultProject,
  getAllProjects,
  ProjectRecord,
  updateProject,
} from './services/dbService';

interface User {
  id: string;
  name: string;
  email: string;
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [activeProjectId, setActiveProjectId] = useState('');
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [showProjectInfo, setShowProjectInfo] = useState(false);
  const [showProjectManager, setShowProjectManager] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load user from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('scholarflow-user');
    const storedProjectId = localStorage.getItem('scholarflow-active-project');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setIsAuthenticated(true);
        if (storedProjectId) {
          setActiveProjectId(storedProjectId);
        }
      } catch (err) {
        console.error('Failed to load user from localStorage:', err);
      }
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    const loadProjects = async () => {
      if (!user?.id) {
        setProjects([]);
        setActiveProjectId('');
        return;
      }

      const defaultProject = await ensureDefaultProject(user.id);
      const availableProjects = await getAllProjects(user.id);
      setProjects(availableProjects);

      const nextActiveProjectId = availableProjects.some((project) => project.id === activeProjectId)
        ? activeProjectId
        : defaultProject.id;

      setActiveProjectId(nextActiveProjectId);
      localStorage.setItem('scholarflow-active-project', nextActiveProjectId);
    };

    void loadProjects();
  }, [user?.id]);

  const handleSignIn = (signedInUser: { name: string; email: string; id: string }) => {
    setUser(signedInUser);
    setIsAuthenticated(true);
    setShowUserProfile(false);
    // Store user in localStorage
    localStorage.setItem('scholarflow-user', JSON.stringify(signedInUser));
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUser(null);
    setProjects([]);
    setActiveProjectId('');
    setShowUserProfile(false);
    setShowProjectManager(false);
    // Remove user from localStorage
    localStorage.removeItem('scholarflow-user');
    localStorage.removeItem('scholarflow-active-project');
  };

  const refreshProjects = async (preferredProjectId?: string) => {
    if (!user?.id) return;

    const availableProjects = await getAllProjects(user.id);
    setProjects(availableProjects);

    const fallbackProjectId = availableProjects[0]?.id || '';
    const nextProjectId =
      preferredProjectId && availableProjects.some((project) => project.id === preferredProjectId)
        ? preferredProjectId
        : fallbackProjectId;

    if (nextProjectId) {
      setActiveProjectId(nextProjectId);
      localStorage.setItem('scholarflow-active-project', nextProjectId);
    }
  };

  const handleCreateProject = async (name: string, description: string) => {
    if (!user?.id) return;
    const project = await createProject(user.id, name, description);
    await refreshProjects(project.id);
  };

  const handleUpdateProject = async (projectId: string, name: string, description: string) => {
    await updateProject(projectId, { name, description });
    await refreshProjects(projectId);
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!user?.id) return;
    await deleteProject(user.id, projectId);
    await refreshProjects();
  };

  const activeProject = projects.find((project) => project.id === activeProjectId);

  if (isLoading) {
    return (
      <DarkModeProvider>
        <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4" />
            <p className="text-slate-600 dark:text-slate-400">Loading...</p>
          </div>
        </div>
      </DarkModeProvider>
    );
  }

  return (
    <DarkModeProvider>
      <AnimatePresence mode="wait">
        {!isAuthenticated ? (
          <UserPage key="userpage" onSignIn={handleSignIn} />
        ) : (
          <div key="mainchat" className="flex h-screen w-screen overflow-hidden">
            <MainChat
              userName={user?.name || 'User'}
              userId={user?.id || ''}
              activeProjectId={activeProjectId}
              activeProjectName={activeProject?.name || 'Project 01'}
              onShowUserProfile={() => setShowUserProfile(!showUserProfile)}
              onShowProjectInfo={() => setShowProjectInfo(true)}
              onShowProjectManager={() => setShowProjectManager(true)}
              onLogout={handleLogout}
            />
            
            {/* User Profile Modal */}
            {showUserProfile && user && activeProject && (
              <UserProfileModal
                user={user}
                activeProjectName={activeProject.name}
                projectCount={projects.length}
                onClose={() => setShowUserProfile(false)}
                onLogout={handleLogout}
              />
            )}

            {showProjectManager && (
              <ProjectManagerModal
                activeProjectId={activeProjectId}
                projects={projects}
                onClose={() => setShowProjectManager(false)}
                onCreateProject={handleCreateProject}
                onDeleteProject={handleDeleteProject}
                onSelectProject={(projectId) => {
                  setActiveProjectId(projectId);
                  localStorage.setItem('scholarflow-active-project', projectId);
                  setShowProjectManager(false);
                }}
                onUpdateProject={handleUpdateProject}
              />
            )}

            {/* Project Info Modal */}
            {showProjectInfo && (
              <ProjectInfo onClose={() => setShowProjectInfo(false)} />
            )}
          </div>
        )}
      </AnimatePresence>
    </DarkModeProvider>
  );
}
