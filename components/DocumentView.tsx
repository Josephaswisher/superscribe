import React, { useState, useEffect, useMemo, useRef, useContext } from 'react';
import { Search, ArrowUp, Save, X, ChevronUp, ChevronDown, User, Cloud, CloudOff } from 'lucide-react';
import { parseRawContent } from '../utils/documentUtils';
import { useAutosave } from '../hooks/useAutosave';

// Imported Components
import { DocumentToolbar } from './DocumentToolbar';
import { PatientCard } from './PatientCard';
import { ContinuousDocumentView } from './ContinuousDocumentView';
import { DocumentStats } from './DocumentStats';
// FIX: Corrected casing for modal imports to be consistent with file system (modals).
import { TemplateEditorModal } from './modals/TemplateEditorModal';
import { HandoffModal } from './modals/HandoffModal';
import { DashboardModal } from './modals/DashboardModal';
import { DiffViewer } from './modals/DiffViewer';
import { DocumentManagerModal } from './modals/DocumentManagerModal';
import { MacroManagerModal } from './modals/MacroManagerModal';

// Imported Views
import { PlanView } from './Document/views/PlanView';
import { CriticalAlertsView } from './Document/views/CriticalAlertsView';
import { MedsView } from './Document/views/MedsView';
import { LabsView } from './Document/views/LabsView';
import { HandoffView } from './Document/views/HandoffView';
import { ThemeContext } from '../contexts/ThemeContext';
import { UISettingsContext } from '../contexts/UISettingsContext';
import { DocumentContext } from '../contexts/DocumentContext';

interface DocumentViewProps {}

