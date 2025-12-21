import React, { useState, useEffect, useRef, useContext } from 'react';
import { 
    X, Search, Command as CommandIcon, Sun, LayoutGrid, FileText, Sparkles, Edit3, UserPlus, 
    ArrowDownAZ, FileOutput, Settings, History, ZoomIn, ZoomOut, ChevronsDown, ChevronsUp, LayoutDashboard, FolderOpen, PanelLeftClose 
} from 'lucide-react';
import { ThemeContext } from '../../contexts/ThemeContext';
import { UISettingsContext } from '../../contexts/UISettingsContext';
import { DocumentContext } from '../../contexts/DocumentContext';

interface CommandPaletteModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface CommandAction {
    id: string;
    name: string;
    description: string;
    icon: React.ElementType;
    category: 'Navigation' | 'Editing' | 'Actions' | 'UI';
    shortcut?: string;
    action: () => void;
}

export const CommandPaletteModal: React.FC<CommandPaletteModalProps> = ({ isOpen, onClose }) => {
    const { isDarkMode, toggleTheme } = useContext(ThemeContext);
    const { 
        setViewMode, toggleSearch, setIsTemplateModalOpen, setIsHandoffModalOpen, 
        setIsDocumentManagerOpen, setFontSize, fontSize, onCollapseAll, onExpandAll,
        toggleSidebar
    } = useContext(UISettingsContext);
    const { 
        handleProofread, toggleEdit, onAddPatient, onSort, onToggleHistory
    } = useContext(DocumentContext);

    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLDivElement>(null);

    // This command list should be memoized to avoid re-creation on every render
    const commands: CommandAction[] = React.useMemo(() => [
        // UI
        { id: 'toggle-theme', name: 'Toggle Theme', description: 'Switch between light and dark mode', icon: Sun, category: 'UI', action: toggleTheme },
        { id: 'toggle-sidebar', name: 'Toggle Sidebar', description: 'Show or hide the chat sidebar', icon: PanelLeftClose, category: 'UI', action: toggleSidebar },
        { id: 'increase-font', name: 'Increase Font Size', description: 'Make document text larger', icon: ZoomIn, category: 'UI', action: () => setFontSize(fontSize + 1) },
        { id: 'decrease-font', name: 'Decrease Font Size', description: 'Make document text smaller', icon: ZoomOut, category: 'UI', action: () => setFontSize(fontSize - 1) },
        { id: 'collapse-all', name: 'Collapse All Sections', description: 'Collapse all patient cards/sections', icon: ChevronsDown, category: 'UI', action: onCollapseAll },
        { id: 'expand-all', name: 'Expand All Sections', description: 'Expand all patient cards/sections', icon: ChevronsUp, category: 'UI', action: onExpandAll },
        
        // Navigation
        { id: 'view-cards', name: 'Switch to Card View', description: 'View patients as individual cards', icon: LayoutGrid, category: 'Navigation', action: () => setViewMode('cards') },
        { id: 'view-document', name: 'Switch to Document View', description: 'View patients as a single document', icon: FileText, category: 'Navigation', action: () => setViewMode('document') },
        { id: 'view-dashboard', name: 'Switch to Dashboard View', description: 'View high-level patient overview', icon: LayoutDashboard, category: 'Navigation', action: () => setViewMode('dashboard') },
        { id: 'focus-search', name: 'Find in Document...', description: 'Open the document search bar', icon: Search, category: 'Navigation', shortcut: 'Ctrl+F', action: () => toggleSearch(true) },

        // Editing
        { id: 'proofread', name: 'Proofread with Pro', description: 'Use AI to proofread and enhance the note', icon: Sparkles, category: 'Editing', action: handleProofread },
        { id: 'toggle-edit', name: 'Toggle Edit Mode', description: 'Enable or disable full document editing', icon: Edit3, category: 'Editing', action: () => toggleEdit() },
        { id: 'add-patient', name: 'Add New Patient', description: 'Add a new patient entry to the list', icon: UserPlus, category: 'Editing', action: onAddPatient },
        { id: 'sort-name', name: 'Sort by Name', description: 'Sort patient list alphabetically', icon: ArrowDownAZ, category: 'Editing', action: () => onSort('name') },
        
        // Actions
        { id: 'gen-handoff', name: 'Generate Handoff', description: 'Create a sign-out document for the night team', icon: FileOutput, category: 'Actions', action: () => setIsHandoffModalOpen(true) },
        { id: 'open-templates', name: 'Template Settings', description: 'Edit the AI prompt templates', icon: Settings, category: 'Actions', action: () => setIsTemplateModalOpen(true) },
        { id: 'open-docs', name: 'Document Manager', description: 'Switch between, create, or delete patient lists', icon: FolderOpen, category: 'Actions', action: () => setIsDocumentManagerOpen(true) },
        { id: 'toggle-history', name: 'Toggle Version History', description: 'Show or hide the document version history', icon: History, category: 'Actions', action: () => onToggleHistory() },
    ], [
        toggleTheme, toggleSidebar, setFontSize, fontSize, onCollapseAll, onExpandAll, setViewMode, toggleSearch,
        handleProofread, toggleEdit, onAddPatient, onSort, setIsHandoffModalOpen, setIsTemplateModalOpen,
        setIsDocumentManagerOpen, onToggleHistory
    ]);

    const filteredCommands = commands.filter(cmd => 
        cmd.name.toLowerCase().includes(query.toLowerCase()) || 
        cmd.description.toLowerCase().includes(query.toLowerCase()) ||
        cmd.category.toLowerCase().includes(query.toLowerCase())
    );

    useEffect(() => {
        if (isOpen) {
            inputRef.current?.focus();
            setSelectedIndex(0);
        } else {
            setQuery('');
        }
    }, [isOpen]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isOpen) return;
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex(prev => (prev + 1) % filteredCommands.length);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex(prev => (prev - 1 + filteredCommands.length) % filteredCommands.length);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                const command = filteredCommands[selectedIndex];
                if (command) {
                    command.action();
                    onClose();
                }
            } else if (e.key === 'Escape') {
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, filteredCommands, selectedIndex, onClose]);

    useEffect(() => {
        listRef.current?.children[selectedIndex]?.scrollIntoView({
            block: 'nearest'
        });
    }, [selectedIndex]);

    if (!isOpen) return null;

    const executeCommand = (cmd: CommandAction) => {
        cmd.action();
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-start justify-center bg-black/50 backdrop-blur-sm pt-[20vh]" onClick={onClose}>
            <div 
                className={`w-full max-w-xl rounded-xl shadow-2xl flex flex-col max-h-[60vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200
                    ${isDarkMode ? 'bg-[#1e1e1e] border border-gray-700' : 'bg-white'}`}
                onClick={e => e.stopPropagation()}
            >
                {/* Search Input */}
                <div className="p-3 border-b border-gray-700/50 flex items-center gap-3">
                    <Search className="w-5 h-5 text-gray-500" />
                    <input 
                        ref={inputRef}
                        type="text"
                        placeholder="Type a command or search..."
                        value={query}
                        onChange={e => {
                            setQuery(e.target.value);
                            setSelectedIndex(0);
                        }}
                        className="w-full bg-transparent focus:outline-none text-base text-gray-200"
                    />
                    <button onClick={onClose} className="text-xs text-gray-500 border border-gray-600 px-1.5 py-0.5 rounded">ESC</button>
                </div>

                {/* Command List */}
                <div ref={listRef} className="flex-1 overflow-y-auto custom-scrollbar p-2">
                    {filteredCommands.length > 0 ? (
                        filteredCommands.map((cmd, index) => (
                            <div
                                key={cmd.id}
                                onClick={() => executeCommand(cmd)}
                                onMouseEnter={() => setSelectedIndex(index)}
                                className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors
                                    ${selectedIndex === index ? (isDarkMode ? 'bg-[#d97757]/20' : 'bg-orange-100') : (isDarkMode ? 'hover:bg-white/5' : 'hover:bg-gray-100')}
                                `}
                            >
                                <div className="flex items-center gap-3">
                                    <cmd.icon className={`w-4 h-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                                    <div>
                                        <p className={`font-medium ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>{cmd.name}</p>
                                        <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>{cmd.description}</p>
                                    </div>
                                </div>
                                {cmd.shortcut && (
                                    <span className="text-xs text-gray-500 border border-gray-600 px-1.5 py-0.5 rounded">{cmd.shortcut}</span>
                                )}
                            </div>
                        ))
                    ) : (
                        <div className="text-center p-8 text-gray-500">No results found.</div>
                    )}
                </div>
            </div>
        </div>
    );
};