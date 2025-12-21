import React, { useContext } from 'react';
import { Plus, FileText, Clock, User, ArrowRight } from 'lucide-react';
import { DocumentContext } from '../../../contexts/DocumentContext';
import { UISettingsContext } from '../../../contexts/UISettingsContext';
import { ThemeContext } from '../../../contexts/ThemeContext';
import { parseRawContent } from '../../../utils/documentUtils';

export const PagesView: React.FC = () => {
    const { documents, activeDocumentId, switchDocument, createDocument } = useContext(DocumentContext);
    const { setViewMode } = useContext(UISettingsContext);
    const { isDarkMode } = useContext(ThemeContext);

    const handleOpen = (id: string) => {
        switchDocument(id);
        setViewMode('cards');
    };

    const handleCreate = () => {
        createDocument();
        setViewMode('cards');
    };

    return (
        <div className={`p-8 min-h-full ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
            <div className="mb-8">
                <h1 className={`text-3xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Pages Overview</h1>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Manage your active documents and patient lists.
                </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Create New Card */}
                <button 
                    onClick={handleCreate}
                    className={`
                        group relative flex flex-col items-center justify-center p-8 rounded-xl border-2 border-dashed transition-all duration-300
                        ${isDarkMode 
                            ? 'border-gray-700 bg-gray-800/30 hover:bg-gray-800 hover:border-gray-500 text-gray-400 hover:text-white' 
                            : 'border-gray-300 bg-gray-50 hover:bg-white hover:border-gray-400 text-gray-500 hover:text-gray-900 hover:shadow-lg'}
                    `}
                >
                    <div className={`p-4 rounded-full mb-4 transition-transform group-hover:scale-110 ${isDarkMode ? 'bg-gray-800' : 'bg-white shadow-sm'}`}>
                        <Plus className="w-8 h-8 text-[#d97757]" />
                    </div>
                    <span className="font-bold text-lg">New Page</span>
                    <span className="text-xs opacity-70 mt-1">Start a fresh list</span>
                </button>

                {/* Existing Document Cards */}
                {documents.map((doc) => {
                    const isActive = doc.id === activeDocumentId;
                    const patientCount = (doc.content.match(/^### /gm) || []).length;
                    const previewText = doc.content.slice(0, 150).replace(/[#*]/g, '') + '...';
                    const lastMod = new Date(doc.lastModified);

                    return (
                        <div 
                            key={doc.id}
                            onClick={() => handleOpen(doc.id)}
                            className={`
                                relative group flex flex-col p-6 rounded-xl border transition-all duration-300 cursor-pointer
                                ${isActive 
                                    ? (isDarkMode ? 'bg-[#d97757]/10 border-[#d97757] ring-1 ring-[#d97757]' : 'bg-orange-50 border-[#d97757] ring-1 ring-[#d97757]') 
                                    : (isDarkMode ? 'bg-[#1e1e1e] border-gray-700 hover:border-gray-500 hover:-translate-y-1' : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-xl hover:-translate-y-1')
                                }
                            `}
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className={`p-2 rounded-lg ${isActive ? 'bg-[#d97757] text-white' : (isDarkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-500')}`}>
                                    <FileText className="w-5 h-5" />
                                </div>
                                {isActive && <span className="text-[10px] font-bold uppercase tracking-wider bg-[#d97757] text-white px-2 py-1 rounded-full">Active</span>}
                            </div>

                            <h3 className={`font-bold text-lg mb-2 truncate ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{doc.name}</h3>
                            
                            <div className={`flex-1 text-xs leading-relaxed mb-6 overflow-hidden ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                                {doc.content ? previewText : <span className="italic opacity-50">Empty document</span>}
                            </div>

                            <div className={`flex items-center justify-between pt-4 border-t ${isDarkMode ? 'border-gray-700 text-gray-400' : 'border-gray-100 text-gray-500'}`}>
                                <div className="flex items-center gap-4 text-xs font-medium">
                                    <div className="flex items-center gap-1.5">
                                        <User className="w-3.5 h-3.5" />
                                        <span>{patientCount}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5" title={lastMod.toLocaleString()}>
                                        <Clock className="w-3.5 h-3.5" />
                                        <span>{lastMod.toLocaleDateString()}</span>
                                    </div>
                                </div>
                                
                                <div className={`opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-2 group-hover:translate-x-0 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                    <ArrowRight className="w-4 h-4" />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};