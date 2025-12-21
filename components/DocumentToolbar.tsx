import React, { useState, useEffect, useRef, useContext } from 'react';
import { 
  FileText, Printer, Settings, Edit3, Sun, Moon, Search, 
  ZoomIn, ZoomOut, Layout, LayoutGrid, PanelLeftClose, 
  PanelLeftOpen, ArrowDownAZ, Calendar, ClipboardCopy, ClipboardType,
  UserPlus, ChevronRight, Check, History, LayoutDashboard, TestTube2, Pill, ListTodo, AlertTriangle, ChevronsDown, ChevronsUp, Maximize, Minimize,
  Sparkles, Loader2, FileOutput, FolderOpen, Command
} from 'lucide-react';
import { cleanTextForEMR } from '../utils/documentUtils';
import { ThemeContext } from '../contexts/ThemeContext';
import { UISettingsContext } from '../contexts/UISettingsContext';
import { DocumentContext } from '../contexts/DocumentContext';

interface DocumentToolbarProps {}

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
        onMouseDown={(e) => e.stopPropagation()} 
        onClick={(e) => { e.stopPropagation(); onClick(); }}
        onMouseEnter={onMouseEnter}
        className={`
            px-3 py-1.5 text-sm select-none rounded-md transition-colors
            ${isOpen 
                ? (isDarkMode ? 'bg-white/10 text-white' : 'bg-gray-200 text-gray-900') 
                : (isDarkMode ? 'text-gray-300 hover:bg-white/5 hover:text-white' : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900')
            }
        `}
    >
        {label}
    </button>
);
}

const MenuDropdown: React.FC<{ 
    children: React.ReactNode; 
    onClose: () => void;
}> = ({ children, onClose }) => {
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
            `}
            onClick={(e) => e.stopPropagation()}
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
}> = ({ icon: Icon, label, shortcut, onClick, isActive, isDestructive, hasSubmenu, isLoading, isDisabled }) => {
    const { isDarkMode } = useContext(ThemeContext);
    const FinalIcon = isLoading ? Loader2 : Icon;
    return (
    <button 
        onClick={() => !isDisabled && !isLoading && onClick()}
        disabled={isDisabled || isLoading}
        className={`
            w-full px-3 py-1.5 text-left flex items-center gap-3 text-xs group
            ${isActive 
                ? (isDarkMode ? 'bg-[#d97757]/20 text-[#d97757]' : 'bg-orange-50 text-[#d97757]') 
                : (isDarkMode ? 'hover:bg-white/10 text-gray-200' : 'hover:bg-blue-50 text-gray-800')
            }
            ${isDestructive ? 'text-red-500 hover:text-red-600' : ''}
            ${(isDisabled || isLoading) ? 'opacity-50 cursor-not-allowed' : ''}
        `}
    >
        <div className={`w-4 h-4 flex items-center justify-center ${isActive ? 'opacity-100' : 'opacity-50 group-hover:opacity-100'}`}>
            {FinalIcon && <FinalIcon className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />}
        </div>
        <span className="flex-1 font-medium">{label}</span>
        {shortcut && <span className="text-[10px] opacity-40">{shortcut}</span>}
        {hasSubmenu && <ChevronRight className="w-3 h-3 opacity-40" />}
        {isActive && <Check className="w-3 h-3 ml-2" />}
    </button>
)};

const MenuDivider: React.FC = () => {
    const { isDarkMode } = useContext(ThemeContext);
    return (<div className={`h-px my-1.5 mx-3 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />);
}

const MenuHeader: React.FC<{ label: string }> = ({ label }) => {
    const { isDarkMode } = useContext(ThemeContext);
    return (<div className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider opacity-50 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
        {label}
    </div>);
}


// --- MAIN COMPONENT ---

