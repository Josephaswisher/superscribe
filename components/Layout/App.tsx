import React, { useContext, useEffect } from 'react';
import { DocumentView } from '../Document/DocumentView';
import { ChatInterface } from '../Chat/ChatInterface';
import { useResizable } from '../../hooks/useResizable';
import { UISettingsContext } from '../../contexts/UISettingsContext';
import { DocumentContext } from '../../contexts/DocumentContext';
import { HistorySidebar } from './HistorySidebar';
import { CommandPaletteModal } from '../modals/CommandPaletteModal';
import { OriginalSignoutPanel } from '../Document/OriginalSignoutPanel';
import { MonitorOff } from 'lucide-react';

// Main Layout Component
const MainLayout: React.FC = () => {
  const { showHistory, onToggleHistory, currentVersionId, history, restoreVersion } =
    useContext(DocumentContext);
  const { width: sidebarWidth, startResizing } = useResizable(30);
  const {
    isSidebarOpen,
    isCommandPaletteOpen,
    setIsCommandPaletteOpen,
    isZenMode,
    toggleZenMode,
    isOriginalSignoutOpen,
    setIsOriginalSignoutOpen,
  } = useContext(UISettingsContext);

  // Global Keyboard listener for Command Palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setIsCommandPaletteOpen]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-gray-950 font-sans">
      {/* Left Panel: Chat Interface */}
      {isSidebarOpen && (
        <div
          style={{ width: `${sidebarWidth}%` }}
          className="h-full relative z-10 flex flex-col min-w-[320px] print:hidden shadow-2xl transition-all duration-300 border-r border-gray-800"
        >
          <ChatInterface />
        </div>
      )}

      {/* Drag Handle (Only visible if sidebar is open) */}
      {isSidebarOpen && (
        <div
          onMouseDown={startResizing}
          className="w-1 hover:w-1.5 bg-[#1a1a1a] hover:bg-[#d97757] cursor-col-resize transition-all duration-150 z-50 flex items-center justify-center group print:hidden -ml-0.5"
        >
          <div className="w-[1px] h-8 bg-gray-700 group-hover:bg-white transition-colors" />
        </div>
      )}

      {/* Right Panel: Document/PDF Viewer */}
      <div
        style={{ width: isSidebarOpen ? `${100 - sidebarWidth}%` : '100%' }}
        className="h-full min-w-[350px] print:w-full print:absolute print:inset-0 print:z-50 print:bg-white transition-all duration-300 bg-[#1e1e1e] relative"
      >
        <DocumentView />
        {isZenMode && (
          <button
            onClick={toggleZenMode}
            className="fixed bottom-4 left-4 z-50 p-2 rounded-full bg-gray-800 text-gray-400 hover:text-white shadow-lg border border-gray-700 opacity-50 hover:opacity-100 transition-opacity"
            title="Exit Zen Mode"
          >
            <MonitorOff className="w-4 h-4" />
          </button>
        )}
      </div>

      <HistorySidebar
        isOpen={showHistory}
        onClose={() => onToggleHistory(false)}
        history={history}
        currentVersionId={currentVersionId}
        onRestore={restoreVersion}
      />
      <CommandPaletteModal
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
      />
      {isOriginalSignoutOpen && (
        <OriginalSignoutPanel onClose={() => setIsOriginalSignoutOpen(false)} />
      )}
    </div>
  );
};

export default MainLayout;
