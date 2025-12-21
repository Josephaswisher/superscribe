import React, { createContext, useState, useEffect, useCallback, useMemo } from 'react';
import { DocumentVersion, DocumentTemplate, SavedDocument } from '../types';
import { INITIAL_DOCUMENT_CONTENT, DEFAULT_TEMPLATES } from '../constants';
import { proofreadWithPro, generateHandoff } from '../services/aiService';
import { parseRawContent, extractNameFromHeader, extractAdmissionDate } from '../utils/documentUtils';

interface DocumentContextType {
  history: DocumentVersion[];
  currentVersionId: string;
  currentContent: string;
  pendingContent: string | null;
  isProofreading: boolean;
  templates: DocumentTemplate[];
  activeTemplateId: string;
  activeTemplate: DocumentTemplate | undefined;
  showHistory: boolean;
  filterMode: 'all' | 'tasks';
  isEditing: boolean;
  toggleEdit: (forceState?: boolean) => void;

  // Multi-Document State
  documents: SavedDocument[];
  activeDocumentId: string;
  createDocument: () => void;
  switchDocument: (id: string) => void;
  renameDocument: (id: string, name: string) => void;
  deleteDocument: (id: string) => void;

  // Actions
  handleDocumentUpdate: (newContent: string) => void;
  acceptPendingChanges: () => void;
  rejectPendingChanges: () => void;
  handleManualUpdate: (newContent: string) => void;
  handleTemplateUpdate: (updatedTemplate: DocumentTemplate) => void;
  restoreVersion: (id: string) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  handleProofread: () => Promise<void>;
  onAddPatient: () => void;
  onGenerateHandoff: (content: string) => Promise<string>;
  onSort: (type: 'name' | 'date') => void;
  onCopyAll: () => void;
  onToggleHistory: (forceState?: boolean) => void;
  setFilterMode: (mode: 'all' | 'tasks') => void;
  setActiveTemplateId: (id: string) => void;
}

export const DocumentContext = createContext<DocumentContextType>(null!);

