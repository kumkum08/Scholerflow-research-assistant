import React, { useEffect, useId, useRef, useState } from 'react';
import { Send, Loader2, CheckCircle, Upload, BookOpen, Wand2, FileText, Sparkles, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { GlobalWorkerOptions, getDocument } from 'pdfjs-dist';
import { sendMessageToAI, analyzeDocument } from '../services/apiService';
import {
  getAllImportedDocuments, getAllSectionDrafts, ImportedDocument, MessagePayload,
  deleteSectionDraft, saveImportedDocument, saveSectionDraft
} from '../services/dbService';
import { useDarkMode } from '../contexts/DarkModeContext';
import Sidebar from './Sidebar';
import ProjectHeader from './ProjectHeader';
import DocumentAnalysisView, { DocumentAnalysis } from './DocumentAnalysisView';

const SECTIONS = [
  "Abstract", "Introduction", "Literature Review",
  "Methodology", "Results", "Discussion", "Conclusion"
];

GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url
).toString();

const extractReadableText = (content: string) => {
  return content
    .replace(/\r/g, '')
    .replace(/\t/g, ' ')
    .replace(/[ ]{2,}/g, ' ')
    .trim();
};

const extractSummaryPoints = (content: string) => {
  const text = extractReadableText(content);
  const abstractMatch = text.match(/(?:^|\n)(abstract)\s*[:\n]([\s\S]{0,1200})/i);
  const introMatch = text.match(/(?:^|\n)(introduction)\s*[:\n]([\s\S]{0,1200})/i);
  const summarySource = abstractMatch?.[2] || introMatch?.[2] || text.slice(0, 1800);

  const sentences = summarySource
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.replace(/\s+/g, ' ').trim())
    .filter((sentence) => sentence.length > 50 && sentence.length < 260);

  return Array.from(new Set(sentences)).slice(0, 4);
};

const extractReferenceEntries = (content: string) => {
  const text = extractReadableText(content);
  const referencesMatch = text.match(/(?:references|bibliography|works cited)\s*[:\n]([\s\S]*)/i);

  if (!referencesMatch?.[1]) {
    return [];
  }

  const referencesText = referencesMatch[1].replace(/\s+/g, ' ').trim();
  const bracketedEntries = referencesText.match(/\[\d+\][\s\S]*?(?=\s\[\d+\]|\s*$)/g) || [];

  const entries = (bracketedEntries.length > 0 ? bracketedEntries : referencesText.split(/\n+/))
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 20)
    .filter((entry) => /\b(19|20)\d{2}\b/.test(entry) || /^[\[\(]?\d+[\]\)]?/.test(entry))
    .slice(0, 8);

  return Array.from(new Set(entries));
};

const extractCitationMarkers = (content: string) => {
  const lines = extractReadableText(content).split('\n');
  const sectionNames = ['Abstract', 'Introduction', 'Literature Review', 'Methodology', 'Results', 'Discussion', 'Conclusion', 'References'];
  let currentSection = 'Document Body';
  const found: { section: string; citation: string }[] = [];

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    const sectionMatch = sectionNames.find((section) => new RegExp(`^${section}\\b`, 'i').test(line));
    if (sectionMatch) {
      currentSection = sectionMatch;
    }

    const apaMatches = line.match(/\([A-Z][A-Za-z.&\s-]+,\s?(19|20)\d{2}[a-z]?\)/g) || [];
    const ieeeMatches = line.match(/\[\d{1,3}\]/g) || [];
    const narrativeMatches = line.match(/\b[A-Z][A-Za-z-]+(?:\s+et al\.)?,\s?(19|20)\d{2}[a-z]?\b/g) || [];

    [...apaMatches, ...ieeeMatches, ...narrativeMatches].forEach((citation) => {
      found.push({ section: currentSection, citation });
    });
  }

  const unique = found.filter(
    (item, index, array) =>
      array.findIndex((candidate) => candidate.section === item.section && candidate.citation === item.citation) === index
  );

  return unique.slice(0, 10);
};

