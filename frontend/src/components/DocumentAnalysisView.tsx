import React, { useState } from 'react';
import { ChevronDown, ChevronUp, AlertCircle, CheckCircle, Lightbulb, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDarkMode } from '../contexts/DarkModeContext';

export interface DocumentAnalysis {
  fileName: string;
  documentStructure: {
    section: string;
    exists: boolean;
    feedback: string;
    issues: string[];
    suggestions: string[];
  }[];
  overallQuality: {
    clarity: number;
    academicTone: number;
    structure: number;
    completeness: number;
    overall: number;
  };
  majorIssues: string[];
  improvementSuggestions: string[];
  rewrites?: {
    section: string;
    original: string;
    improved: string;
  }[];
}

interface DocumentAnalysisViewProps {
  analysis: DocumentAnalysis;
}

export default function DocumentAnalysisView({ analysis }: DocumentAnalysisViewProps) {
  const [expandedSections, setExpandedSections] = useState<string[]>(['Overview']);
  const { isDark } = useDarkMode();

  const bgClass = isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200';
  const textClass = isDark ? 'text-slate-100' : 'text-slate-900';
  const mutedClass = isDark ? 'text-slate-400' : 'text-slate-500';
  const cardClass = isDark ? 'bg-slate-800' : 'bg-slate-50';

  const toggleSection = (section: string) => {
    setExpandedSections(prev =>
      prev.includes(section)
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const ScoreBar = ({ score, label }: { score: number; label: string }) => {
    const percentage = (score / 100) * 100;
    const getColor = (val: number) => {
      if (val >= 80) return 'bg-green-500';
      if (val >= 60) return 'bg-yellow-500';
      return 'bg-red-500';
    };

    return (
      <div className="mb-3">
        <div className="flex justify-between mb-1">
          <span className={`text-sm font-semibold ${textClass}`}>{label}</span>
          <span className={`text-sm font-bold text-indigo-600 dark:text-indigo-400`}>{score}/100</span>
        </div>
        <div className={`w-full h-2 rounded-full ${cardClass} overflow-hidden`}>
          <div className={`h-full ${getColor(score)} transition-all duration-500`} style={{ width: `${percentage}%` }} />
        </div>
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`${bgClass} border rounded-lg p-6 space-y-4 mb-6`}
    >
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-slate-200 dark:border-slate-700">
        <BookOpen className="text-indigo-600 dark:text-indigo-400" size={24} />
        <div>
          <h3 className={`text-xl font-bold ${textClass}`}>Document Analysis</h3>
          <p className={`text-sm ${mutedClass}`}>{analysis.fileName}</p>
        </div>
      </div>

      {/* Overall Quality Scores */}
      <motion.div
        className="cursor-pointer"
        onClick={() => toggleSection('Overview')}
      >
        <div className="flex items-center justify-between mb-3">
          <h4 className={`text-lg font-bold ${textClass} flex items-center gap-2`}>
            <CheckCircle size={18} className="text-indigo-600" />
            Overall Quality
          </h4>
          {expandedSections.includes('Overview') ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>

        <AnimatePresence>
          {expandedSections.includes('Overview') && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className={`${cardClass} p-4 rounded-lg space-y-3`}
            >
              <ScoreBar score={analysis.overallQuality.clarity} label="Clarity of Expression" />
              <ScoreBar score={analysis.overallQuality.academicTone} label="Academic Tone" />
              <ScoreBar score={analysis.overallQuality.structure} label="Document Structure" />
              <ScoreBar score={analysis.overallQuality.completeness} label="Completeness" />
              <div className="pt-2 border-t border-slate-300 dark:border-slate-600">
                <div className="flex justify-between items-center">
                  <span className={`text-lg font-bold ${textClass}`}>Overall Score</span>
                  <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                    {analysis.overallQuality.overall}/100
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Major Issues */}
      {analysis.majorIssues.length > 0 && (
        <motion.div
          className="cursor-pointer"
          onClick={() => toggleSection('MajorIssues')}
        >
          <div className="flex items-center justify-between">
            <h4 className={`text-lg font-bold ${textClass} flex items-center gap-2`}>
              <AlertCircle size={18} className="text-red-500" />
              Major Issues ({analysis.majorIssues.length})
            </h4>
            {expandedSections.includes('MajorIssues') ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </div>

          <AnimatePresence>
            {expandedSections.includes('MajorIssues') && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className={`${cardClass} p-4 rounded-lg mt-2 space-y-2`}
              >
                {analysis.majorIssues.map((issue, idx) => (
                  <div key={idx} className="flex gap-3">
                    <span className="text-red-500 font-bold">•</span>
                    <p className={`text-sm ${mutedClass}`}>{issue}</p>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Section-wise Analysis */}
      {analysis.documentStructure.map((section, idx) => (
        <motion.div key={idx} className="cursor-pointer">
          <div
            className="flex items-center justify-between"
            onClick={() => toggleSection(section.section)}
          >
            <h4 className={`text-lg font-bold ${textClass} flex items-center gap-2`}>
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                section.exists ? 'bg-green-500' : 'bg-red-500'
              }`}>
                {section.exists ? '✓' : '✗'}
              </div>
              {section.section}
            </h4>
            {expandedSections.includes(section.section) ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </div>

          <AnimatePresence>
            {expandedSections.includes(section.section) && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className={`${cardClass} p-4 rounded-lg mt-2 space-y-3`}
              >
                {/* Status */}
                <div>
                  <p className={`text-xs font-bold uppercase ${mutedClass} mb-1`}>Status</p>
                  <p className={`text-sm ${textClass}`}>
                    {section.exists ? '✓ Section exists' : '✗ Section is missing'}
                  </p>
                </div>

                {/* Feedback */}
                <div>
                  <p className={`text-xs font-bold uppercase ${mutedClass} mb-1`}>Feedback</p>
                  <p className={`text-sm ${textClass}`}>{section.feedback}</p>
                </div>

                {/* Issues */}
                {section.issues.length > 0 && (
                  <div>
                    <p className={`text-xs font-bold uppercase ${mutedClass} mb-2`}>Issues Found</p>
                    <div className="space-y-1">
                      {section.issues.map((issue, i) => (
                        <div key={i} className="flex gap-2">
                          <span className="text-yellow-500 font-bold">⚠</span>
                          <p className={`text-sm ${mutedClass}`}>{issue}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Suggestions */}
                {section.suggestions.length > 0 && (
                  <div>
                    <p className={`text-xs font-bold uppercase ${mutedClass} mb-2`}>Suggestions</p>
                    <div className="space-y-1">
                      {section.suggestions.map((suggestion, i) => (
                        <div key={i} className="flex gap-2">
                          <Lightbulb size={14} className="text-indigo-500 mt-0.5 flex-shrink-0" />
                          <p className={`text-sm ${textClass}`}>{suggestion}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      ))}

      {/* General Suggestions */}
      {analysis.improvementSuggestions.length > 0 && (
        <motion.div
          className="cursor-pointer"
          onClick={() => toggleSection('Suggestions')}
        >
          <div className="flex items-center justify-between">
            <h4 className={`text-lg font-bold ${textClass} flex items-center gap-2`}>
              <Lightbulb size={18} className="text-indigo-500" />
              General Improvement Suggestions
            </h4>
            {expandedSections.includes('Suggestions') ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </div>

          <AnimatePresence>
            {expandedSections.includes('Suggestions') && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className={`${cardClass} p-4 rounded-lg mt-2 space-y-2`}
              >
                {analysis.improvementSuggestions.map((suggestion, idx) => (
                  <div key={idx} className="flex gap-3">
                    <Lightbulb size={16} className="text-indigo-500 flex-shrink-0 mt-0.5" />
                    <p className={`text-sm ${textClass}`}>{suggestion}</p>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Rewrites (if available) */}
      {analysis.rewrites && analysis.rewrites.length > 0 && (
        <motion.div
          className="cursor-pointer"
          onClick={() => toggleSection('Rewrites')}
        >
          <div className="flex items-center justify-between">
            <h4 className={`text-lg font-bold ${textClass}`}>
              Sample Rewrites ({analysis.rewrites.length})
            </h4>
            {expandedSections.includes('Rewrites') ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </div>

          <AnimatePresence>
            {expandedSections.includes('Rewrites') && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-3 mt-2"
              >
                {analysis.rewrites.map((rewrite, idx) => (
                  <div key={idx} className={`${cardClass} p-4 rounded-lg space-y-2`}>
                    <p className="text-xs font-bold uppercase text-indigo-600 dark:text-indigo-400">
                      {rewrite.section}
                    </p>
                    <div>
                      <p className={`text-xs font-semibold ${mutedClass} mb-1`}>Original:</p>
                      <p className={`text-sm italic ${mutedClass} line-through`}>{rewrite.original}</p>
                    </div>
                    <div>
                      <p className={`text-xs font-semibold text-green-600 dark:text-green-400 mb-1`}>Improved:</p>
                      <p className={`text-sm ${textClass} font-medium`}>{rewrite.improved}</p>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </motion.div>
  );
}