export const DocumentView: React.FC<DocumentViewProps> = () => {
  const { isDarkMode } = useContext(ThemeContext);
  const {
      isFluid,
      showSearch, toggleSearch,
      searchQuery, setSearchQuery,
      viewMode, setViewMode,
      isTemplateModalOpen, setIsTemplateModalOpen,
      isHandoffModalOpen, setIsHandoffModalOpen,
      isDocumentManagerOpen, setIsDocumentManagerOpen,
      isMacroManagerOpen, setIsMacroManagerOpen,
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
      isEditing, toggleEdit,
  } = useContext(DocumentContext);

  const [copiedToast, setCopiedToast] = useState(false);
  const [editContent, setEditContent] = useState(currentContent);
  const AUTOSAVE_KEY = 'superscribe_global_draft';

  // Autosave Hook
  const saveStatus = useAutosave(editContent, AUTOSAVE_KEY, isEditing);
  
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
                  if (idx === safeIndex) {
                      el.classList.add('ring-2', 'ring-offset-1', 'ring-orange-500', 'z-10', 'relative', 'bg-orange-500', 'text-black');
                      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  } else {
                      el.classList.remove('ring-2', 'ring-offset-1', 'ring-orange-500', 'z-10', 'relative', 'bg-orange-500', 'text-black');
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
      localStorage.removeItem(AUTOSAVE_KEY); // Clear draft on successful save
      toggleEdit(false); 
  };
  
  const handleCancelEdit = () => {
      toggleEdit(false);
  };

  const handleToast = () => { setCopiedToast(true); setTimeout(() => setCopiedToast(false), 2000); }

  const parsedSections = useMemo(() => {
    const groups = parseRawContent(currentContent);
    if (filterMode === 'tasks' && viewMode !== 'document') {
        return groups.filter(g => g.lines.some(l => l.includes('- [ ]')));
    }
    return groups;
  }, [currentContent, filterMode, viewMode]);

  const handleSectionUpdate = (index: number, newFullText: string) => {
      const groups = parseRawContent(currentContent);
      let realIndex = -1;
      const isFiltered = filterMode === 'tasks' && viewMode !== 'document';
      if (!isFiltered) {
          realIndex = index;
      } else {
          const sectionToUpdate = parsedSections[index]; 
          if (!sectionToUpdate) return;
          realIndex = groups.findIndex(g => g.header === sectionToUpdate.header && g.lines.join('\n') === sectionToUpdate.lines.join('\n'));
      }
      if (realIndex !== -1 && groups[realIndex]) {
          const split = newFullText.split('\n');
          groups[realIndex].header = split[0];
          groups[realIndex].lines = split.slice(1);
          const fullText = groups.map(s => 
            (s.header === '### Preamble' ? '' : s.header + '\n') + s.lines.join('\n')
          ).join('\n').trim();
          handleManualUpdate(fullText);
      }
  };

  const handleDeleteSection = (index: number) => {
      const confirmDelete = window.confirm("Are you sure you want to delete this patient?\n\nThis action cannot be undone.");
      if (!confirmDelete) return;

      const groups = parseRawContent(currentContent);
      let realIndex = -1;
      const isFiltered = filterMode === 'tasks' && viewMode !== 'document';
      
      if (!isFiltered) {
          realIndex = index;
      } else {
          const sectionToDelete = parsedSections[index]; 
          if (!sectionToDelete) return;
          realIndex = groups.findIndex(g => g.header === sectionToDelete.header && g.lines.join('\n') === sectionToDelete.lines.join('\n'));
      }

      if (realIndex !== -1) {
          const newGroups = [...groups];
          newGroups.splice(realIndex, 1);
          const fullText = newGroups.map(s => 
            (s.header === '### Preamble' ? '' : s.header + '\n') + s.lines.join('\n')
          ).join('\n').trim();
          handleManualUpdate(fullText);
      }
  };

  const containerBgClass = ['cards', 'document'].includes(viewMode)
    ? (viewMode === 'document' ? 'bg-[#1e1e1e]' : (isDarkMode ? 'bg-[#0a0a0a]' : 'bg-gray-100'))
    : (isDarkMode ? 'bg-gray-950' : 'bg-gray-50');
  
  const widthClass = viewMode === 'document' 
      ? (isFluid ? 'max-w-none w-[95%]' : 'max-w-[8.5in]')
      : 'max-w-none w-full px-4 md:px-8';

  const renderContent = () => {
    switch (viewMode) {
        case 'dashboard': return <DashboardModal isOpen={true} onClose={() => setViewMode('cards')} content={currentContent} />;
        case 'labs': return <LabsView content={currentContent} />;
        case 'meds': return <MedsView content={currentContent} />;
        case 'plan': return <PlanView content={currentContent} />;
        case 'critical': return <CriticalAlertsView content={currentContent} />;
        case 'handoff': return <HandoffView content={currentContent} />;
        case 'document': return <ContinuousDocumentView sections={parsedSections} onCopy={(text) => { navigator.clipboard.writeText(text); handleToast(); }} onUpdateSection={handleSectionUpdate} searchQuery={searchQuery} />;
        case 'cards':
        default: return (
                <>
                  {parsedSections.length === 0 ? (
                      <div className="text-center py-20 opacity-50">
                          <User className="w-12 h-12 mx-auto mb-4" />
                          <h3 className="text-lg font-medium">No Patients</h3>
                          <p className="text-sm">Add a patient to get started.</p>
                      </div>
                  ) : (
                    <div className="space-y-4">
                        {parsedSections.map((section, idx) => (
                            <PatientCard 
                                key={`${section.header}-${idx}`} index={idx} header={section.header} lines={section.lines}
                                searchQuery={searchQuery}
                                onUpdateFullSection={(text) => handleSectionUpdate(idx, text)}
                                onCopy={(text) => { navigator.clipboard.writeText(text); handleToast(); }}
                                onDelete={() => handleDeleteSection(idx)}
                            />
                        ))}
                    </div>
                  )}
                </>
              );
    }
  };

  return (
    <div className={`flex flex-col h-full transition-colors duration-300 relative ${containerBgClass}`}>
      
      <DocumentToolbar />

      {showSearch && (
        <div className={`px-4 py-2 border-b animate-in slide-in-from-top-2 ${isDarkMode ? 'bg-[#1e1e1e] border-gray-800' : 'bg-white border-gray-200'}`}>
           <div className="relative flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
                <input 
                    type="text" placeholder="Search document..." value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)} autoFocus
                    onKeyDown={(e) => { if (e.key === 'Enter') { if (e.shiftKey) handlePrevMatch(); else handleNextMatch(); } }}
                    className={`w-full pl-9 pr-4 py-2 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#d97757] ${isDarkMode ? 'bg-black text-gray-200 placeholder-gray-600' : 'bg-gray-100 text-gray-900'}`}
                />
              </div>
              <div className={`flex items-center gap-1 border-l pl-2 ${isDarkMode ? 'border-gray-700' : 'border-gray-300'}`}>
                   <span className="text-xs text-gray-500 min-w-[60px] text-center font-mono">
                     {totalMatches > 0 ? `${currentMatchIndex + 1}/${totalMatches}` : '0/0'}
                   </span>
                   <button onClick={handlePrevMatch} disabled={totalMatches === 0} className={`p-1.5 rounded transition-colors ${isDarkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-200 text-gray-700'} disabled:opacity-30`} title="Previous Match (Shift+Enter)"><ChevronUp className="w-4 h-4" /></button>
                   <button onClick={handleNextMatch} disabled={totalMatches === 0} className={`p-1.5 rounded transition-colors ${isDarkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-200 text-gray-700'} disabled:opacity-30`} title="Next Match (Enter)"><ChevronDown className="w-4 h-4" /></button>
                   <button onClick={() => { toggleSearch(false); setSearchQuery(''); }} className={`p-1.5 rounded transition-colors hover:text-red-500 ${isDarkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-200 text-gray-500'}`}><X className="w-4 h-4" /></button>
              </div>
           </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 md:p-6 relative custom-scrollbar group/list">
        <div className={`mx-auto min-h-[800px] pb-20 transition-all duration-300 relative print:w-full print:max-w-none ${!['document', 'cards'].includes(viewMode) ? 'max-w-4xl' : widthClass}`}>
          
          {pendingContent ? (
            <DiffViewer oldText={currentContent} newText={pendingContent} onAccept={acceptPendingChanges} onReject={rejectPendingChanges} />
          ) : isEditing && (viewMode === 'cards' || viewMode === 'document') ? (
             <div className={`h-full flex flex-col ${viewMode === 'document' ? '' : 'rounded-xl overflow-hidden border shadow-xl'} ${viewMode === 'document' ? '' : (isDarkMode ? 'bg-[#1e1e1e] border-gray-700' : 'bg-white border-gray-200')}`}>
               <div className="fixed bottom-8 right-8 z-50 flex items-center gap-3 animate-in slide-in-from-bottom-4">
                   {/* Autosave Indicator */}
                   <div className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-2 shadow-lg backdrop-blur transition-all duration-500
                       ${saveStatus === 'saved' ? 'bg-green-500/10 text-green-400' : 
                         saveStatus === 'saving' ? 'bg-blue-500/10 text-blue-400' : 'bg-yellow-500/10 text-yellow-400'}
                   `}>
                       {saveStatus === 'saved' && <Cloud className="w-3 h-3" />}
                       {saveStatus === 'saving' && <ArrowUp className="w-3 h-3 animate-bounce" />}
                       {saveStatus === 'unsaved' && <CloudOff className="w-3 h-3" />}
                       <span>{saveStatus === 'saved' ? 'Saved' : saveStatus === 'saving' ? 'Saving...' : 'Unsaved'}</span>
                   </div>
                   
                   <div className="bg-black/80 backdrop-blur text-white px-4 py-2 rounded-full text-xs font-medium shadow-lg">Full Page Edit</div>
                   <button onClick={handleCancelEdit} className="w-12 h-12 rounded-full bg-gray-700 text-white hover:bg-gray-600 flex items-center justify-center shadow-lg transition-all hover:scale-105" title="Cancel"><X className="w-5 h-5" /></button>
                   <button onClick={handleManualSave} className="w-12 h-12 rounded-full bg-[#d97757] text-white hover:bg-[#c66a4d] flex items-center justify-center shadow-lg shadow-orange-900/30 transition-all hover:scale-105" title="Save Changes"><Save className="w-5 h-5" /></button>
               </div>
               <textarea 
                  ref={globalTextareaRef} value={editContent} onChange={(e) => setEditContent(e.target.value)} autoFocus
                  className={`resize-none focus:outline-none w-full flex-1 ${viewMode === 'document' ? `min-h-[11in] mx-auto shadow-[0_4px_30px_rgba(0,0,0,0.3)] p-12 font-serif leading-relaxed ${isDarkMode ? 'bg-[#2d2d2d] text-gray-200 selection:bg-accent-primary/20' : 'bg-white text-black selection:bg-blue-100'} ${isFluid ? 'max-w-[95%]' : 'max-w-[8.5in]'}` : `p-6 font-mono text-sm ${isDarkMode ? 'bg-[#1a1a1a] text-gray-200' : 'bg-gray-50 text-gray-900'}`}`}
                  style={viewMode === 'document' ? { fontSize: `${useContext(UISettingsContext).fontSize}px`, overflow: 'hidden' } : {}}
               />
            </div>
          ) : (
            <div className={`print:p-0`}>
              {(viewMode === 'cards') && (
                <div className="flex justify-between items-end mb-6 print:hidden">
                    <div>
                        <h1 className={`text-2xl font-bold tracking-tight ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            {filterMode === 'tasks' ? 'Pending Tasks' : 'Patient List'}
                        </h1>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-[#d97757] font-medium">{activeTemplate?.name}</span>
                            <span className="text-xs text-gray-500">• {new Date().toLocaleDateString()}</span>
                        </div>
                    </div>
                  <DocumentStats content={currentContent} />
                </div>
              )}
              {renderContent()}
            </div>
          )}
        </div>
        
        <div className={`fixed bottom-8 left-1/2 transform -translate-x-1/2 px-4 py-2 rounded-full bg-green-600 text-white text-sm font-medium shadow-lg transition-all duration-300 z-[60] ${copiedToast ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            Copied to clipboard
        </div>

        <button onClick={() => document.querySelector('.overflow-y-auto')?.scrollTo({top: 0, behavior: 'smooth'})} className={`fixed bottom-8 right-8 p-3 rounded-full shadow-xl transition-all hover:-translate-y-1 print:hidden z-30 ${isDarkMode ? 'bg-[#d97757] text-white hover:bg-[#e08c70]' : 'bg-white text-gray-900 hover:bg-gray-50'}`}>
            <ArrowUp className="w-5 h-5" />
        </button>
      </div>

      <TemplateEditorModal isOpen={isTemplateModalOpen} onClose={() => setIsTemplateModalOpen(false)} activeTemplate={activeTemplate} onUpdateTemplate={handleTemplateUpdate} />
      <HandoffModal isOpen={isHandoffModalOpen} onClose={() => setIsHandoffModalOpen(false)} handoffContent={handoffModalContent} isLoading={isGeneratingHandoff} />
      <DocumentManagerModal isOpen={isDocumentManagerOpen} onClose={() => setIsDocumentManagerOpen(false)} />
      <MacroManagerModal isOpen={isMacroManagerOpen} onClose={() => setIsMacroManagerOpen(false)} />
    </div>
  );
};