const extractPdfText = async (file: File) => {
  const buffer = await file.arrayBuffer();
  const pdf = await getDocument({ data: new Uint8Array(buffer) }).promise;
  const pages: string[] = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item) => ('str' in item ? item.str : ''))
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (pageText) {
      pages.push(pageText);
    }
  }

  const extracted = pages.join('\n\n').trim();

  if (!extracted) {
    throw new Error('This PDF does not contain selectable text. If it is a scanned document, please use OCR first or paste the text manually.');
  }

  return extracted;
};

interface MainChatProps {
  userName: string;
  userId: string;
  activeProjectId: string;
  activeProjectName: string;
  onShowUserProfile: () => void;
  onShowProjectInfo: () => void;
  onShowProjectManager: () => void;
  onLogout: () => void;
}

export default function MainChat({
  userName,
  userId,
  activeProjectId,
  activeProjectName,
  onShowUserProfile,
  onShowProjectInfo,
  onShowProjectManager,
  onLogout,
}: MainChatProps) {
  const [activeSection, setActiveSection] = useState("Introduction");
  const [input, setInput] = useState("");
  const [messagesBySection, setMessagesBySection] = useState<Record<string, MessagePayload[]>>({});
  const [importedDocs, setImportedDocs] = useState<ImportedDocument[]>([]);
  const [activeDocumentId, setActiveDocumentId] = useState<number | null>(null);
  const [documentView, setDocumentView] = useState<'read' | 'analyze'>('read');
  const [loading, setLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [documentAnalysis, setDocumentAnalysis] = useState<DocumentAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [importStatus, setImportStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [chatStatus, setChatStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isClearingChat, setIsClearingChat] = useState(false);
  const importInputId = useId();
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const chatStatusTimeoutRef = useRef<number | null>(null);
  const { isDark } = useDarkMode();

  const messages = messagesBySection[activeSection] || [];
  const activeDoc = activeDocumentId ? importedDocs.find(d => d.id === activeDocumentId) : null;

  useEffect(() => {
    const loadSavedData = async () => {
      setMessagesBySection({});
      setImportedDocs([]);
      setActiveDocumentId(null);
      setDocumentView('read');
      setDocumentAnalysis(null);
      setChatStatus(null);

      if (!userId) return;

      if (!activeProjectId) return;

      const drafts = await getAllSectionDrafts(userId, activeProjectId);
      const sectionMap = drafts.reduce<Record<string, MessagePayload[]>>((acc, draft) => {
        acc[draft.section] = draft.messages || [];
        return acc;
      }, {});
      setMessagesBySection(sectionMap);

      const docs = await getAllImportedDocuments(userId, activeProjectId);
      setImportedDocs(docs);
    };
    void loadSavedData();
  }, [activeProjectId, userId]);

  useEffect(() => {
    if (!userId) return;
    if (!activeProjectId) return;
    if (messages.length === 0) return;
    void saveSectionDraft(userId, activeProjectId, activeSection, messages);
  }, [activeProjectId, activeSection, messages, userId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, loading]);

  useEffect(() => {
    if (!chatStatus) {
      return;
    }

    if (chatStatusTimeoutRef.current) {
      window.clearTimeout(chatStatusTimeoutRef.current);
    }

    chatStatusTimeoutRef.current = window.setTimeout(() => {
      setChatStatus(null);
      chatStatusTimeoutRef.current = null;
    }, 2500);

    return () => {
      if (chatStatusTimeoutRef.current) {
        window.clearTimeout(chatStatusTimeoutRef.current);
        chatStatusTimeoutRef.current = null;
      }
    };
  }, [chatStatus]);

  const handleAnalyzeDocument = async () => {
    if (!activeDoc) return;

    setIsAnalyzing(true);
    try {
      const analysis = await analyzeDocument(activeDoc.fileName, activeDoc.content);
      setDocumentAnalysis(analysis);
      setDocumentView('analyze');
    } catch (err) {
      console.error('Error analyzing document:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setInput("");
    const queuedMessages: MessagePayload[] = [...messages, { role: 'user', content: userMsg }];
    setMessagesBySection(prev => ({ ...prev, [activeSection]: queuedMessages }));
    setLoading(true);

    try {
      const response = await sendMessageToAI(userMsg, activeSection);
      setIsOnline(!response.includes("Offline Mode"));
      const nextMessages: MessagePayload[] = [...queuedMessages, { role: 'ai', content: response }];
      setMessagesBySection(prev => ({ ...prev, [activeSection]: nextMessages }));
    } catch (err) {
      setIsOnline(false);
    } finally {
      setLoading(false);
    }
  };

  const handleImportOpen = () => {
    setImportStatus(null);
  };

  const handleClearChat = async () => {
    if (!userId || !activeProjectId || messages.length === 0 || isClearingChat) {
      return;
    }

    const confirmed = window.confirm(`Delete all chat messages from the ${activeSection} section?`);
    if (!confirmed) {
      return;
    }

    setIsClearingChat(true);
    setChatStatus(null);

    try {
      await deleteSectionDraft(userId, activeProjectId, activeSection);
      setMessagesBySection((prev) => ({
        ...prev,
        [activeSection]: [],
      }));
      setChatStatus({ type: 'success', message: `${activeSection} chat deleted successfully.` });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to delete this chat right now.';
      setChatStatus({ type: 'error', message });
    } finally {
      setIsClearingChat(false);
    }
  };

  const readImportedFile = async (file: File) => {
    const extension = file.name.split('.').pop()?.toLowerCase() || '';
    const supportedTextExtensions = ['txt', 'md', 'markdown', 'json', 'csv', 'tsv', 'html', 'htm', 'xml', 'rtf'];

    if (extension === 'pdf' || file.type === 'application/pdf') {
      return extractPdfText(file);
    }

    if (supportedTextExtensions.includes(extension) || file.type.startsWith('text/')) {
      return file.text();
    }

    throw new Error('This file type is not supported yet. Please import a text, markdown, JSON, CSV, HTML, XML, RTF, or text-based PDF document.');
  };

  const handleFileSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      if (!userId) {
        throw new Error('Please sign in again before importing a document.');
      }

      const content = await readImportedFile(file);

      if (!content.trim()) {
        throw new Error('The selected file is empty or could not be read as text.');
      }

      const id = await saveImportedDocument(userId, activeProjectId, file.name, content);
      setImportedDocs(prev => [{ id, userId, projectId: activeProjectId, fileName: file.name, content, importedAt: Date.now() }, ...prev]);
      setActiveDocumentId(id);
      setDocumentView('read');
      setDocumentAnalysis(null);
      setImportStatus({ type: 'success', message: `${file.name} imported successfully.` });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to import this file.';
      setImportStatus({ type: 'error', message });
    } finally {
      event.target.value = '';
    }
  };

  const bgClass = isDark ? 'bg-slate-950' : 'bg-[#F8FAFC]';
  const textClass = isDark ? 'text-slate-100' : 'text-slate-900';
  const cardBgClass = isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200';
  const inputBgClass = isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200';
  const focusRingClass = isDark ? 'focus:ring-indigo-600/30' : 'focus:ring-indigo-500/10';
  const mutedClass = isDark ? 'text-slate-400' : 'text-slate-500';

  const activeDocWordCount = activeDoc ? activeDoc.content.trim().split(/\s+/).filter(Boolean).length : 0;
  const activeDocCharacterCount = activeDoc ? activeDoc.content.length : 0;
  const summaryPoints = activeDoc ? extractSummaryPoints(activeDoc.content) : [];
  const referenceEntries = activeDoc ? extractReferenceEntries(activeDoc.content) : [];
  const citationMarkers = activeDoc ? extractCitationMarkers(activeDoc.content) : [];

  return (
    <div className={`flex h-full w-full ${bgClass} ${textClass} font-sans selection:bg-indigo-100`}>
      <Sidebar
        sections={SECTIONS}
        activeSection={activeSection}
        onSectionChange={(section) => {
          setActiveSection(section);
          setActiveDocumentId(null);
          setDocumentView('read');
          setDocumentAnalysis(null);
          setChatStatus(null);
        }}
        importedDocs={importedDocs}
        activeDocumentId={activeDocumentId}
        onDocumentChange={(id) => {
          setActiveDocumentId(id);
          setDocumentView('read');
          setDocumentAnalysis(null);
        }}
        isOnline={isOnline}
        onUserClick={onShowUserProfile}
        onLogout={onLogout}
      />

      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        {!isDark && <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-gradient-to-b from-indigo-50/20 to-transparent pointer-events-none" />}

        <ProjectHeader
          activeSection={activeSection}
          activeProjectName={activeProjectName}
          userName={userName}
          onProjectInfo={onShowProjectInfo}
          onShowProjectManager={onShowProjectManager}
          onShowUserProfile={onShowUserProfile}
        />

        <div className="flex-1 overflow-y-auto px-4 py-6 md:px-8 md:py-8 z-0">
          <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
          {activeDoc && (
            <div className="min-h-full flex flex-col items-center justify-center">
              {documentView === 'analyze' && documentAnalysis ? (
                <div className="w-full">
                  <DocumentAnalysisView analysis={documentAnalysis} />
                </div>
              ) : (
                <div className="w-full">
                  <div className={`${cardBgClass} border rounded-3xl shadow-xl overflow-hidden`}>
                    <div className={`border-b px-6 py-5 ${isDark ? 'border-slate-700 bg-slate-900/80' : 'border-slate-200 bg-slate-50/90'}`}>
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <div className={`rounded-2xl p-3 ${isDark ? 'bg-slate-800' : 'bg-white'} border ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
                              <FileText size={22} className="text-indigo-600" />
                            </div>
                            <div>
                              <h3 className={`text-2xl font-black italic font-serif ${textClass}`}>{activeDoc.fileName}</h3>
                              <p className={`text-sm ${mutedClass}`}>
                                {activeDocWordCount} words • {activeDocCharacterCount} characters
                              </p>
                            </div>
                          </div>
                          <p className={`max-w-2xl text-sm leading-relaxed ${mutedClass}`}>
                            Use this reader to keep your source material visible in one place while writing. You can switch to analysis anytime for structured feedback.
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                          <div className={`inline-flex rounded-2xl p-1 ${isDark ? 'bg-slate-800' : 'bg-white'} border ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
                            <button
                              onClick={() => setDocumentView('read')}
                              className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
                                documentView === 'read'
                                  ? 'bg-indigo-600 text-white'
                                  : `${mutedClass} hover:text-indigo-600`
                              }`}
                            >
                              Read
                            </button>
                            <button
                              onClick={() => {
                                if (documentAnalysis) {
                                  setDocumentView('analyze');
                                  return;
                                }
                                handleAnalyzeDocument();
                              }}
                              className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
                                documentView === 'analyze'
                                  ? 'bg-indigo-600 text-white'
                                  : `${mutedClass} hover:text-indigo-600`
                              }`}
                            >
                              Analysis
                            </button>
                          </div>

                          <button
                            onClick={handleAnalyzeDocument}
                            disabled={isAnalyzing}
                            className="flex items-center gap-2 text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-50"
                          >
                            {isAnalyzing ? (
                              <>
                                <Loader2 className="animate-spin" size={16} />
                                Analyzing...
                              </>
                            ) : (
                              <>
                                <Sparkles size={16} />
                                Analyze Document
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className={`p-6 ${isDark ? 'bg-slate-950/60' : 'bg-white'}`}>
                      <div className="grid gap-4 mb-6 lg:grid-cols-3">
                        <div className={`rounded-2xl border p-4 ${isDark ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-slate-50'}`}>
                          <h4 className={`text-sm font-bold uppercase tracking-wider mb-3 ${mutedClass}`}>Summary</h4>
                          {summaryPoints.length > 0 ? (
                            <div className="space-y-2">
                              {summaryPoints.map((point, index) => (
                                <p key={index} className={`text-sm leading-6 ${textClass}`}>
                                  {point}
                                </p>
                              ))}
                            </div>
                          ) : (
                            <p className={`text-sm leading-6 ${mutedClass}`}>
                              A summary could not be extracted automatically from this file.
                            </p>
                          )}
                        </div>

                        <div className={`rounded-2xl border p-4 ${isDark ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-slate-50'}`}>
                          <h4 className={`text-sm font-bold uppercase tracking-wider mb-3 ${mutedClass}`}>Reference Entries</h4>
                          {referenceEntries.length > 0 ? (
                            <div className="space-y-2">
                              {referenceEntries.map((reference, index) => (
                                <p key={index} className={`text-sm leading-6 ${textClass}`}>
                                  {reference}
                                </p>
                              ))}
                            </div>
                          ) : (
                            <p className={`text-sm leading-6 ${mutedClass}`}>
                              No clear references section was detected in this document.
                            </p>
                          )}
                        </div>

                        <div className={`rounded-2xl border p-4 ${isDark ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-slate-50'}`}>
                          <h4 className={`text-sm font-bold uppercase tracking-wider mb-3 ${mutedClass}`}>Citation Markers</h4>
                          {citationMarkers.length > 0 ? (
                            <div className="space-y-2">
                              {citationMarkers.map((item, index) => (
                                <p key={`${item.section}-${item.citation}-${index}`} className={`text-sm leading-6 ${textClass}`}>
                                  <span className="font-semibold text-indigo-600 dark:text-indigo-400">{item.section}:</span>{' '}
                                  {item.citation}
                                </p>
                              ))}
                            </div>
                          ) : (
                            <p className={`text-sm leading-6 ${mutedClass}`}>
                              No inline citation markers were detected automatically.
                            </p>
                          )}
                        </div>
                      </div>

                      <div className={`rounded-2xl border ${isDark ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-slate-50'} overflow-hidden`}>
                        <div className={`flex items-center justify-between border-b px-5 py-3 ${isDark ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-white'}`}>
                          <span className={`text-sm font-bold uppercase tracking-wider ${mutedClass}`}>Imported Reference</span>
                          <span className={`text-xs font-semibold ${mutedClass}`}>Read-only</span>
                        </div>
                        <div className="max-h-[28rem] overflow-y-auto px-5 py-4">
                          <pre className={`whitespace-pre-wrap break-words text-sm leading-7 font-sans ${textClass}`}>
                            {activeDoc.content}
                          </pre>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {!activeDoc && (
            <>
              {messages.length === 0 && (
                <div className="min-h-full flex flex-col items-center justify-center text-center max-w-2xl mx-auto py-10">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`w-20 h-20 ${isDark ? 'bg-slate-800' : 'bg-white'} shadow-xl rounded-3xl flex items-center justify-center text-indigo-600 mb-6 border ${cardBgClass}`}
                  >
                    <BookOpen size={36} strokeWidth={1.5} />
                  </motion.div>
                  <h3 className={`text-2xl font-black mb-3 italic font-serif ${textClass}`}>Writing the {activeSection}</h3>
                  <p className={`leading-relaxed font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    I'm ready to assist you. Ask me to help with the structure, provide transition phrases, or explain the standard requirements for this section.
                  </p>
                </div>
              )}

              <AnimatePresence initial={false}>
                {messages.map((msg, i) => (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={i}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[80%] px-7 py-5 rounded-[2rem] leading-relaxed font-medium ${
                      msg.role === 'user'
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100'
                        : `${cardBgClass} border text-slate-700 dark:text-slate-300 shadow-sm`
                    }`}>
                      <p className="text-[15px] whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {loading && (
                <div className="flex justify-start">
                  <div className={`${cardBgClass} border px-6 py-4 rounded-3xl flex items-center gap-4 shadow-sm ${isDark ? 'border-l-4 border-l-indigo-500' : 'border-l-4 border-l-indigo-500'}`}>
                    <Loader2 className="animate-spin text-indigo-600" size={20} />
                    <span className="text-sm font-bold tracking-tight">ANALYZING RESEARCH CONTEXT...</span>
                  </div>
                </div>
              )}
            </>
          )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        <div className={`p-8 ${isDark ? 'bg-slate-900/50' : 'bg-white/50'} backdrop-blur-sm`}>
          <div className="max-w-4xl mx-auto relative group flex flex-col gap-4">
            <div className="flex items-center gap-3 justify-end flex-wrap">
              {!activeDoc && (
                <button
                  onClick={handleClearChat}
                  disabled={messages.length === 0 || isClearingChat}
                  className="flex items-center gap-2 text-sm font-bold bg-red-600 text-white px-5 py-2.5 rounded-xl hover:bg-red-700 transition-all shadow-md active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Trash2 size={16} />
                  {isClearingChat ? 'Deleting...' : 'Clear Chat'}
                </button>
              )}
              <label
                htmlFor={importInputId}
                onClick={handleImportOpen}
                className="flex cursor-pointer items-center gap-2 text-sm font-bold bg-slate-900 dark:bg-slate-700 text-white px-5 py-2.5 rounded-xl hover:bg-slate-800 dark:hover:bg-slate-600 transition-all shadow-md active:scale-95"
              >
                <Upload size={16} />
                Import Document
              </label>
              {activeDoc && (
                <button
                  onClick={handleAnalyzeDocument}
                  disabled={isAnalyzing}
                  className="flex items-center gap-2 text-sm font-bold bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-50"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="animate-spin" size={16} />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Wand2 size={16} />
                      Analyze
                    </>
                  )}
                </button>
              )}

              <input
                id={importInputId}
                type="file"
                accept=".txt,.md,.markdown,.json,.csv,.tsv,.html,.htm,.xml,.rtf,.pdf,text/*,application/pdf"
                className="sr-only"
                onChange={handleFileSelected}
              />
            </div>

            {importStatus && (
              <div
                className={`rounded-xl border px-4 py-3 text-sm font-medium ${
                  importStatus.type === 'success'
                    ? (isDark
                        ? 'border-emerald-900/40 bg-emerald-950/40 text-emerald-300'
                        : 'border-emerald-200 bg-emerald-50 text-emerald-700')
                    : (isDark
                        ? 'border-rose-900/40 bg-rose-950/40 text-rose-300'
                        : 'border-rose-200 bg-rose-50 text-rose-700')
                }`}
              >
                {importStatus.message}
              </div>
            )}

            {chatStatus && (
              <div
                className={`rounded-xl border px-4 py-3 text-sm font-medium ${
                  chatStatus.type === 'success'
                    ? (isDark
                        ? 'border-emerald-900/40 bg-emerald-950/40 text-emerald-300'
                        : 'border-emerald-200 bg-emerald-50 text-emerald-700')
                    : (isDark
                        ? 'border-rose-900/40 bg-rose-950/40 text-rose-300'
                        : 'border-rose-200 bg-rose-50 text-rose-700')
                }`}
              >
                {chatStatus.message}
              </div>
            )}

            <div className="pointer-events-none absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl blur opacity-10 group-focus-within:opacity-20 transition-opacity" />
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
              placeholder={`Consult ScholarFlow about your ${activeSection.toLowerCase()}...`}
              className={`relative w-full border rounded-2xl px-6 py-4 pr-16 text-[15px] font-medium shadow-sm focus:outline-none focus:ring-4 ${focusRingClass} focus:border-indigo-500 transition-all resize-none h-16 ${inputBgClass}`}
              rows={1}
            />
            <button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="absolute right-3 bottom-3 p-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 transition-all shadow-lg active:scale-90"
            >
              <Send size={20} />
            </button>
          </div>
          <div className="flex justify-center gap-6 mt-4 max-w-4xl mx-auto">
            <span className={`text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              <CheckCircle size={12} className="text-emerald-400" /> Verify Citations
            </span>
            <span className={`text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              <CheckCircle size={12} className="text-emerald-400" /> Academic Tone
            </span>
          </div>
        </div>
      </main>
    </div>
  );
}