export const DocumentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // --- MULTI-DOCUMENT STATE ---

  const [documents, setDocuments] = useState<SavedDocument[]>(() => {
    try {
      const savedDocs = localStorage.getItem('superscribe_documents');
      if (savedDocs) {
        const parsed = JSON.parse(savedDocs);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }

      // MIGRATION: Check for legacy single-history data
      const legacyHistory = localStorage.getItem('superscribe_history');
      let legacyContent = INITIAL_DOCUMENT_CONTENT;
      if (legacyHistory) {
        try {
          const parsedHistory = JSON.parse(legacyHistory);
          if (Array.isArray(parsedHistory) && parsedHistory.length > 0) {
            legacyContent = parsedHistory[parsedHistory.length - 1].content;
          }
        } catch (e) { console.warn("Migration failed", e); }
      }

      return [{
        id: 'default',
        name: 'My Patient List',
        content: legacyContent,
        lastModified: Date.now()
      }];
    } catch (e) {
      console.error("Failed to load documents", e);
      return [{ id: 'default', name: 'Error Recovery List', content: '', lastModified: Date.now() }];
    }
  });

  const [activeDocumentId, setActiveDocumentId] = useState<string>(() =>
    localStorage.getItem('superscribe_active_doc_id') || 'default'
  );

  // --- CURRENT DOCUMENT SESSION STATE ---

  const [history, setHistory] = useState<DocumentVersion[]>([]);
  const [currentVersionId, setCurrentVersionId] = useState<string>('initial');

  // Initialize history when the active document changes or on mount
  useEffect(() => {
    const activeDoc = documents.find(d => d.id === activeDocumentId) || documents[0];
    if (history.length === 0) {
      const initialVer = {
        id: Date.now().toString(),
        content: activeDoc.content,
        timestamp: new Date(activeDoc.lastModified),
        label: 'Loaded Session'
      };
      setHistory([initialVer]);
      setCurrentVersionId(initialVer.id);
    }
  }, [activeDocumentId]); // eslint-disable-line react-hooks/exhaustive-deps

  const [pendingContent, setPendingContent] = useState<string | null>(null);
  const [isProofreading, setIsProofreading] = useState(false);
  const [activeTemplateId, setActiveTemplateId] = useState<string>('admission-hp');
  const [showHistory, setShowHistory] = useState(false);
  const [filterMode, setFilterMode] = useState<'all' | 'tasks'>('all');
  const [isEditing, setIsEditing] = useState(false);

  // Derived Content
  const currentContent = history.find(v => v.id === currentVersionId)?.content || '';

  // --- PERSISTENCE EFFECTS ---

  // 1. Sync current content to the active document in the 'documents' list
  useEffect(() => {
    setDocuments(prevDocs => prevDocs.map(d => {
      if (d.id === activeDocumentId && d.content !== currentContent) {
        return { ...d, content: currentContent, lastModified: Date.now() };
      }
      return d;
    }));
  }, [currentContent, activeDocumentId]);

  // 2. Persist Documents to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem('superscribe_documents', JSON.stringify(documents));
      localStorage.setItem('superscribe_active_doc_id', activeDocumentId);
    } catch (e) { console.error("Save failed", e); }
  }, [documents, activeDocumentId]);

  // Template Persistence
  const [templates, setTemplates] = useState<DocumentTemplate[]>(() => {
    try {
      const saved = localStorage.getItem('superscribe_templates');
      return saved ? JSON.parse(saved) : DEFAULT_TEMPLATES;
    } catch { return DEFAULT_TEMPLATES; }
  });

  useEffect(() => {
    localStorage.setItem('superscribe_templates', JSON.stringify(templates));
  }, [templates]);


  // --- DOCUMENT MANAGEMENT ACTIONS ---

  const createDocument = useCallback(() => {
    const newDoc: SavedDocument = {
      id: Date.now().toString(),
      name: 'Untitled List',
      content: '',
      lastModified: Date.now()
    };
    setDocuments(prev => [...prev, newDoc]);
    setActiveDocumentId(newDoc.id);
    setHistory([{ id: 'init', content: '', timestamp: new Date(), label: 'New Document' }]);
    setCurrentVersionId('init');
  }, []);

  const switchDocument = useCallback((id: string) => {
    const targetDoc = documents.find(d => d.id === id);
    if (targetDoc) {
      setActiveDocumentId(id);
      const newVer = {
        id: Date.now().toString(),
        content: targetDoc.content,
        timestamp: new Date(targetDoc.lastModified),
        label: 'Session Start'
      };
      setHistory([newVer]);
      setCurrentVersionId(newVer.id);
      setPendingContent(null);
      setIsEditing(false);
    }
  }, [documents]);

  const renameDocument = useCallback((id: string, name: string) => {
    setDocuments(prev => prev.map(d => d.id === id ? { ...d, name } : d));
  }, []);

  const deleteDocument = useCallback((id: string) => {
    setDocuments(prev => {
      const filtered = prev.filter(d => d.id !== id);
      if (id === activeDocumentId) {
        const nextDoc = filtered[0];
        if (nextDoc) {
          setActiveDocumentId(nextDoc.id);
        } else {
          const defaultDoc = { id: 'default', name: 'My Patient List', content: '', lastModified: Date.now() };
          setActiveDocumentId('default');
          return [defaultDoc];
        }
      }
      return filtered;
    });
  }, [activeDocumentId]);


  // --- EDITOR ACTIONS ---

  const activeTemplate = templates.find(t => t.id === activeTemplateId) || templates[0];

  const handleDocumentUpdate = useCallback((newContent: string) => {
    setPendingContent(newContent);
  }, []);

  const handleManualUpdate = useCallback((newContent: string) => {
    const newVersion: DocumentVersion = {
      id: Date.now().toString(),
      content: newContent,
      timestamp: new Date(),
      label: `Manual Edit`
    };
    setHistory(prev => [...prev, newVersion]);
    setCurrentVersionId(newVersion.id);
  }, []);

  // UNDO / REDO
  const canUndo = useMemo(() => {
    const idx = history.findIndex(v => v.id === currentVersionId);
    return idx > 0;
  }, [history, currentVersionId]);

  const canRedo = useMemo(() => {
    const idx = history.findIndex(v => v.id === currentVersionId);
    return idx < history.length - 1;
  }, [history, currentVersionId]);

  const undo = useCallback(() => {
    const idx = history.findIndex(v => v.id === currentVersionId);
    if (idx > 0) {
      setCurrentVersionId(history[idx - 1].id);
    }
  }, [history, currentVersionId]);

  const redo = useCallback(() => {
    const idx = history.findIndex(v => v.id === currentVersionId);
    if (idx < history.length - 1) {
      setCurrentVersionId(history[idx + 1].id);
    }
  }, [history, currentVersionId]);


  const handleProofread = useCallback(async () => {
    if (!activeTemplate) return;
    setIsProofreading(true);
    const proofreadContent = await proofreadWithPro(currentContent, activeTemplate);
    if (proofreadContent && proofreadContent !== currentContent && !proofreadContent.startsWith("Error")) {
      setPendingContent(proofreadContent);
    }
    setIsProofreading(false);
  }, [currentContent, activeTemplate]);

  const acceptPendingChanges = useCallback(() => {
    if (!pendingContent) return;
    const newVersion: DocumentVersion = {
      id: Date.now().toString(),
      content: pendingContent,
      timestamp: new Date(),
      label: `Revision ${history.length + 1}`
    };
    setHistory(prev => [...prev, newVersion]);
    setCurrentVersionId(newVersion.id);
    setPendingContent(null);
  }, [pendingContent, history.length]);

  const rejectPendingChanges = useCallback(() => {
    setPendingContent(null);
  }, []);

  const handleTemplateUpdate = useCallback((updatedTemplate: DocumentTemplate) => {
    setTemplates(prev => prev.map(t => t.id === updatedTemplate.id ? updatedTemplate : t));
  }, []);

  const restoreVersion = useCallback((id: string) => {
    setCurrentVersionId(id);
    setPendingContent(null);
  }, []);

  // Updated: Creates a NEW SHEET (Document) for the new patient
  const onAddPatient = useCallback(() => {
    const newDocId = Date.now().toString();
    const newDocName = `New Patient ${documents.length + 1}`;

    // Simple default template for new sheet
    const initialContent = `### 1. New Patient - Room\n**Age:** \n**Admitted:** \n\n# Problem 1\n`;

    const newDoc: SavedDocument = {
      id: newDocId,
      name: newDocName,
      content: initialContent,
      lastModified: Date.now()
    };

    setDocuments(prev => [...prev, newDoc]);
    setActiveDocumentId(newDocId);
    setHistory([{ id: 'init', content: initialContent, timestamp: new Date(), label: 'New Patient Sheet' }]);
    setCurrentVersionId('init');
  }, [documents.length]);

  const onGenerateHandoff = useCallback(async (content: string) => {
    return await generateHandoff(content);
  }, []);

  const onSort = useCallback((type: 'name' | 'date') => {
    const groups = parseRawContent(currentContent);
    groups.sort((a, b) => {
      if (a.header === '### Preamble') return -1;
      if (b.header === '### Preamble') return 1;
      if (type === 'name') {
        return extractNameFromHeader(a.header).name.localeCompare(extractNameFromHeader(b.header).name);
      } else if (type === 'date') {
        return extractAdmissionDate(b.lines) - extractAdmissionDate(a.lines);
      }
      return 0;
    });
    let patientCounter = 1;
    const newContent = groups.map(g => {
      if (g.header === '### Preamble') return g.lines.join('\n');
      const { name, room } = extractNameFromHeader(g.header);
      const newHeader = `### ${patientCounter}. ${name}${room ? ` – ${room}` : ''}`;
      patientCounter++;
      return newHeader + '\n' + g.lines.join('\n');
    }).join('\n\n').trim();
    handleManualUpdate(newContent);
  }, [currentContent, handleManualUpdate]);

  const onCopyAll = useCallback(() => {
    navigator.clipboard.writeText(currentContent);
  }, [currentContent]);

  const onToggleHistory = useCallback((forceState?: boolean) => {
    setShowHistory(prev => forceState !== undefined ? forceState : !prev);
  }, []);

  const toggleEdit = useCallback((forceState?: boolean) => {
    setIsEditing(prev => forceState !== undefined ? forceState : !prev);
  }, []);

  const value = useMemo(() => ({
    history,
    currentVersionId,
    currentContent,
    pendingContent,
    isProofreading,
    templates,
    activeTemplateId,
    activeTemplate,
    showHistory,
    filterMode,
    isEditing,
    documents,
    activeDocumentId,
    canUndo,
    canRedo,
    toggleEdit,
    handleDocumentUpdate,
    acceptPendingChanges,
    rejectPendingChanges,
    handleManualUpdate,
    handleTemplateUpdate,
    restoreVersion,
    undo,
    redo,
    handleProofread,
    onAddPatient,
    onGenerateHandoff,
    onSort,
    onCopyAll,
    onToggleHistory,
    setFilterMode,
    setActiveTemplateId,
    createDocument,
    switchDocument,
    renameDocument,
    deleteDocument,
  }), [
    history,
    currentVersionId,
    currentContent,
    pendingContent,
    isProofreading,
    templates,
    activeTemplateId,
    activeTemplate,
    showHistory,
    filterMode,
    isEditing,
    documents,
    activeDocumentId,
    canUndo,
    canRedo,
    toggleEdit,
    handleDocumentUpdate,
    acceptPendingChanges,
    rejectPendingChanges,
    handleManualUpdate,
    handleTemplateUpdate,
    restoreVersion,
    undo,
    redo,
    handleProofread,
    onAddPatient,
    onGenerateHandoff,
    onSort,
    onCopyAll,
    onToggleHistory,
    createDocument,
    switchDocument,
    renameDocument,
    deleteDocument,
  ]);

  return (
    <DocumentContext.Provider value={value}>
      {children}
    </DocumentContext.Provider>
  );
};