export const DocumentToolbar: React.FC<DocumentToolbarProps> = () => {
    const { isDarkMode, toggleTheme } = useContext(ThemeContext);
    const { 
        fontSize, setFontSize, 
        toggleSearch,
        viewMode, setViewMode,
        uiDensity, setUiDensity,
        onCollapseAll, onExpandAll,
        setIsTemplateModalOpen,
        setIsHandoffModalOpen,
        setIsDocumentManagerOpen,
        setIsMacroManagerOpen,
        isSidebarOpen,
        toggleSidebar,
        setIsCommandPaletteOpen
    } = useContext(UISettingsContext);
    const {
        currentContent,
        activeTemplate,
        showHistory, onToggleHistory,
        isProofreading, handleProofread,
        isEditing, toggleEdit,
        onAddPatient,
        onSort,
        onCopyAll,
        documents, activeDocumentId
    } = useContext(DocumentContext);

    const activeDocName = documents.find(d => d.id === activeDocumentId)?.name || 'Patient List';
    const [activeMenu, setActiveMenu] = useState<'file' | 'edit' | 'view' | null>(null);

    const handleEmrCopy = () => {
        const cleanText = cleanTextForEMR(currentContent);
        navigator.clipboard.writeText(cleanText);
        setActiveMenu(null);
    };

    const handlePrint = () => window.print();

    const closeMenu = () => setActiveMenu(null);

    const toggleMenu = (menu: 'file' | 'edit' | 'view') => {
        setActiveMenu(activeMenu === menu ? null : menu);
    };

    const handleMenuHover = (menu: 'file' | 'edit' | 'view') => {
        if (activeMenu) {
            setActiveMenu(menu);
        }
    };

    return (
        <div className={`h-10 border-b flex items-center justify-between px-4 shrink-0 relative z-20 select-none transition-colors duration-300
            ${isDarkMode 
                ? 'bg-[#151515] border-white/5' 
                : 'bg-[#f3f3f3] border-gray-200'
            }`}
        >
            {/* Left: Standard OS Menu Bar */}
            <div className="flex items-center gap-1">
                
                <button 
                    onClick={toggleSidebar}
                    className={`mr-3 p-1.5 rounded-md transition-colors ${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-black'}`}
                    title="Toggle Sidebar"
                >
                   {isSidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
                </button>

                 <button 
                    onClick={() => setIsDocumentManagerOpen(true)}
                    className={`flex items-center gap-2 mr-3 px-2 py-1.5 rounded-md transition-colors ${isDarkMode ? 'text-gray-300 hover:bg-white/10' : 'text-gray-700 hover:bg-gray-200'}`}
                    title="Manage Lists"
                 >
                    <FolderOpen className="w-4 h-4 text-[#d97757]" />
                    <span className="text-sm font-semibold max-w-[150px] truncate">{activeDocName}</span>
                    <ChevronRight className="w-3 h-3 opacity-50 rotate-90" />
                 </button>

                 <div className={`h-4 w-px mx-1 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-300'}`} />

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
                                label="New Patient Entry" 
                                onClick={() => { onAddPatient(); closeMenu(); }} 
                            />
                            <MenuDivider />
                            <MenuItem 
                                icon={FileOutput} 
                                label="Generate Handoff" 
                                onClick={() => { setIsHandoffModalOpen(true); closeMenu(); }} 
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
                                onClick={() => { onCopyAll(); closeMenu(); }} 
                                shortcut="Raw"
                            />
                            <MenuDivider />
                             <MenuItem 
                                icon={Printer} 
                                label="Print" 
                                onClick={() => { handlePrint(); closeMenu(); }} 
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
                                icon={Edit3} 
                                label={isEditing ? "Finish Editing" : "Enable Edit Mode"} 
                                onClick={() => { toggleEdit(); closeMenu(); }} 
                                isActive={isEditing} 
                            />
                             <MenuItem 
                                icon={Sparkles} 
                                label={isProofreading ? "Proofreading..." : "Proofread with Pro"}
                                onClick={() => { handleProofread(); closeMenu(); }}
                                isLoading={isProofreading}
                            />
                            <MenuItem 
                                icon={Search} 
                                label="Find..." 
                                onClick={() => { toggleSearch(true); closeMenu(); }} 
                                shortcut="Ctrl+F"
                            />
                            <MenuDivider />
                             <MenuHeader label="Sort" />
                             <MenuItem 
                                icon={ArrowDownAZ} 
                                label="Sort by Name (A-Z)" 
                                onClick={() => { onSort('name'); closeMenu(); }} 
                            />
                            <MenuItem 
                                icon={Calendar} 
                                label="Sort by Admission Date" 
                                onClick={() => { onSort('date'); closeMenu(); }} 
                            />
                             <MenuDivider />
                            <MenuItem 
                                icon={Command} 
                                label="Custom Macros..." 
                                onClick={() => { setIsMacroManagerOpen(true); closeMenu(); }} 
                            />
                            <MenuItem 
                                icon={Settings} 
                                label="Template Settings" 
                                onClick={() => { setIsTemplateModalOpen(true); closeMenu(); }} 
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
                                onClick={() => { setIsCommandPaletteOpen(true); closeMenu(); }}
                                shortcut="Ctrl+K"
                             />
                            <MenuDivider />
                             <MenuHeader label="Display Mode" />
                            <MenuItem icon={LayoutGrid} label="Card View" onClick={() => { setViewMode('cards'); closeMenu(); }} isActive={viewMode === 'cards'}/>
                            <MenuItem icon={FileText} label="Document View" onClick={() => { setViewMode('document'); closeMenu(); }} isActive={viewMode === 'document'}/>
                            <MenuItem icon={LayoutDashboard} label="Dashboard View" onClick={() => { setViewMode('dashboard'); closeMenu(); }} isActive={viewMode === 'dashboard'}/>
                            <MenuItem icon={FileOutput} label="Handoff View" onClick={() => { setViewMode('handoff'); closeMenu(); }} isActive={viewMode === 'handoff'}/>
                            
                            <MenuDivider />
                            <MenuHeader label="Focus Views" />
                            <MenuItem icon={AlertTriangle} label="Critical Alerts" onClick={() => { setViewMode('critical'); closeMenu(); }} isActive={viewMode === 'critical'}/>
                            <MenuItem icon={ListTodo} label="Plan-Only" onClick={() => { setViewMode('plan'); closeMenu(); }} isActive={viewMode === 'plan'}/>
                            <MenuItem icon={TestTube2} label="Labs-Only" onClick={() => { setViewMode('labs'); closeMenu(); }} isActive={viewMode === 'labs'}/>
                            <MenuItem icon={Pill} label="Medication-Only" onClick={() => { setViewMode('meds'); closeMenu(); }} isActive={viewMode === 'meds'}/>
                            
                            <MenuDivider />
                            <MenuHeader label="UI Density" />
                            <MenuItem icon={Minimize} label="Compact" onClick={() => { setUiDensity('compact'); closeMenu(); }} isActive={uiDensity === 'compact'}/>
                            <MenuItem icon={Layout} label="Normal" onClick={() => { setUiDensity('normal'); closeMenu(); }} isActive={uiDensity === 'normal'}/>
                            <MenuItem icon={Maximize} label="Spacious" onClick={() => { setUiDensity('spacious'); closeMenu(); }} isActive={uiDensity === 'spacious'}/>

                             <MenuDivider />
                            <MenuHeader label="Sections" />
                             <MenuItem 
                                icon={ChevronsUp} 
                                label="Expand All" 
                                onClick={() => { onExpandAll(); closeMenu(); }} 
                            />
                             <MenuItem 
                                icon={ChevronsDown} 
                                label="Collapse All" 
                                onClick={() => { onCollapseAll(); closeMenu(); }} 
                            />

                            <MenuDivider />
                            <div className="flex items-center px-3 py-1 gap-2">
                                <button onClick={() => setFontSize(Math.max(10, fontSize - 1))} className={`p-1 rounded hover:bg-gray-500/20 ${isDarkMode ? 'text-white' : 'text-black'}`}><ZoomOut className="w-4 h-4"/></button>
                                <span className={`text-xs font-mono w-8 text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{fontSize}px</span>
                                <button onClick={() => setFontSize(Math.min(24, fontSize + 1))} className={`p-1 rounded hover:bg-gray-500/20 ${isDarkMode ? 'text-white' : 'text-black'}`}><ZoomIn className="w-4 h-4"/></button>
                            </div>

                        </MenuDropdown>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-4">
                 <button 
                    onClick={() => onToggleHistory()}
                    className={`p-1.5 rounded-md transition-colors ${showHistory 
                        ? (isDarkMode ? 'bg-[#d97757]/20 text-[#d97757]' : 'bg-orange-100 text-[#d97757]')
                        : (isDarkMode ? 'hover:bg-blue-500/20 text-gray-400 hover:text-blue-400' : 'hover:bg-blue-500/20 text-gray-400 hover:text-blue-600')}`}
                    title="Version History"
                 >
                    <History className="w-4 h-4" />
                 </button>

                 <div className={`flex items-center gap-2 px-2 py-1 rounded text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    <span className="hidden xl:inline">Template:</span>
                    <span className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{activeTemplate?.name}</span>
                 </div>

                 <button 
                    onClick={toggleTheme} 
                    className={`p-1.5 rounded-md transition-colors ${isDarkMode ? 'hover:bg-yellow-500/20 text-gray-400 hover:text-yellow-400' : 'hover:bg-indigo-500/20 text-gray-400 hover:text-indigo-600'}`}
                    title="Toggle Theme"
                >
                    {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </button>
            </div>

        </div>
    );
};