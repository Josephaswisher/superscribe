import React, { useState, useEffect, useContext } from 'react';
import { X, Feather } from 'lucide-react';
import { DocumentTemplate } from '../../types';
import { ThemeContext } from '../../contexts/ThemeContext';

interface TemplateEditorModalProps {
    isOpen: boolean;
    onClose: () => void;
    activeTemplate: DocumentTemplate | undefined;
    onUpdateTemplate: (t: DocumentTemplate) => void;
}

export const TemplateEditorModal: React.FC<TemplateEditorModalProps> = ({ isOpen, onClose, activeTemplate, onUpdateTemplate }) => {
    const { isDarkMode } = useContext(ThemeContext);
    const [structure, setStructure] = useState(activeTemplate?.structure || '');
    const [styleGuide, setStyleGuide] = useState(activeTemplate?.styleGuide || '');
    const [activeTab, setActiveTab] = useState<'structure' | 'style'>('structure');

    useEffect(() => {
        if (activeTemplate) {
            setStructure(activeTemplate.structure);
            setStyleGuide(activeTemplate.styleGuide || '');
        }
    }, [activeTemplate]);

    if (!isOpen || !activeTemplate) return null;

    const handleSave = () => {
        onUpdateTemplate({ ...activeTemplate, structure, styleGuide });
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className={`w-full max-w-2xl rounded-xl shadow-2xl flex flex-col max-h-[85vh] ${isDarkMode ? 'bg-[#1e1e1e] border border-gray-700' : 'bg-white'}`}>
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-700/50">
                    <div>
                        <h3 className={`font-bold text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Edit Template: {activeTemplate.name}</h3>
                        <p className="text-xs text-gray-500">Configure how the AI generates your notes</p>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-gray-700/50 rounded text-gray-400">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                
                {/* Tabs */}
                <div className={`flex border-b ${isDarkMode ? 'border-gray-700/50' : 'border-gray-200'}`}>
                    <button 
                        onClick={() => setActiveTab('structure')}
                        className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'structure' 
                            ? 'border-[#d97757] text-[#d97757]' 
                            : 'border-transparent text-gray-500 hover:text-gray-300'}`}
                    >
                        Prompt Structure
                    </button>
                    <button 
                        onClick={() => setActiveTab('style')}
                        className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'style' 
                            ? 'border-[#d97757] text-[#d97757]' 
                            : 'border-transparent text-gray-500 hover:text-gray-300'}`}
                    >
                        Style & Persona
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 flex-1 overflow-y-auto">
                    {activeTab === 'structure' && (
                        <>
                            <p className="text-sm text-gray-500 mb-4">
                                Define the instructions and structure (headers, keys, layout) for the AI.
                            </p>
                            <textarea 
                                value={structure}
                                onChange={(e) => setStructure(e.target.value)}
                                className={`w-full h-[400px] font-mono text-sm p-4 rounded-lg border focus:ring-2 focus:ring-[#d97757] focus:outline-none resize-none ${isDarkMode ? 'bg-black text-gray-300 border-gray-700' : 'bg-gray-50 text-gray-800 border-gray-200'}`}
                                spellCheck={false}
                            />
                        </>
                    )}
                    
                    {activeTab === 'style' && (
                        <>
                             <div className="mb-4">
                                <h4 className={`text-sm font-bold mb-1 ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>Writing Style & Persona</h4>
                                <p className="text-xs text-gray-500">
                                    Teach the AI how to "sound" like you. Define abbreviations, tone, and sentence structure.
                                </p>
                            </div>
                            
                            <div className={`p-4 rounded-lg border mb-4 ${isDarkMode ? 'bg-blue-900/10 border-blue-700/30 text-blue-200' : 'bg-blue-50 border-blue-200 text-blue-800'}`}>
                                <div className="flex gap-2">
                                    <Feather className="w-4 h-4 mt-0.5 shrink-0" />
                                    <div className="text-xs">
                                        <strong>Pro Tip:</strong> Explicitly list your preferred shorthand (e.g., "Use 'w/' for with", "Use 's/p' for status post") and formatting preferences (e.g., "Use arrow notation for lab trends").
                                    </div>
                                </div>
                            </div>

                             <textarea 
                                value={styleGuide}
                                onChange={(e) => setStyleGuide(e.target.value)}
                                className={`w-full h-[300px] font-mono text-sm p-4 rounded-lg border focus:ring-2 focus:ring-[#d97757] focus:outline-none resize-none ${isDarkMode ? 'bg-black text-gray-300 border-gray-700' : 'bg-gray-50 text-gray-800 border-gray-200'}`}
                                spellCheck={false}
                                placeholder="- Use hospitalist shorthand (w/, c/w, c/b).&#10;- Keep vignettes narrative but dense.&#10;- Use arrow notation for lab trends."
                            />
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-700/50 flex justify-end gap-2">
                    <button onClick={onClose} className="px-4 py-2 rounded text-sm font-medium text-gray-500 hover:text-gray-300">Cancel</button>
                    <button onClick={handleSave} className="px-4 py-2 rounded text-sm font-medium bg-[#d97757] text-white hover:bg-[#c66a4d]">Save Configuration</button>
                </div>
            </div>
        </div>
    );
};
