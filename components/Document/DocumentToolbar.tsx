import React, { useState, useEffect, useRef, useContext } from 'react';
import {
  History,
  Layout,
  ChevronDown,
  Undo2,
  Redo2,
  Moon,
  Sun,
  Search,
  LayoutGrid,
  FileText,
  LayoutDashboard,
  FileOutput,
  ArrowDownAZ,
  Calendar,
  Command,
  MonitorOff,
  Grid,
  AlertTriangle,
  ListTodo,
  TestTube2,
  Pill,
  Minimize,
  Maximize,
  ChevronsUp,
  ChevronsDown,
  ZoomOut,
  ZoomIn,
  Plus,
  Sparkles,
  Loader2,
  ChevronRight,
  Check,
  UserPlus,
  Printer,
  Settings,
  Edit3,
  ClipboardCopy,
  ClipboardType,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronLeft,
  Users,
  StickyNote,
  FileStack,
} from 'lucide-react';
import { DEFAULT_TEMPLATES } from '../../constants';
import { cleanTextForEMR } from '../../utils/documentUtils';
import { ThemeContext } from '../../contexts/ThemeContext';
import { CloudSyncIndicator } from './CloudSyncIndicator';
import { UISettingsContext } from '../../contexts/UISettingsContext';
import { DocumentContext } from '../../contexts/DocumentContext';

type DocumentToolbarProps = Record<string, never>;

// --- SUB-COMPONENTS FOR MENU SYSTEM ---

const MenuButton: React.FC<{
  label: string;
  isOpen: boolean;
  onClick: () => void;
  onMouseEnter: () => void;
}> = ({ label, isOpen, onClick, onMouseEnter }) => {
  const { isDarkMode } = useContext(ThemeContext);
  return (
    <button
      onMouseDown={e => e.stopPropagation()}
      onClick={e => {
        e.stopPropagation();
        onClick();
      }}
      onMouseEnter={onMouseEnter}
      className={`
                px-3 py-1.5 text-sm select-none rounded-md transition-colors
                ${
                  isOpen
                    ? isDarkMode
                      ? 'bg-white/10 text-white'
                      : 'bg-gray-200 text-gray-900'
                    : isDarkMode
                      ? 'text-gray-300 hover:bg-white/5 hover:text-white'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                }
            `}
    >
      {label}
    </button>
  );
};

const MenuDropdown: React.FC<{
  children: React.ReactNode;
  onClose: () => void;
  className?: string;
}> = ({ children, onClose, className = '' }) => {
  const { isDarkMode } = useContext(ThemeContext);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className={`
                absolute top-full left-0 mt-1 min-w-[240px] py-1.5 rounded-lg shadow-xl border z-50
                animate-in fade-in slide-in-from-top-1 duration-100
                ${isDarkMode ? 'bg-[#1e1e1e] border-gray-700 shadow-black/50' : 'bg-white border-gray-200 shadow-xl'}
                ${className}
            `}
      onClick={e => e.stopPropagation()}
    >
      {children}
    </div>
  );
};

