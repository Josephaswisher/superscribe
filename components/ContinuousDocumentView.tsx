import React, { useState, useRef, useEffect, useContext } from 'react';
import { Copy, ChevronDown, ChevronRight, Trash2 } from 'lucide-react';
import { RichTextLine } from './RichTextLine';
import { ThemeContext } from '../contexts/ThemeContext';
import { UISettingsContext } from '../contexts/UISettingsContext';
import { useAutosave } from '../hooks/useAutosave';
import { cleanTextForEMR } from '../utils/documentUtils';

interface ContinuousDocumentViewProps {
    sections: { header: string; lines: string[] }[];
    onCopy: (text: string) => void;
    onUpdateSection: (index: number, newText: string) => void;
    onDeleteSection?: (index: number) => void;
    searchQuery: string;
}

export const ContinuousDocumentView: React.FC<ContinuousDocumentViewProps> = ({ 
    sections, 
    onCopy, 
    onUpdateSection,
    onDeleteSection,
    searchQuery,
}) => {
    const { isDarkMode } = useContext(ThemeContext);
    const { fontSize, isFluid, allSectionsCollapsed, setAllSectionsCollapsed } = useContext(UISettingsContext);
    
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [editValue, setEditValue] = useState('');
    
    const AUTOSAVE_KEY = `superscribe_section_draft_${editingIndex}`;
    useAutosave(editValue, AUTOSAVE_KEY, editingIndex !== null);

    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const [editingLine, setEditingLine] = useState<{sectionIdx: number, lineIdx: number} | null>(null);
    const [lineValue, setLineValue] = useState('');
    const lineInputRef = useRef<HTMLTextAreaElement>(null);

    const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>(() => {
        try {
            const saved = localStorage.getItem('superscribe_collapsed_sections');
            return saved ? JSON.parse(saved) : {};
        } catch { return {}; }
    });

    const getCollapseKey = (sectionHeader: string) => `${sectionHeader}`;

    useEffect(() => {
        if (editingIndex !== null) {
            const draft = localStorage.getItem(AUTOSAVE_KEY);
            if (draft) setEditValue(draft);
        }
    }, [editingIndex, AUTOSAVE_KEY]);

    useEffect(() => {
        if (allSectionsCollapsed === null) return;
        
        let newCollapsedState: Record<string, boolean> = {};
        if (allSectionsCollapsed) {
            sections.forEach(section => {
                if (section.header !== '### Preamble') {
                    newCollapsedState[getCollapseKey(section.header)] = true;
                }
            });
        }
        setCollapsedSections(newCollapsedState);
        if (setAllSectionsCollapsed) setAllSectionsCollapsed(null);
    }, [allSectionsCollapsed, sections, setAllSectionsCollapsed]);

    const toggleSection = (key: string) => {
        setCollapsedSections(prev => {
            const next = { ...prev, [key]: !prev[key] };
            localStorage.setItem('superscribe_collapsed_sections', JSON.stringify(next));
            return next;
        });
    };

    useEffect(() => {
        if (editingIndex !== null && textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
            textareaRef.current.focus();
        }
    }, [editValue, editingIndex]);

    useEffect(() => {
        if (editingLine !== null && lineInputRef.current) {
            lineInputRef.current.style.height = 'auto';
            lineInputRef.current.style.height = lineInputRef.current.scrollHeight + 'px';
            lineInputRef.current.focus();
        }
    }, [editingLine, lineValue]);

    const handleDoubleClick = (index: number, header: string, lines: string[]) => {
        setEditingLine(null);
        const text = header === '### Preamble' 
            ? lines.join('\n') 
            : [header, ...lines].join('\n');
        setEditValue(text);
        setEditingIndex(index);
    };

    const handleLineDoubleClick = (sIdx: number, lIdx: number, text: string) => {
        setEditingIndex(null);
        setEditingLine({ sectionIdx: sIdx, lineIdx: lIdx });
        setLineValue(text);
    };

    const handleSave = () => {
        if (editingIndex !== null) {
            onUpdateSection(editingIndex, editValue);
            localStorage.removeItem(AUTOSAVE_KEY);
            setEditingIndex(null);
        }
    };

    const handleSaveLine = () => {
        if (editingLine) {
            const { sectionIdx, lineIdx } = editingLine;
            const section = sections[sectionIdx];
            const newLines = [...section.lines];
            newLines[lineIdx] = lineValue;
            const fullText = (section.header === '### Preamble' ? '' : section.header + '\n') + newLines.join('\n');
            onUpdateSection(sectionIdx, fullText);
            setEditingLine(null);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') setEditingIndex(null);
        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            handleSave();
        }
    };

    const handleLineKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') setEditingLine(null);
        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            handleSaveLine();
        }
    };

    const handleSectionCopy = (header: string, lines: string[]) => {
        const fullText = [header, ...lines].join('\n');
        onCopy(cleanTextForEMR(fullText));
    };

    const handleDelete = (index: number) => {
        if (onDeleteSection) {
            onDeleteSection(index);
        }
    };

    return (
        <div 
            className={`
                ${isDarkMode ? 'bg-[#2d2d2d] text-gray-200 selection:bg-accent-primary/20' : 'bg-white text-black selection:bg-blue-100'} min-h-[11in] w-full mx-auto 
                shadow-[0_4px_30px_rgba(0,0,0,0.3)] print:shadow-none print:max-w-none print:my-0
                p-10 md:p-12 my-8 font-serif transition-all duration-300 
                ${isFluid ? 'max-w-[95%]' : 'max-w-[8.5in]'}
            `} 
            style={{ fontSize: `${fontSize}px` }}
        >
            {sections.map((section, idx) => {
                const mainCollapseKey = getCollapseKey(section.header);
                const isMainCollapsed = !!collapsedSections[mainCollapseKey];

                return (
                    <div key={`${section.header}-${idx}`} className="mb-8 break-inside-avoid group relative">
                        {editingIndex === idx ? (
                            <textarea
                                ref={textareaRef} value={editValue} onChange={(e) => setEditValue(e.target.value)}
                                onBlur={handleSave} onKeyDown={handleKeyDown}
                                className={`w-full resize-none focus:outline-none focus:ring-1 p-2 -m-2 rounded font-serif leading-relaxed overflow-hidden ${isDarkMode ? 'bg-gray-950/50 ring-accent-primary/50' : 'bg-blue-50/50 ring-blue-300'}`}
                                style={{ fontSize: `${fontSize}px` }} spellCheck={false}
                            />
                        ) : (
                            <div onDoubleClick={(e) => { e.stopPropagation(); handleDoubleClick(idx, section.header, section.lines); }}>
                                {section.header !== '### Preamble' && (
                                    <div 
                                        className={`flex items-start justify-between group/header rounded p-2 -m-2 transition-colors cursor-pointer ${isDarkMode ? 'hover:bg-white/5' : 'hover:bg-gray-100'}`}
                                        onClick={(e) => { e.stopPropagation(); toggleSection(mainCollapseKey); }}
                                    >
                                        <div className="flex items-center gap-2 flex-1">
                                            <div className={`transition-colors ${isDarkMode ? 'text-gray-500 group-hover/header:text-gray-300' : 'text-gray-400 group-hover/header:text-gray-600'}`}>
                                                {isMainCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                                            </div>
                                            <h2 className={`text-lg font-bold uppercase tracking-wide select-none ${isDarkMode ? 'text-gray-100' : 'text-black'}`}>
                                                {section.header.replace(/^###\s*/, '')}
                                            </h2>
                                        </div>
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {onDeleteSection && (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleDelete(idx); }}
                                                    className={`p-2 backdrop-blur rounded print:hidden z-10 ${isDarkMode ? 'text-gray-400 hover:text-red-400 bg-gray-950/50' : 'text-gray-400 hover:text-red-500 bg-white/50'}`}
                                                    title="Delete this section"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); handleSectionCopy(section.header, section.lines); }}
                                                className={`p-2 backdrop-blur rounded print:hidden z-10 ${isDarkMode ? 'text-gray-400 hover:text-accent-primary bg-gray-950/50' : 'text-gray-400 hover:text-blue-600 bg-white/50'}`}
                                                title="Copy this patient"
                                            >
                                                <Copy className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                )}
                                
                                {!isMainCollapsed && (
                                    <div className={`leading-relaxed mt-2 pl-4 animate-in fade-in slide-in-from-top-2 duration-200 ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                                        {section.lines.map((line, lineIdx) => {
                                            const trimmed = line.trim();
                                            if (!trimmed) return <div key={lineIdx} className="h-2" />;
                                            
                                            if (editingLine?.sectionIdx === idx && editingLine?.lineIdx === lineIdx) {
                                                return (
                                                    <div key={lineIdx} className="my-1" onClick={e => e.stopPropagation()}>
                                                        <textarea
                                                            ref={lineInputRef} value={lineValue} onChange={(e) => setLineValue(e.target.value)}
                                                            onBlur={handleSaveLine} onKeyDown={handleLineKeyDown}
                                                            className={`w-full resize-none border-l-2 focus:outline-none p-1 -ml-1 rounded ${isDarkMode ? 'bg-gray-950/50 border-accent-primary' : 'bg-blue-50 border-blue-300'}`}
                                                            style={{ fontSize: `${fontSize}px` }} autoFocus
                                                        />
                                                    </div>
                                                );
                                            }

                                            return (
                                                <div 
                                                    key={lineIdx} 
                                                    className={`my-1 cursor-text rounded ${isDarkMode ? 'hover:bg-white/5' : 'hover:bg-gray-100'}`}
                                                    onDoubleClick={(e) => {
                                                        e.stopPropagation(); handleLineDoubleClick(idx, lineIdx, line);
                                                    }}
                                                >
                                                    <RichTextLine text={line} searchQuery={searchQuery} />
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                );
            })}
            {editingIndex === null && !editingLine && (
                <div className="h-20 flex items-center justify-center opacity-20 text-sm italic select-none print:hidden">
                    Double-click any section to edit
                </div>
            )}
        </div>
    );
};