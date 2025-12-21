import React, { useContext, useState } from 'react';
import { X, FileText, Plus, Trash2, Edit2, Check, FolderOpen } from 'lucide-react';
import { ThemeContext } from '../../contexts/ThemeContext';
import { DocumentContext } from '../../contexts/DocumentContext';

interface DocumentManagerModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const DocumentManagerModal: React.FC<DocumentManagerModalProps> = ({ isOpen, onClose }) => {
    const { isDarkMode } = useContext(ThemeContext);
    const { 
        documents, 
        activeDocumentId, 
        switchDocument, 
        createDocument, 
        deleteDocument, 
        renameDocument 
    } = useContext(DocumentContext);

    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');

    if (!isOpen) return null;

    const handleSwitch = (id: string) => {
        switchDocument(id);
        onClose();
    };

    const handleStartEdit = (e: React.MouseEvent, id: string, currentName: string) => {
        e.stopPropagation();
        setEditingId(id);
        setEditName(currentName);
    };

    const handleSaveEdit = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (editingId && editName.trim()) {
            renameDocument(editingId, editName.trim());
        }
        setEditingId(null);
    };

    const handleDelete = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (confirm("Are you sure you want to delete this list? This cannot be undone.")) {
            deleteDocument(id);
        }
    };

    const handleCreate = () => {
        createDocument();
        onClose(); // Automatically closes and switches to the new doc (handled in context)
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className={`w-full max-w-lg rounded-xl shadow-2xl flex flex-col max-h-[80vh] overflow-hidden ${isDarkMode ? 'bg-[#1e1e1e] border border-gray-700' : 'bg-white'}`}>
                
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-700/50 shrink-0">
                    <div className="flex items-center gap-3">
                        <FolderOpen className="w-5 h-5 text-[#d97757]" />
                        <h3 className={`font-bold text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>My Patient Lists</h3>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-gray-700/50 rounded text-gray-400">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-2">
                    {documents.map(doc => {
                        const isActive = doc.id === activeDocumentId;
                        const isEditingThis = editingId === doc.id;

                        return (
                            <div 
                                key={doc.id}
                                onClick={() => !isEditingThis && handleSwitch(doc.id)}
                                className={`
                                    group flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer
                                    ${isActive 
                                        ? (isDarkMode ? 'bg-[#d97757]/10 border-[#d97757]/50 ring-1 ring-[#d97757]/30' : 'bg-orange-50 border-orange-200') 
                                        : (isDarkMode ? 'bg-gray-800/30 border-gray-700 hover:bg-gray-800' : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm')
                                    }
                                `}
                            >
                                <div className="flex items-center gap-3 overflow-hidden flex-1">
                                    <div className={`p-2 rounded-full ${isActive ? 'bg-[#d97757] text-white' : 'bg-gray-700/30 text-gray-400'}`}>
                                        <FileText className="w-4 h-4" />
                                    </div>
                                    
                                    {isEditingThis ? (
                                        <input 
                                            type="text" 
                                            value={editName}
                                            onChange={(e) => setEditName(e.target.value)}
                                            onClick={(e) => e.stopPropagation()}
                                            className="bg-transparent border-b border-[#d97757] focus:outline-none text-sm font-medium w-full"
                                            autoFocus
                                            onKeyDown={(e) => {
                                                if(e.key === 'Enter') handleSaveEdit(e as any);
                                            }}
                                        />
                                    ) : (
                                        <div className="flex flex-col overflow-hidden">
                                            <span className={`text-sm font-medium truncate ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                                                {doc.name}
                                            </span>
                                            <span className="text-[10px] text-gray-500">
                                                Last modified: {new Date(doc.lastModified).toLocaleDateString()}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {isEditingThis ? (
                                        <button 
                                            onClick={handleSaveEdit}
                                            className="p-1.5 rounded text-green-500 hover:bg-green-500/10"
                                        >
                                            <Check className="w-4 h-4" />
                                        </button>
                                    ) : (
                                        <>
                                            <button 
                                                onClick={(e) => handleStartEdit(e, doc.id, doc.name)}
                                                className="p-1.5 rounded text-gray-400 hover:text-white hover:bg-gray-600"
                                                title="Rename"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            {documents.length > 1 && (
                                                <button 
                                                    onClick={(e) => handleDelete(e, doc.id)}
                                                    className="p-1.5 rounded text-gray-400 hover:text-red-500 hover:bg-red-500/10"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-700/50 bg-black/20">
                    <button 
                        onClick={handleCreate}
                        className="w-full py-2 rounded-lg bg-[#d97757] hover:bg-[#c66a4d] text-white font-medium flex items-center justify-center gap-2 transition-colors shadow-lg"
                    >
                        <Plus className="w-4 h-4" /> Create New List
                    </button>
                </div>

            </div>
        </div>
    );
};