const MenuItem: React.FC<{
  icon?: React.ElementType;
  label: string;
  shortcut?: string;
  onClick: () => void;
  isActive?: boolean;
  isDestructive?: boolean;
  hasSubmenu?: boolean;
  isLoading?: boolean;
  isDisabled?: boolean;
}> = ({
  icon: Icon,
  label,
  shortcut,
  onClick,
  isActive,
  isDestructive,
  hasSubmenu,
  isLoading,
  isDisabled,
}) => {
  const { isDarkMode } = useContext(ThemeContext);
  const FinalIcon = isLoading ? Loader2 : Icon;
  return (
    <button
      onClick={() => !isDisabled && !isLoading && onClick()}
      disabled={isDisabled || isLoading}
      className={`
                w-full px-3 py-1.5 text-left flex items-center gap-3 text-xs group
                ${
                  isActive
                    ? isDarkMode
                      ? 'bg-[#d97757]/20 text-[#d97757]'
                      : 'bg-orange-50 text-[#d97757]'
                    : isDarkMode
                      ? 'hover:bg-white/10 text-gray-200'
                      : 'hover:bg-blue-50 text-gray-800'
                }
                ${isDestructive ? 'text-red-500 hover:text-red-600' : ''}
                ${isDisabled || isLoading ? 'opacity-50 cursor-not-allowed' : ''}
            `}
    >
      <div
        className={`w-4 h-4 flex items-center justify-center ${isActive ? 'opacity-100' : 'opacity-50 group-hover:opacity-100'} `}
      >
        {FinalIcon && <FinalIcon className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''} `} />}
      </div>
      <span className="flex-1 font-medium">{label}</span>
      {shortcut && <span className="text-[10px] opacity-40">{shortcut}</span>}
      {hasSubmenu && <ChevronRight className="w-3 h-3 opacity-40" />}
      {isActive && <Check className="w-3 h-3 ml-2" />}
    </button>
  );
};

const MenuDivider: React.FC = () => {
  const { isDarkMode } = useContext(ThemeContext);
  return <div className={`h-px my-1.5 mx-3 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'} `} />;
};

const MenuHeader: React.FC<{ label: string }> = ({ label }) => {
  const { isDarkMode } = useContext(ThemeContext);
  return (
    <div
      className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider opacity-50 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} `}
    >
      {label}
    </div>
  );
};

// --- MAIN COMPONENT ---

export const DocumentToolbar: React.FC<DocumentToolbarProps> = () => {
  const { isDarkMode, toggleTheme } = useContext(ThemeContext);
  const {
    isFluid,
    showSearch,
    toggleSearch,
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
    isScratchpadOpen,
    setIsScratchpadOpen,
    isOriginalSignoutOpen,
    setIsOriginalSignoutOpen,
    isZenMode,
    toggleZenMode,
    fontSize,
    setFontSize,
    setIsCommandPaletteOpen,
    isSidebarOpen,
    toggleSidebar,
    uiDensity,
    setUiDensity,
    onExpandAll,
    onCollapseAll,
  } = useContext(UISettingsContext);

  const {
    currentContent,
    activeTemplate,
    activeTemplateId,
    setActiveTemplateId,
    undo,
    redo,
    canUndo,
    canRedo,
    documents,
    activeDocumentId,
    switchDocument,
    onAddPatient,
    onSort,
    onCopyAll,
    isProofreading,
    handleProofread,
    isEditing,
    toggleEdit,
    onToggleHistory,
    showHistory,
  } = useContext(DocumentContext);

  const activeDocName = documents.find(d => d.id === activeDocumentId)?.name || 'Patient List';
  const activeDocIndex = documents.findIndex(d => d.id === activeDocumentId);
  const [activeMenu, setActiveMenu] = useState<
    'file' | 'edit' | 'view' | 'sort' | 'template' | null
  >(null);

  const handleEmrCopy = () => {
    const cleanText = cleanTextForEMR(currentContent);
    navigator.clipboard.writeText(cleanText);
    setActiveMenu(null);
  };

  const handlePrint = () => window.print();

  const closeMenu = () => setActiveMenu(null);

  const toggleMenu = (menu: 'file' | 'edit' | 'view' | 'sort' | 'template') => {
    setActiveMenu(activeMenu === menu ? null : menu);
  };

  const handleMenuHover = (menu: 'file' | 'edit' | 'view' | 'sort' | 'template') => {
    if (activeMenu) {
      setActiveMenu(menu);
    }
  };

  const handleNextPage = () => {
    if (activeDocIndex < documents.length - 1) {
      switchDocument(documents[activeDocIndex + 1].id);
    }
  };

  const handlePrevPage = () => {
    if (activeDocIndex > 0) {
      switchDocument(documents[activeDocIndex - 1].id);
    }
  };

  return (
    <div
      className={`h-10 border-b flex items-center justify-between px-4 shrink-0 relative z-20 select-none transition-colors duration-300
            ${isDarkMode ? 'bg-[#151515] border-white/5' : 'bg-[#f3f3f3] border-gray-200'} `}
    >
      <div className="flex items-center gap-1">
        <button
          onClick={toggleSidebar}
          className={`mr-3 p-1.5 rounded-md transition-colors ${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-black'} `}
          title="Toggle Sidebar"
        >
          {isSidebarOpen ? (
            <PanelLeftClose className="w-4 h-4" />
          ) : (
            <PanelLeftOpen className="w-4 h-4" />
          )}
        </button>

        <div className="flex items-center mr-3 bg-black/5 dark:bg-white/5 rounded-md p-0.5">
          <button
            onClick={handlePrevPage}
            disabled={activeDocIndex <= 0}
            className={`p-1 rounded-sm ${isDarkMode ? 'text-gray-400 hover:bg-white/10 disabled:opacity-30' : 'text-gray-600 hover:bg-white disabled:opacity-30'} `}
            title="Previous Page"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setIsDocumentManagerOpen(true)}
            className={`flex items-center gap-2 px-2 py-1 rounded-sm transition-colors text-xs font-semibold max-w-[200px] truncate ${isDarkMode ? 'text-gray-300 hover:bg-white/10' : 'text-gray-700 hover:bg-gray-200'} `}
            title="Manage Sheets"
          >
            <span className="truncate">{activeDocName}</span>
            {documents.length > 1 && (
              <span className="opacity-50 font-normal ml-1">
                {activeDocIndex + 1}/{documents.length}
              </span>
            )}
          </button>

          <button
            onClick={handleNextPage}
            disabled={activeDocIndex >= documents.length - 1}
            className={`p-1 rounded-sm ${isDarkMode ? 'text-gray-400 hover:bg-white/10 disabled:opacity-30' : 'text-gray-600 hover:bg-white disabled:opacity-30'} `}
            title="Next Page"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <button
          onClick={() => onAddPatient?.()}
          className={`mr-3 p-1.5 rounded-md transition-colors flex items-center gap-1.5 text-xs font-medium ${isDarkMode ? 'bg-[#d97757]/10 text-[#d97757] hover:bg-[#d97757]/20' : 'bg-orange-50 text-[#d97757] hover:bg-orange-100'} `}
          title="Add New Patient Sheet"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Add Sheet</span>
        </button>

        <div className={`h-4 w-px mx-1 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-300'} `} />

        <div className="relative">
          <MenuButton
            label="File"
            isOpen={activeMenu === 'file'}
            onClick={() => toggleMenu('file')}
            onMouseEnter={() => handleMenuHover('file')}
          />
          {activeMenu === 'file' && (
            <MenuDropdown onClose={closeMenu}>
              <MenuItem
                icon={UserPlus}
                label="New Patient Sheet"
                onClick={() => {
                  onAddPatient?.();
                  closeMenu();
                }}
              />
              <MenuDivider />
              <MenuItem
                icon={FileOutput}
                label="Generate Handoff"
                onClick={() => {
                  setIsHandoffModalOpen(true);
                  closeMenu();
                }}
              />
              <MenuItem
                icon={StickyNote}
                label="Scratchpad & Team"
                onClick={() => {
                  setIsScratchpadOpen(true);
                  closeMenu();
                }}
                shortcut="Notes"
              />
              <MenuItem
                icon={FileStack}
                label="View Original Signout"
                onClick={() => {
                  setIsOriginalSignoutOpen(true);
                  closeMenu();
                }}
                shortcut="Compare"
              />
              <MenuDivider />
              <MenuItem
                icon={ClipboardType}
                label="Copy Plain Text (EMR)"
                onClick={handleEmrCopy}
                shortcut="Safe"
              />
              <MenuItem
                icon={ClipboardCopy}
                label="Copy All Markdown"
                onClick={() => {
                  onCopyAll();
                  closeMenu();
                }}
                shortcut="Raw"
              />
              <MenuDivider />
              <MenuItem
                icon={Printer}
                label="Print"
                onClick={() => {
                  handlePrint();
                  closeMenu();
                }}
                shortcut="Ctrl+P"
              />
            </MenuDropdown>
          )}
        </div>

        <div className="relative">
          <MenuButton
            label="Edit"
            isOpen={activeMenu === 'edit'}
            onClick={() => toggleMenu('edit')}
            onMouseEnter={() => handleMenuHover('edit')}
          />
          {activeMenu === 'edit' && (
            <MenuDropdown onClose={closeMenu}>
              <MenuItem
                icon={Undo2}
                label="Undo"
                onClick={() => {
                  undo();
                  closeMenu();
                }}
                isDisabled={!canUndo}
                shortcut="Ctrl+Z"
              />
              <MenuItem
                icon={Redo2}
                label="Redo"
                onClick={() => {
                  redo();
                  closeMenu();
                }}
                isDisabled={!canRedo}
                shortcut="Ctrl+Y"
              />
              <MenuDivider />
              <MenuItem
                icon={Edit3}
                label={isEditing ? 'Finish Editing' : 'Enable Edit Mode'}
                onClick={() => {
                  toggleEdit();
                  closeMenu();
                }}
                isActive={isEditing}
              />
              <MenuItem
                icon={Sparkles}
                label={isProofreading ? 'Proofreading...' : 'Proofread with Pro'}
                onClick={() => {
                  handleProofread();
                  closeMenu();
                }}
                isLoading={isProofreading}
              />
              <MenuItem
                icon={Search}
                label="Find..."
                onClick={() => {
                  toggleSearch(true);
                  closeMenu();
                }}
                shortcut="Ctrl+F"
              />
              <MenuDivider />
              <MenuItem
                icon={Settings}
                label="Template Settings"
                onClick={() => {
                  setIsTemplateModalOpen(true);
                  closeMenu();
                }}
              />
            </MenuDropdown>
          )}
        </div>

        <div className="relative">
          <MenuButton
            label="Sort"
            isOpen={activeMenu === 'sort'}
            onClick={() => toggleMenu('sort')}
            onMouseEnter={() => handleMenuHover('sort')}
          />
          {activeMenu === 'sort' && (
            <MenuDropdown onClose={closeMenu}>
              <MenuItem
                icon={ArrowDownAZ}
                label="Sort by Name (A-Z)"
                onClick={() => {
                  onSort('name');
                  closeMenu();
                }}
              />
              <MenuItem
                icon={Calendar}
                label="Sort by Admission Date"
                onClick={() => {
                  onSort('date');
                  closeMenu();
                }}
              />
            </MenuDropdown>
          )}
        </div>

        <div className="relative">
          <MenuButton
            label="View"
            isOpen={activeMenu === 'view'}
            onClick={() => toggleMenu('view')}
            onMouseEnter={() => handleMenuHover('view')}
          />
          {activeMenu === 'view' && (
            <MenuDropdown onClose={closeMenu}>
              <MenuItem
                icon={Command}
                label="Command Palette..."
                onClick={() => {
                  setIsCommandPaletteOpen(true);
                  closeMenu();
                }}
                shortcut="Ctrl+K"
              />
              <MenuItem
                icon={MonitorOff}
                label="Toggle Zen Mode"
                onClick={() => {
                  toggleZenMode();
                  closeMenu();
                }}
                isActive={isZenMode}
              />
              <MenuDivider />
              <MenuHeader label="Display Mode" />
              <MenuItem
                icon={Grid}
                label="Pages View"
                onClick={() => {
                  setViewMode('pages');
                  closeMenu();
                }}
                isActive={viewMode === 'pages'}
              />
              <MenuItem
                icon={LayoutGrid}
                label="Card View"
                onClick={() => {
                  setViewMode('cards');
                  closeMenu();
                }}
                isActive={viewMode === 'cards'}
              />
              <MenuItem
                icon={FileText}
                label="Document View"
                onClick={() => {
                  setViewMode('document');
                  closeMenu();
                }}
                isActive={viewMode === 'document'}
              />
              <MenuItem
                icon={LayoutDashboard}
                label="Dashboard View"
                onClick={() => {
                  setViewMode('dashboard');
                  closeMenu();
                }}
                isActive={viewMode === 'dashboard'}
              />
              <MenuItem
                icon={FileOutput}
                label="Handoff View"
                onClick={() => {
                  setViewMode('handoff');
                  closeMenu();
                }}
                isActive={viewMode === 'handoff'}
              />
              <MenuItem
                icon={Users}
                label="IDR Rounds"
                onClick={() => {
                  setViewMode('idr');
                  closeMenu();
                }}
                isActive={viewMode === 'idr'}
              />
              <MenuDivider />
              <MenuHeader label="Focus Views" />
              <MenuItem
                icon={AlertTriangle}
                label="Critical Alerts"
                onClick={() => {
                  setViewMode('critical');
                  closeMenu();
                }}
                isActive={viewMode === 'critical'}
              />
              <MenuItem
                icon={ListTodo}
                label="Plan-Only"
                onClick={() => {
                  setViewMode('plan');
                  closeMenu();
                }}
                isActive={viewMode === 'plan'}
              />
              <MenuItem
                icon={TestTube2}
                label="Labs-Only"
                onClick={() => {
                  setViewMode('labs');
                  closeMenu();
                }}
                isActive={viewMode === 'labs'}
              />
              <MenuItem
                icon={Pill}
                label="Medication-Only"
                onClick={() => {
                  setViewMode('meds');
                  closeMenu();
                }}
                isActive={viewMode === 'meds'}
              />
              <MenuDivider />
              <MenuHeader label="UI Density" />
              <MenuItem
                icon={Minimize}
                label="Compact"
                onClick={() => {
                  setUiDensity('compact');
                  closeMenu();
                }}
                isActive={uiDensity === 'compact'}
              />
              <MenuItem
                icon={Layout}
                label="Normal"
                onClick={() => {
                  setUiDensity('normal');
                  closeMenu();
                }}
                isActive={uiDensity === 'normal'}
              />
              <MenuItem
                icon={Maximize}
                label="Spacious"
                onClick={() => {
                  setUiDensity('spacious');
                  closeMenu();
                }}
                isActive={uiDensity === 'spacious'}
              />
              <MenuDivider />
              <MenuHeader label="Sections" />
              <MenuItem
                icon={ChevronsUp}
                label="Expand All"
                onClick={() => {
                  onExpandAll();
                  closeMenu();
                }}
              />
              <MenuItem
                icon={ChevronsDown}
                label="Collapse All"
                onClick={() => {
                  onCollapseAll();
                  closeMenu();
                }}
              />
              <MenuDivider />
              <div className="flex items-center px-3 py-1 gap-2">
                <button
                  onClick={() => setFontSize(Math.max(10, fontSize - 1))}
                  className={`p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 ${isDarkMode ? 'text-white' : 'text-black'} `}
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span
                  className={`text-xs font-mono w-8 text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} `}
                >
                  {fontSize}px
                </span>
                <button
                  onClick={() => setFontSize(Math.min(24, fontSize + 1))}
                  className={`p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 ${isDarkMode ? 'text-white' : 'text-black'} `}
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
              </div>
            </MenuDropdown>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center bg-black/10 dark:bg-white/5 rounded-lg p-0.5">
          <button
            onClick={undo}
            disabled={!canUndo}
            className={`p-1.5 rounded-md transition-colors ${!canUndo ? 'opacity-30 cursor-not-allowed' : isDarkMode ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-white text-gray-600'} `}
            title="Undo"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <div className="w-px h-4 bg-gray-500/20 mx-0.5" />
          <button
            onClick={redo}
            disabled={!canRedo}
            className={`p-1.5 rounded-md transition-colors ${!canRedo ? 'opacity-30 cursor-not-allowed' : isDarkMode ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-white text-gray-600'} `}
            title="Redo"
          >
            <Redo2 className="w-4 h-4" />
          </button>
        </div>

        <button
          onClick={() => onToggleHistory()}
          className={`p-1.5 rounded-md transition-colors ${
            showHistory
              ? isDarkMode
                ? 'bg-[#d97757]/20 text-[#d97757]'
                : 'bg-orange-100 text-[#d97757]'
              : isDarkMode
                ? 'hover:bg-blue-500/20 text-gray-400 hover:text-blue-400'
                : 'hover:bg-blue-500/20 text-gray-400 hover:text-blue-600'
          } `}
          title="Version History"
        >
          <History className="w-4 h-4" />
        </button>

        <div className="relative">
          <button
            onClick={() => toggleMenu('template')}
            onMouseEnter={() => handleMenuHover('template')}
            className={`flex items-center gap-2 px-2 py-1 rounded text-xs transition-colors ${activeMenu === 'template' ? (isDarkMode ? 'bg-white/10' : 'bg-black/5') : isDarkMode ? 'hover:bg-white/5' : 'hover:bg-black/5'} ${isDarkMode ? 'text-gray-500' : 'text-gray-400'} `}
          >
            <span className="hidden xl:inline">Template:</span>
            <span className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} `}>
              {activeTemplate?.name}
            </span>
            <ChevronDown className="w-3 h-3" />
          </button>

          {activeMenu === 'template' && (
            <MenuDropdown onClose={closeMenu} className="right-0 left-auto">
              {DEFAULT_TEMPLATES.map(template => (
                <MenuItem
                  key={template.id}
                  icon={Layout}
                  label={template.name}
                  onClick={() => {
                    setActiveTemplateId(template.id);
                    closeMenu();
                  }}
                  isActive={activeTemplateId === template.id}
                />
              ))}
            </MenuDropdown>
          )}
        </div>

        <CloudSyncIndicator />

        <button
          onClick={toggleTheme}
          className={`p-1.5 rounded-md transition-colors ${isDarkMode ? 'hover:bg-yellow-500/20 text-gray-400 hover:text-yellow-400' : 'hover:bg-indigo-500/20 text-gray-400 hover:text-indigo-600'} `}
          title="Toggle Theme"
        >
          {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
};
