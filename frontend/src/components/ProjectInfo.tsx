import React from 'react';
import { X, Lightbulb, FileText, Users, Zap, Save } from 'lucide-react';
import { motion } from 'framer-motion';
import { useDarkMode } from '../contexts/DarkModeContext';

interface ProjectInfoProps {
  onClose: () => void;
}

export default function ProjectInfo({ onClose }: ProjectInfoProps) {
  const { isDark } = useDarkMode();

  const bgClass = isDark ? 'bg-slate-900/95' : 'bg-white/95';
  const textClass = isDark ? 'text-slate-100' : 'text-slate-900';
  const mutedClass = isDark ? 'text-slate-400' : 'text-slate-500';

  const features = [
    {
      icon: FileText,
      title: 'Research Papers',
      description: 'Organize your academic writing into structured sections like Abstract, Introduction, Methodology, and more.'
    },
    {
      icon: Lightbulb,
      title: 'AI Assistance',
      description: 'Get AI-powered suggestions for content, structure, citations, and academic tone improvements.'
    },
    {
      icon: Save,
      title: 'Auto-Save',
      description: 'All your work is automatically saved to your local database. No work will be lost.'
    },
    {
      icon: Zap,
      title: 'Offline Mode',
      description: 'Continue working even without internet. Your AI assistant will work in local cache mode.'
    },
    {
      icon: Users,
      title: 'Document Import',
      description: 'Import reference documents, PDF text, or research materials to use as context.'
    },
    {
      icon: FileText,
      title: 'Export & Share',
      description: 'Export your sections as text files to integrate with your document editor.'
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className={`${bgClass} rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto`}
      >
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between p-8 border-b border-slate-200 dark:border-slate-700 bg-inherit">
          <div>
            <h2 className={`text-3xl font-black ${textClass}`}>What is a Project?</h2>
            <p className={`text-sm mt-1 ${mutedClass}`}>Understand how ScholarFlow projects work</p>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-100'}`}
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 space-y-8">
          {/* Overview */}
          <div>
            <h3 className={`text-xl font-bold mb-3 ${textClass}`}>Project Overview</h3>
            <p className={`leading-relaxed ${mutedClass}`}>
              A <strong className={textClass}>Project</strong> in ScholarFlow is a complete research paper workspace where you can write, organize, and refine different sections of your academic work. Each project contains sections like Abstract, Introduction, Literature Review, Methodology, Results, Discussion, and Conclusion. You can work on multiple projects simultaneously, each with its own set of documents and AI conversations.
            </p>
          </div>

          {/* Features Grid */}
          <div>
            <h3 className={`text-xl font-bold mb-4 ${textClass}`}>Key Features</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {features.map((feature, idx) => {
                const Icon = feature.icon;
                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className={`p-4 rounded-lg border transition-colors ${isDark ? 'border-slate-700 hover:bg-slate-800/50' : 'border-slate-200 hover:bg-slate-50'}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
                        <Icon size={18} className="text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <div>
                        <h4 className={`font-bold text-sm mb-1 ${textClass}`}>{feature.title}</h4>
                        <p className={`text-sm ${mutedClass}`}>{feature.description}</p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* How It Works */}
          <div>
            <h3 className={`text-xl font-bold mb-4 ${textClass}`}>How to Use</h3>
            <ol className={`space-y-3 ${mutedClass}`}>
              <li className="flex gap-3">
                <span className="font-bold text-indigo-600 dark:text-indigo-400 min-w-fit">1.</span>
                <span>Select a section from the left sidebar (e.g., Introduction)</span>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-indigo-600 dark:text-indigo-400 min-w-fit">2.</span>
                <span>Ask the AI assistant to help with content, structure, or improvements</span>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-indigo-600 dark:text-indigo-400 min-w-fit">3.</span>
                <span>Import reference documents to provide context for the AI</span>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-indigo-600 dark:text-indigo-400 min-w-fit">4.</span>
                <span>Export your sections as text files when ready to use them</span>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-indigo-600 dark:text-indigo-400 min-w-fit">5.</span>
                <span>All work is automatically saved to your database</span>
              </li>
            </ol>
          </div>

          {/* Tips */}
          <div className={`p-4 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-900/50`}>
            <h4 className="font-bold text-indigo-900 dark:text-indigo-400 mb-2">💡 Pro Tips</h4>
            <ul className={`text-sm space-y-2 ${isDark ? 'text-indigo-300' : 'text-indigo-700'}`}>
              <li>• Use specific prompts to get better AI suggestions</li>
              <li>• Import related papers or guidelines for better context</li>
              <li>• Maintain academic tone by referencing your field's standards</li>
              <li>• Save your drafts regularly using the Export feature</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className={`sticky bottom-0 p-6 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3 bg-inherit`}>
          <button
            onClick={onClose}
            className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-all"
          >
            Got it!
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
