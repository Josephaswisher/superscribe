import React, { useEffect, useState, useRef } from 'react';
import { Activity, Clipboard, FileText, Calendar, X, Type } from 'lucide-react';

export interface SlashCommand {
    id: string;
    label: string;
    description: string;
    icon: React.ReactNode;
}

interface SlashCommandMenuProps {
    isOpen: boolean;
    position: { top: number; left: number };
    onClose: () => void;
    onSelect: (command: SlashCommand) => void;
    searchQuery?: string;
}

export const SLASH_COMMANDS: SlashCommand[] = [
    { id: 'vitals', label: 'Vitals', description: 'Insert latest vital signs', icon: <Activity className="w-4 h-4 text-red-500" /> },
    { id: 'plan', label: 'Plan Template', description: 'Insert standard plan structure', icon: <Clipboard className="w-4 h-4 text-blue-500" /> },
    { id: 'date', label: 'Date', description: 'Insert today\'s date', icon: <Calendar className="w-4 h-4 text-green-500" /> },
    { id: 'macro', label: 'Macro', description: 'Search macros', icon: <FileText className="w-4 h-4 text-purple-500" /> },
    { id: 'clear', label: 'Clear Note', description: 'Clear all content (with confirm)', icon: <X className="w-4 h-4 text-gray-500" /> },
    { id: 'text', label: 'Plain Text', description: 'Reset formatting', icon: <Type className="w-4 h-4 text-gray-400" /> },
];

export const SlashCommandMenu: React.FC<SlashCommandMenuProps> = ({
    isOpen,
    position,
    onClose,
    onSelect,
    searchQuery = ''
}) => {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const menuRef = useRef<HTMLDivElement>(null);

    const filteredCommands = SLASH_COMMANDS.filter(cmd =>
        cmd.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cmd.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

    useEffect(() => {
        setSelectedIndex(0);
    }, [searchQuery]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isOpen) return;

            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    setSelectedIndex(prev => (prev + 1) % filteredCommands.length);
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    setSelectedIndex(prev => (prev - 1 + filteredCommands.length) % filteredCommands.length);
                    break;
                case 'Enter':
                    e.preventDefault();
                    if (filteredCommands[selectedIndex]) {
                        onSelect(filteredCommands[selectedIndex]);
                    }
                    break;
                case 'Escape':
                    e.preventDefault();
                    onClose();
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, filteredCommands, selectedIndex, onSelect, onClose]);

    if (!isOpen) return null;

    return (
        <div
            ref={menuRef}
            className="fixed z-[100] w-72 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden animate-in fade-in zoom-in-95 duration-100"
            style={{ top: position.top, left: position.left }}
        >
            <div className="px-3 py-2 text-xs font-medium text-gray-500 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                COMMANDS {searchQuery && `• "${searchQuery}"`}
            </div>
            <div className="max-h-[300px] overflow-y-auto p-1">
                {filteredCommands.length > 0 ? (
                    filteredCommands.map((cmd, idx) => (
                        <button
                            key={cmd.id}
                            onClick={() => onSelect(cmd)}
                            className={`w-full flex items-center gap-3 px-3 py-2 text-left rounded-md text-sm transition-colors ${idx === selectedIndex
                                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                                    : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                                }`}
                        >
                            <div className="flex items-center justify-center w-6 h-6 rounded bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                                {cmd.icon}
                            </div>
                            <div>
                                <div className="font-medium">{cmd.label}</div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">{cmd.description}</div>
                            </div>
                        </button>
                    ))
                ) : (
                    <div className="px-3 py-4 text-center text-xs text-gray-500">
                        No commands match "{searchQuery}"
                    </div>
                )}
            </div>
        </div>
    );
};
