import React, { useState, useContext, useEffect } from 'react';
import { X, Plus, Trash2, Edit2, Check, Save, Command } from 'lucide-react';
import { ThemeContext } from '../../contexts/ThemeContext';
import { MacroContext, Macro } from '../../contexts/MacroContext';

interface MacroManagerModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const MacroManagerModal: React.FC<MacroManagerModalProps> = ({ isOpen, onClose }) => {
    const { isDarkMode } = useContext(ThemeContext);
    const { macros, addMacro, updateMacro, deleteMacro } = useContext(MacroContext);

    const [editingMacro, setEditingMacro] = useState<Macro | null>(null);
    const [newKey, setNewKey] = useState('');
    const [newValue, setNewValue] = useState('');
    
    useEffect(() => {
        if (!isOpen) {
            setEditingMacro(null);
            setNewKey('');
            setNewValue('');
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleAdd = () => {
        if (newKey.trim() && newValue.trim()) {
            addMacro(newKey.trim(), newValue.trim());
            setNewKey('');
            setNewValue('');
        }
    };
    
    const handleUpdate = () => {
        if (editingMacro) {
            updateMacro(editingMacro.id, editingMacro.key, editingMacro.value);
            setEditingMacro(null);
        }
    };
    
    const handleKeyChange = (e: React.ChangeEvent<HTMLInputElement>, macro?: Macro) => {
        let value = e.target.value;
        if (!value.startsWith('.')) {
            value = '.' + value.replace(/ /g, '').toLowerCase();
        }
        if (macro) {
            setEditingMacro({ ...macro, key: value });
        } else {
            setNewKey(value);
        }
    };

    const renderMacroItem = (macro: Macro) => {
        const isEditingThis = editingMacro?.id === macro.id;
        
        if (isEditingThis) {
            return (
                <div className="p-3 bg-gray-700/50 border border-accent-primary/50 rounded-lg space-y-2">
                    <input
                        type="text"
                        value={editingMacro.key}
                        onChange={(e) => handleKeyChange(e, editingMacro)}
                        placeholder=".shortcut"
                        className="w-full bg-black/50 p-2 rounded border border-gray-600 focus:outline-none focus:ring-1 focus:ring-accent-primary"
                    />
                    <textarea
                        value={editingMacro.value}
                        onChange={(e) => setEditingMacro({ ...editingMacro, value: e.target.value })}
                        placeholder="Expansion text..."
                        rows={3}
                        className="w-full bg-black/50 p-2 rounded border border-gray-600 focus:outline-none focus:ring-1 focus:ring-accent-primary text-sm"
                    />
                    <div className="flex justify-end gap-2">
                         <button onClick={() => setEditingMacro(null)} className="p-2 rounded hover:bg-gray-600 text-gray-300"><X className="w-4 h-4" /></button>
                         <button onClick={handleUpdate} className="p-2 rounded bg-green-600 hover:bg-green-500 text-white"><Save className="w-4 h-4" /></button>
                    </div>
                </div>
            );
        }

        return (
            <div className="group flex items-start justify-between p-3 rounded-lg hover:bg-white/5 transition-colors">
                <div className="flex-1 overflow-hidden">
                    <p className="font-mono font-bold text-accent-primary truncate">{macro.key}</p>
                    <p className="text-sm text-gray-400 line-clamp-2 mt-1">{macro.value}</p>
                </div>
                <div className="flex gap-1 pl-4 opacity-0 group-hover:opacity-100">
                    <button onClick={() => setEditingMacro(macro)} className="p-2 rounded hover:bg-gray-600 text-gray-400"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={() => deleteMacro(macro.id)} className="p-2 rounded hover:bg-red-500/10 text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                </div>
            </div>
        );
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className={`w-full max-w-2xl rounded-xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden ${isDarkMode ? 'bg-[#1e1e1e] border border-gray-700' : 'bg-white'}`}>
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-700/50 shrink-0">
                    <div className="flex items-center gap-3">
                        <Command className="w-5 h-5 text-[#d97757]" />
                        <h3 className={`font-bold text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Custom Macro Manager</h3>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-gray-700/50 rounded text-gray-400">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
                    {macros.map(renderMacroItem)}
                </div>

                {/* Add New Form */}
                <div className="p-4 border-t border-gray-700/50 bg-black/20 shrink-0 space-y-2">
                    <h4 className="text-sm font-bold text-gray-300">Add New Macro</h4>
                    <div className="flex items-start gap-2">
                        <input
                            type="text"
                            value={newKey}
                            onChange={handleKeyChange}
                            placeholder=".shortcut"
                            className="w-1/3 bg-black/50 p-2 rounded border border-gray-600 focus:outline-none focus:ring-1 focus:ring-accent-primary"
                        />
                         <textarea
                            value={newValue}
                            onChange={(e) => setNewValue(e.target.value)}
                            placeholder="Enter the text to expand..."
                            rows={1}
                            className="flex-1 bg-black/50 p-2 rounded border border-gray-600 focus:outline-none focus:ring-1 focus:ring-accent-primary text-sm"
                        />
                         <button 
                            onClick={handleAdd}
                            className="p-2 rounded bg-[#d97757] hover:bg-[#c66a4d] text-white self-stretch flex items-center justify-center"
                        >
                            <Plus className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
