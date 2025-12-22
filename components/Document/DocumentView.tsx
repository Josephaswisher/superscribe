import React, { useState, useEffect, useMemo, useRef, useContext } from 'react';
import {
  Search,
  ArrowUp,
  Save,
  X,
  User,
  Cloud,
  CloudOff,
  Plus,
  ArrowDownAZ,
  Calendar,
  CheckCircle2,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import { parseRawContent } from '../../utils/documentUtils';
import { generateMockPatients } from '../../utils/generatePatients';
import { useAutosave } from '../../hooks/useAutosave';

// Imported Components
import { DocumentToolbar } from './DocumentToolbar';
import { PatientCard } from './PatientCard';
import { ContinuousDocumentView } from './ContinuousDocumentView';
import { DocumentStats } from './DocumentStats';

// Imports from modals directory
import { TemplateEditorModal } from '../modals/TemplateEditorModal';
import { HandoffModal } from '../modals/HandoffModal';
import { DashboardModal } from '../modals/DashboardModal';
import { DiffViewer } from '../modals/DiffViewer';
import { DocumentManagerModal } from '../modals/DocumentManagerModal';
import { MacroManagerModal } from '../modals/MacroManagerModal';

// Imported Views
import { PlanView } from './views/PlanView';
import { CriticalAlertsView } from './views/CriticalAlertsView';
import { MedsView } from './views/MedsView';
import { LabsView } from './views/LabsView';
import { HandoffView } from './views/HandoffView';
import { PagesView } from './views/PagesView';
import { IDRView } from './views/IDRView';
import { ThemeContext } from '../../contexts/ThemeContext';
import { UISettingsContext } from '../../contexts/UISettingsContext';
import { DocumentContext } from '../../contexts/DocumentContext';
import { ViewSwitcher } from '../ViewSwitcher';
import { Scratchpad } from '../Scratchpad/Scratchpad';

type DocumentViewProps = Record<string, never>;

export const DocumentView: React.FC<DocumentViewProps> = () => {
  const { isDarkMode } = useContext(ThemeContext);
  const {
    isFluid,
    showSearch,
    toggleSearch,
    searchQuery,
    setSearchQuery,
    viewMode,
    setViewMode,
    isTemplateModalOpen,
    setIsTemplateModalOpen,
    isHandoffModalOpen,
    setIsHandoffModalOpen,
    isDocumentManagerOpen,
    setIsDocumentManagerOpen,
    isMacroManagerOpen,
    setIsMacroManagerOpen,
    isZenMode,
    fontSize,
  } = useContext(UISettingsContext);

  const {
    currentContent,
    pendingContent,
    acceptPendingChanges,
    rejectPendingChanges,
    handleManualUpdate,
    activeTemplate,
    onGenerateHandoff,
    handleTemplateUpdate,
    filterMode,
    isEditing,
    toggleEdit,
    onSort,
  } = useContext(DocumentContext);

  const [copiedToast, setCopiedToast] = useState(false);
  const [editContent, setEditContent] = useState(currentContent);
  const AUTOSAVE_KEY = 'superscribe_global_draft';

  // Autosave Hook for Full Page Edit
  const saveStatus = useAutosave(editContent, AUTOSAVE_KEY, isEditing);

  // Global Save Indicator State (For non-full-page edits like Cards/AI)
  const [globalSaveState, setGlobalSaveState] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [deletedSection, setDeletedSection] = useState<{ index: number; content: string } | null>(
    null
  );
  const [isScratchpadOpen, setIsScratchpadOpen] = useState(false);
  const isMounted = useRef(false);

  // Drag and Drop State
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Trigger global save indicator on content change (persisted via Context)
  useEffect(() => {
    if (!isMounted.current) {
      isMounted.current = true;
      return;
    }
    if (!isEditing) {
      setGlobalSaveState('saving');
      const timer = setTimeout(() => {
        setGlobalSaveState('saved');
        const hideTimer = setTimeout(() => {
          setGlobalSaveState('idle');
        }, 2500);
        return () => clearTimeout(hideTimer);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [currentContent, isEditing]);

  // Handoff Modal content state
  const [handoffModalContent, setHandoffModalContent] = useState('');
  const [isGeneratingHandoff, setIsGeneratingHandoff] = useState(false);

  // Search Navigation State
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const [totalMatches, setTotalMatches] = useState(0);

  const globalTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync content updates for editing OR restore draft
  useEffect(() => {
    if (isEditing) {
      const draft = localStorage.getItem(AUTOSAVE_KEY);
      if (draft && draft !== currentContent) {
        setEditContent(draft);
      } else {
        setEditContent(currentContent);
      }
    } else {
      setEditContent(currentContent);
    }
  }, [currentContent, isEditing]);

  // Keyboard Navigation (J/K)
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (viewMode === 'cards' && !isEditing && !showSearch) {
        if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

        if (e.key === 'j') {
          window.scrollBy({ top: 300, behavior: 'smooth' });
        } else if (e.key === 'k') {
          window.scrollBy({ top: -300, behavior: 'smooth' });
        }
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [viewMode, isEditing, showSearch]);

  // Auto-resize global editor
  useEffect(() => {
    if (isEditing && globalTextareaRef.current) {
      globalTextareaRef.current.style.height = 'auto';
      globalTextareaRef.current.style.height = globalTextareaRef.current.scrollHeight + 'px';
    }
  }, [editContent, isEditing]);

  // Reset search index on query change
  useEffect(() => {
    setCurrentMatchIndex(0);
  }, [searchQuery]);

  // Handoff generation logic when modal is opened
  useEffect(() => {
    if (isHandoffModalOpen) {
      const generate = async () => {
        setIsGeneratingHandoff(true);
        setHandoffModalContent('');
        const result = await onGenerateHandoff(currentContent);
        setHandoffModalContent(result);
        setIsGeneratingHandoff(false);
      };
      generate();
    }
  }, [isHandoffModalOpen, currentContent, onGenerateHandoff]);

  // Search Highlight Navigation Logic
  useEffect(() => {
    if (!searchQuery) {
      setTotalMatches(0);
      return;
    }
    const timer = setTimeout(() => {
      const matches = document.querySelectorAll('.superscribe-highlight');
      setTotalMatches(matches.length);
      if (matches.length > 0) {
        const safeIndex = currentMatchIndex % matches.length;
        matches.forEach((el, idx) => {
          const matchEl = el as HTMLElement;
          if (idx === safeIndex) {
            matchEl.classList.add(
              'ring-2',
              'ring-offset-1',
              'ring-orange-500',
              'z-10',
              'relative',
              'bg-orange-500',
              'text-black'
            );
            matchEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
          } else {
            matchEl.classList.remove(
              'ring-2',
              'ring-offset-1',
              'ring-orange-500',
              'z-10',
              'relative',
              'bg-orange-500',
              'text-black'
            );
          }
        });
      }
    }, 150);
    return () => clearTimeout(timer);
  }, [searchQuery, currentMatchIndex, currentContent, viewMode, filterMode]);

  const handleNextMatch = () => {
    if (totalMatches === 0) return;
    setCurrentMatchIndex(prev => (prev + 1) % totalMatches);
  };

  const handlePrevMatch = () => {
    if (totalMatches === 0) return;
    setCurrentMatchIndex(prev => (prev - 1 + totalMatches) % totalMatches);
  };

  const handleManualSave = () => {
    handleManualUpdate(editContent);
    localStorage.removeItem(AUTOSAVE_KEY);
    toggleEdit(false);
  };

  const handleCancelEdit = () => {
    toggleEdit(false);
  };

  const handleToast = () => {
    setCopiedToast(true);
    setTimeout(() => setCopiedToast(false), 2000);
  };

  const parsedSections = useMemo(() => {
    const groups = parseRawContent(currentContent).map((g, i) => ({ ...g, originalIndex: i }));
    if (filterMode === 'tasks' && viewMode !== 'document') {
      return groups.filter(g => g.lines.some(l => l.includes('- [ ]')));
    }
    return groups;
  }, [currentContent, filterMode, viewMode]);

  const handleDeleteSection = (originalIndex: number) => {
    const groups = parseRawContent(currentContent);
    if (originalIndex < 0 || originalIndex >= groups.length) return;

    const sectionToDelete = groups[originalIndex];
    const fullSectionText =
      (sectionToDelete.header === '### Preamble' ? '' : sectionToDelete.header + '\n') +
      sectionToDelete.lines.join('\n');

    // Save for Undo
    setDeletedSection({ index: originalIndex, content: fullSectionText });

    const newGroups = [...groups];
    newGroups.splice(originalIndex, 1);

    const fullText = newGroups
      .map(s => {
        const headerText = s.header === '### Preamble' ? '' : s.header;
        const contentText = s.lines.join('\n');
        return headerText ? `${headerText}\n${contentText}` : contentText;
      })
      .join('\n\n')
      .trim();

    handleManualUpdate(fullText);

    // Clear undo after 5 seconds
    setTimeout(() => setDeletedSection(null), 5000);
  };

  const handleUndoDelete = () => {
    if (!deletedSection) return;
    const groups = parseRawContent(currentContent);
    const newGroups = [...groups];

    // Parse the deleted content back into a section object to insert
    const restoredGroups = parseRawContent(deletedSection.content);
    if (restoredGroups.length > 0) {
      const restoredItem = restoredGroups[0];
      // Insert back at original index (or end if out of bounds)
      if (deletedSection.index >= 0 && deletedSection.index <= newGroups.length) {
        newGroups.splice(deletedSection.index, 0, restoredItem);
      } else {
        newGroups.push(restoredItem);
      }

      const fullText = newGroups
        .map(s => {
          const headerText = s.header === '### Preamble' ? '' : s.header;
          const contentText = s.lines.join('\n');
          return headerText ? `${headerText}\n${contentText}` : contentText;
        })
        .join('\n\n')
        .trim();

      handleManualUpdate(fullText);
      setDeletedSection(null);
    }
  };

  const handleSectionUpdate = (index: number, newFullText: string) => {
    const groups = parseRawContent(currentContent);
    let realIndex = -1;
    const isFiltered = filterMode === 'tasks' && viewMode !== 'document';
    if (!isFiltered) {
      realIndex = index;
    } else {
      const sectionToUpdate = parsedSections[index];
      if (!sectionToUpdate) return;
      // Use the originalIndex we added to parsedSections
      realIndex = (sectionToUpdate as any).originalIndex;
    }
    if (realIndex !== -1 && groups[realIndex]) {
      const split = newFullText.split('\n');
      groups[realIndex].header = split[0];
      groups[realIndex].lines = split.slice(1);
      const fullText = groups
        .map(s => (s.header === '### Preamble' ? '' : s.header + '\n') + s.lines.join('\n'))
        .join('\n\n')
        .trim();
      handleManualUpdate(fullText);
    }
  };

  const onDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    const img = new Image();
    img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    e.dataTransfer.setDragImage(img, 0, 0);
  };

  const onDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const onDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) return;

    const groups = parseRawContent(currentContent);
    const movedItem = groups[draggedIndex];
    const remainingItems = groups.filter((_, i) => i !== draggedIndex);

    const newItems = [
      ...remainingItems.slice(0, dropIndex),
      movedItem,
      ...remainingItems.slice(dropIndex),
    ];

    const fullText = newItems
      .map(s => (s.header === '### Preamble' ? '' : s.header + '\n') + s.lines.join('\n'))
      .join('\n\n')
      .trim();

    handleManualUpdate(fullText);
    setDraggedIndex(null);
  };

  const handleAddPatient = () => {
    const groups = parseRawContent(currentContent);
    const patientCount = groups.filter(g => g.header !== '### Preamble').length;
    const nextNum = patientCount + 1;

    const roomInput = window.prompt('Enter Room Number (optional):');
    const roomSuffix = roomInput ? ` - Room ${roomInput}` : ' - Room';

    const newPatientTemplate = `### ${nextNum}. New Patient${roomSuffix}\n**Age:** \n**Admitted for:** \n**CC:** \n\n# Problem 1\n`;

    const newContent = currentContent.trim()
      ? `${currentContent.trim()}\n\n${newPatientTemplate}`
      : newPatientTemplate;

    handleManualUpdate(newContent);
  };

  const handleAddTestData = () => {
    const testData = generateMockPatients(10);
    const newContent = currentContent.trim() ? `${currentContent.trim()}\n${testData}` : testData;
    handleManualUpdate(newContent);
  };

  const containerBgClass = ['cards', 'document'].includes(viewMode)
    ? viewMode === 'document'
      ? 'bg-[#1e1e1e]'
      : isDarkMode
        ? 'bg-[#0a0a0a]'
        : 'bg-gray-100'
    : isDarkMode
      ? 'bg-gray-950'
      : 'bg-gray-50';

  const widthClass =
    viewMode === 'document'
      ? isFluid
        ? 'max-w-none w-[95%]'
        : 'max-w-[8.5in]'
      : 'max-w-none w-full px-4 md:px-8';

  const renderContent = () => {
    switch (viewMode) {
      case 'dashboard':
        return (
          <DashboardModal
            isOpen={true}
            onClose={() => setViewMode('cards')}
            content={currentContent}
          />
        );
      case 'labs':
        return <LabsView content={currentContent} />;
      case 'meds':
        return <MedsView content={currentContent} />;
      case 'plan':
        return <PlanView content={currentContent} />;
      case 'critical':
        return <CriticalAlertsView content={currentContent} />;
      case 'handoff':
        return <HandoffView content={currentContent} />;
      case 'idr':
        return <IDRView content={currentContent} />;
      case 'pages':
        return <PagesView />;
      case 'document':
        return (
          <ContinuousDocumentView
            sections={parsedSections}
            onCopy={text => {
              navigator.clipboard.writeText(text);
              handleToast();
            }}
            onUpdateSection={handleSectionUpdate}
            onDeleteSection={idx => handleDeleteSection((parsedSections[idx] as any).originalIndex)}
            searchQuery={searchQuery}
          />
        );
      case 'cards':
      case 'cards':
      default:
        return (
          <>
            {parsedSections.length === 0 ? (
              <div className="text-center py-20 opacity-50">
                <User className="w-12 h-12 mx-auto mb-4" />
                <h3 className="text-lg font-medium">No Patients</h3>
                <p className="text-sm mb-4">Add a patient to get started.</p>
                <button
                  onClick={handleAddPatient}
                  className="px-4 py-2 bg-[#d97757] text-white rounded-lg text-sm font-medium hover:bg-[#c66a4d] transition-colors"
                >
                  Add First Patient
                </button>
              </div>
            ) : (
              <div className="space-y-6 pb-8">
                {parsedSections.map((section, idx) => (
                  <PatientCard
                    key={`${section.header}-${idx}`}
                    index={idx}
                    header={section.header}
                    lines={section.lines}
                    searchQuery={searchQuery}
                    onUpdateFullSection={text => handleSectionUpdate(idx, text)}
                    // Use originalIndex for robust deletion
                    onDelete={() => handleDeleteSection((section as any).originalIndex)}
                    onCopy={text => {
                      navigator.clipboard.writeText(text);
                      handleToast();
                    }}
                    onDragStart={onDragStart}
                    onDragOver={onDragOver}
                    onDrop={onDrop}
                  />
                ))}
                <div className="flex gap-4">
                  <button
                    onClick={handleAddTestData}
                    className={`flex-1 py-4 rounded-xl border-2 border-dashed flex items-center justify-center gap-2 transition-all opacity-50 hover:opacity-100 ${isDarkMode ? 'border-gray-800 text-gray-500 hover:text-blue-500 hover:border-blue-500' : 'border-gray-300 text-gray-400 hover:text-blue-500 hover:border-blue-500'}`}
                  >
                    <Cloud className="w-5 h-5" />
                    <span>Add Test Data (10)</span>
                  </button>
                  <button
                    onClick={handleAddPatient}
                    className={`flex-1 py-4 rounded-xl border-2 border-dashed flex items-center justify-center gap-2 transition-all ${isDarkMode ? 'border-gray-800 text-gray-500 hover:text-[#d97757] hover:border-[#d97757]' : 'border-gray-300 text-gray-400 hover:text-[#d97757] hover:border-[#d97757]'}`}
                  >
                    <Plus className="w-5 h-5" />
                    <span>Add Another Patient</span>
                  </button>
                </div>
              </div>
            )}
          </>
        );
    }
  };

  return (
    <div
      className={`flex flex-col h-full transition-colors duration-300 relative ${containerBgClass}`}
    >
      {!isZenMode && <DocumentToolbar />}

      {showSearch && (
        <div
          className={`px-4 py-2 border-b animate-in slide-in-from-top-2 ${isDarkMode ? 'bg-[#1e1e1e] border-gray-800' : 'bg-white border-gray-200'}`}
        >
          <div className="relative flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search document..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                autoFocus
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    if (e.shiftKey) handlePrevMatch();
                    else handleNextMatch();
                  }
                }}
                className={`w-full pl-9 pr-4 py-2 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#d97757] ${isDarkMode ? 'bg-black text-gray-200 placeholder-gray-600' : 'bg-gray-100 text-gray-900'}`}
              />
            </div>
            <div
              className={`flex items-center gap-1 border-l pl-2 ${isDarkMode ? 'border-gray-700' : 'border-gray-300'}`}
            >
              <span className="text-xs text-gray-500 min-w-[60px] text-center font-mono">
                {totalMatches > 0 ? `${currentMatchIndex + 1}/${totalMatches}` : '0/0'}
              </span>
              <button
                onClick={handlePrevMatch}
                disabled={totalMatches === 0}
                className="p-1.5 rounded disabled:opacity-30"
              >
                <ChevronUp className="w-4 h-4" />
              </button>
              <button
                onClick={handleNextMatch}
                disabled={totalMatches === 0}
                className="p-1.5 rounded disabled:opacity-30"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  toggleSearch(false);
                  setSearchQuery('');
                }}
                className="p-1.5 rounded hover:text-red-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 md:p-6 relative custom-scrollbar">
        <div
          className={`mx-auto min-h-[800px] pb-20 transition-all duration-300 relative ${!['document', 'cards', 'pages'].includes(viewMode) ? 'max-w-4xl' : widthClass}`}
        >
          {pendingContent ? (
            <DiffViewer
              oldText={currentContent}
              newText={pendingContent}
              onAccept={acceptPendingChanges}
              onReject={rejectPendingChanges}
            />
          ) : isEditing && (viewMode === 'cards' || viewMode === 'document') ? (
            <div className="h-full flex flex-col">
              <div className="fixed bottom-8 right-8 z-50 flex items-center gap-3">
                <button
                  onClick={handleCancelEdit}
                  className="w-12 h-12 rounded-full bg-gray-700 text-white flex items-center justify-center shadow-lg transition-all hover:scale-105"
                  title="Cancel"
                >
                  <X className="w-5 h-5" />
                </button>
                <button
                  onClick={handleManualSave}
                  className="w-12 h-12 rounded-full bg-[#d97757] text-white flex items-center justify-center shadow-lg transition-all hover:scale-105"
                  title="Save Changes"
                >
                  <Save className="w-5 h-5" />
                </button>
              </div>
              <textarea
                ref={globalTextareaRef}
                value={editContent}
                onChange={e => setEditContent(e.target.value)}
                autoFocus
                className={`resize-none focus:outline-none w-full flex-1 ${viewMode === 'document' ? `min-h-[11in] mx-auto shadow-[0_4px_30px_rgba(0,0,0,0.3)] p-12 font-serif leading-relaxed ${isDarkMode ? 'bg-[#2d2d2d] text-gray-200' : 'bg-white text-black'} ${isFluid ? 'max-w-[95%]' : 'max-w-[8.5in]'}` : `p-6 font-mono text-sm ${isDarkMode ? 'bg-[#1a1a1a] text-gray-200' : 'bg-gray-50 text-gray-900'}`}`}
                style={
                  viewMode === 'document' ? { fontSize: `${fontSize}px`, overflow: 'hidden' } : {}
                }
              />
            </div>
          ) : (
            <div>
              {/* View Switcher - Always visible */}
              {!isZenMode && (
                <div className="mb-4 print:hidden">
                  <ViewSwitcher currentView={viewMode} onViewChange={setViewMode} />
                </div>
              )}

              {viewMode === 'cards' && !isZenMode && (
                <div className="flex justify-between items-end mb-6 print:hidden">
                  <div>
                    <h1
                      className={`text-2xl font-bold tracking-tight ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                    >
                      {filterMode === 'tasks' ? 'Pending Tasks' : 'Patient List'}
                    </h1>
                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                      <span className="text-[#d97757] font-medium">{activeTemplate?.name}</span>
                      <span>• {new Date().toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setIsScratchpadOpen(true)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${isDarkMode ? 'bg-amber-900/30 text-amber-300 hover:bg-amber-900/50' : 'bg-amber-100 text-amber-700 hover:bg-amber-200'}`}
                    >
                      📝 Scratchpad
                    </button>
                    <div className="flex items-center gap-1 p-1 rounded-lg border">
                      <button
                        onClick={() => onSort('name')}
                        className="p-1.5 rounded hover:bg-white/10"
                        title="Sort by Name"
                      >
                        <ArrowDownAZ className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onSort('date')}
                        className="p-1.5 rounded hover:bg-white/10"
                        title="Sort by Date"
                      >
                        <Calendar className="w-4 h-4" />
                      </button>
                    </div>
                    <DocumentStats content={currentContent} />
                  </div>
                </div>
              )}
              {renderContent()}
            </div>
          )}
        </div>

        <div
          className={`fixed bottom-4 left-4 z-50 transition-all duration-500 ${globalSaveState === 'idle' ? 'opacity-0' : 'opacity-100'}`}
        >
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-gray-800/80 text-gray-300">
            {globalSaveState === 'saving' ? (
              <ArrowUp className="w-3 h-3 animate-bounce" />
            ) : (
              <CheckCircle2 className="w-3 h-3 text-green-500" />
            )}
            <span>{globalSaveState === 'saving' ? 'Saving...' : 'Saved'}</span>
          </div>
        </div>

        <div
          className={`fixed bottom-8 left-1/2 transform -translate-x-1/2 px-4 py-2 rounded-full bg-green-600 text-white text-sm font-medium shadow-lg transition-all z-[60] ${copiedToast ? 'opacity-100' : 'opacity-0'}`}
        >
          Copied to clipboard
        </div>

        {deletedSection && (
          <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-lg bg-gray-900 border border-gray-700 text-white shadow-xl z-[70] flex items-center gap-4 animate-in slide-in-from-bottom-5">
            <span>Patient deleted.</span>
            <button onClick={handleUndoDelete} className="text-[#d97757] font-bold hover:underline">
              Undo
            </button>
          </div>
        )}

        <button
          onClick={() =>
            document.querySelector('.overflow-y-auto')?.scrollTo({ top: 0, behavior: 'smooth' })
          }
          className="fixed bottom-8 right-8 p-3 rounded-full shadow-xl bg-[#d97757] text-white"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      </div>

      <TemplateEditorModal
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        activeTemplate={activeTemplate}
        onUpdateTemplate={handleTemplateUpdate}
      />
      <HandoffModal
        isOpen={isHandoffModalOpen}
        onClose={() => setIsHandoffModalOpen(false)}
        handoffContent={handoffModalContent}
        isLoading={isGeneratingHandoff}
      />
      <DocumentManagerModal
        isOpen={isDocumentManagerOpen}
        onClose={() => setIsDocumentManagerOpen(false)}
      />
      <MacroManagerModal isOpen={isMacroManagerOpen} onClose={() => setIsMacroManagerOpen(false)} />
      <Scratchpad isOpen={isScratchpadOpen} onClose={() => setIsScratchpadOpen(false)} />
    </div>
  );
};
