import { useContext, useMemo, useRef, useEffect, useState } from 'react';
import { CheckSquare, Square } from 'lucide-react';
import { ThemeContext } from '../../contexts/ThemeContext';
import { UISettingsContext } from '../../contexts/UISettingsContext';
import { MacroContext } from '../../contexts/MacroContext';
import { RichTextLine } from '../RichTextLine';
import { useAutosave } from '../../hooks/useAutosave';

interface ContentGroup {
  type: 'default' | 'tasks' | 'plan';
  items: { text: string; originalIndex: number }[];
}

interface PatientCardBodyProps {
  header: string;
  lines: string[];
  index: number;
  searchQuery: string;
  isEditing: boolean;
  onUpdateFullSection: (text: string) => void;
  onSaveEdit: () => void;
  setIsEditing: (editing: boolean) => void;
}

export function PatientCardBody({
  header,
  lines,
  index,
  searchQuery,
  isEditing,
  onUpdateFullSection,
  onSaveEdit,
  setIsEditing,
}: PatientCardBodyProps) {
  const { isDarkMode } = useContext(ThemeContext);
  const { fontSize } = useContext(UISettingsContext);
  const { expandMacros } = useContext(MacroContext);

  const [editContent, setEditContent] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Line-by-line editing state
  const [activeLineIndex, setActiveLineIndex] = useState<number | null>(null);
  const [activeLineContent, setActiveLineContent] = useState('');
  const lineInputRef = useRef<HTMLTextAreaElement>(null);

  const AUTOSAVE_KEY = `superscribe_card_draft_${index}`;
  useAutosave(editContent, AUTOSAVE_KEY, isEditing);

  // Initialize edit content
  useEffect(() => {
    if (isEditing) {
      const draft = localStorage.getItem(AUTOSAVE_KEY);
      if (draft) {
        setEditContent(draft);
      } else {
        setEditContent([header, ...lines].join('\n'));
      }
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          textareaRef.current.style.height = 'auto';
          textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
        }
      }, 10);
    }
  }, [isEditing, header, lines, AUTOSAVE_KEY]);

  // Auto-resize textarea
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [editContent, isEditing]);

  // Auto-resize line editor
  useEffect(() => {
    if (activeLineIndex !== null && lineInputRef.current) {
      lineInputRef.current.style.height = 'auto';
      lineInputRef.current.style.height = lineInputRef.current.scrollHeight + 'px';
      lineInputRef.current.focus();
    }
  }, [activeLineIndex, activeLineContent]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    if (newValue.endsWith(' ') || newValue.endsWith('\n')) {
      const expanded = expandMacros(newValue);
      setEditContent(expanded);
    } else {
      setEditContent(newValue);
    }
  };

  const handleSaveEdit = () => {
    onUpdateFullSection(editContent);
    localStorage.removeItem(AUTOSAVE_KEY);
    setIsEditing(false);
    onSaveEdit();
  };

  const handleBlur = () => handleSaveEdit();

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') setIsEditing(false);
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSaveEdit();
    }
  };

  const saveLine = () => {
    if (activeLineIndex === null) return;
    const newLines = [...lines];
    newLines[activeLineIndex] = activeLineContent;
    onUpdateFullSection([header, ...newLines].join('\n'));
    setActiveLineIndex(null);
  };

  const handleLineBlur = () => saveLine();

  const handleLineKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') setActiveLineIndex(null);
    if ((e.key === 'Enter' && !e.shiftKey) || (e.key === 'Enter' && (e.metaKey || e.ctrlKey))) {
      e.preventDefault();
      saveLine();
    }
  };

  const toggleCheckbox = (originalLineIndex: number) => {
    const newLines = [...lines];
    const line = newLines[originalLineIndex];
    if (line?.includes('- [ ]')) {
      newLines[originalLineIndex] = line.replace('- [ ]', '- [x]');
    } else if (line?.includes('- [x]')) {
      newLines[originalLineIndex] = line.replace('- [x]', '- [ ]');
    }
    onUpdateFullSection([header, ...newLines].join('\n'));
  };

  const contentGroups = useMemo((): ContentGroup[] => {
    const groups: ContentGroup[] = [];
    let currentType: 'default' | 'tasks' | 'plan' = 'default';
    let currentItems: { text: string; originalIndex: number }[] = [];

    lines.forEach((line, idx) => {
      const trim = line.trim();
      const isTasks = trim.match(/^(\*\*|#)?\s*tasks(:)?(\*\*)?/i);
      const isPlan = trim.match(/^(\*\*|#)?\s*plan(:)?(\*\*)?/i);
      const isPending = trim.match(/^(\*\*|#)?\s*pending results(:)?(\*\*)?/i);

      if (isTasks) {
        if (currentItems.length) groups.push({ type: currentType, items: currentItems });
        currentType = 'tasks';
        currentItems = [];
      } else if (isPlan || isPending) {
        if (currentItems.length) groups.push({ type: currentType, items: currentItems });
        currentType = 'plan';
        currentItems = [];
      }
      currentItems.push({ text: line, originalIndex: idx });
    });

    if (currentItems.length) groups.push({ type: currentType, items: currentItems });
    return groups;
  }, [lines]);

  if (isEditing) {
    return (
      <div className="relative group/edit">
        <textarea
          ref={textareaRef}
          value={editContent}
          onChange={handleChange}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className={`w-full p-6 font-serif leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#d97757]/50 ${
            isDarkMode ? 'bg-[#1e1e1e] text-gray-200' : 'bg-white text-gray-900'
          }`}
          style={{ fontSize: `${fontSize}px`, minHeight: '200px' }}
          spellCheck={false}
        />
        <div className="absolute bottom-2 right-2 flex flex-col items-end gap-1 text-[10px] text-gray-500 bg-black/20 backdrop-blur px-2 py-1 rounded pointer-events-none opacity-0 group-hover/edit:opacity-100 transition-opacity">
          <span>Markdown Supported</span>
          <span className="text-[#d97757]">Try typing .norm, .ros, .aki</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className="cursor-text"
      style={{ fontSize: `${fontSize}px` }}
      onDoubleClick={() => setIsEditing(true)}
    >
      {contentGroups.map((group, groupIdx) => (
        <div
          key={groupIdx}
          className={`mb-2 rounded-lg transition-colors
            ${
              group.type === 'tasks'
                ? isDarkMode
                  ? 'bg-orange-500/10 border border-orange-500/20 p-3'
                  : 'bg-orange-50 border border-orange-200 p-3'
                : ''
            }
            ${
              group.type === 'plan'
                ? isDarkMode
                  ? 'border-l-2 border-gray-700 pl-3 py-1 hover:bg-white/5'
                  : 'border-l-2 border-gray-300 pl-3 py-1 hover:bg-gray-50'
                : ''
            }
          `}
        >
          {group.items.map((item, idx) => {
            const { text: line, originalIndex: lineIdx } = item;
            const trimmed = line.trim();

            // Empty line
            if (!trimmed) {
              if (activeLineIndex === lineIdx) {
                return (
                  <div key={idx} className="my-1" onClick={e => e.stopPropagation()}>
                    <textarea
                      ref={lineInputRef}
                      value={activeLineContent}
                      onChange={e => setActiveLineContent(e.target.value)}
                      onBlur={handleLineBlur}
                      onKeyDown={handleLineKeyDown}
                      className={`w-full p-2 rounded bg-transparent border-l-2 resize-none focus:outline-none ${
                        isDarkMode ? 'border-[#d97757] bg-white/5' : 'border-[#d97757] bg-blue-50'
                      }`}
                      style={{ fontSize: `${fontSize}px` }}
                      autoFocus
                    />
                  </div>
                );
              }
              return (
                <div
                  key={idx}
                  className="h-6 -mx-1 px-1 rounded hover:bg-gray-500/10 cursor-text transition-colors relative group/empty my-1"
                  onDoubleClick={e => {
                    e.stopPropagation();
                    setActiveLineIndex(lineIdx);
                    setActiveLineContent('');
                  }}
                >
                  <span className="opacity-0 group-hover/empty:opacity-30 text-xs select-none ml-2 italic text-gray-500">
                    Double-click to edit empty line
                  </span>
                </div>
              );
            }

            // Active line editing
            if (activeLineIndex === lineIdx) {
              return (
                <div key={idx} className="my-1" onClick={e => e.stopPropagation()}>
                  <textarea
                    ref={lineInputRef}
                    value={activeLineContent}
                    onChange={e => setActiveLineContent(e.target.value)}
                    onBlur={handleLineBlur}
                    onKeyDown={handleLineKeyDown}
                    className={`w-full p-2 rounded bg-transparent border-l-2 resize-none focus:outline-none ${
                      isDarkMode ? 'border-[#d97757] bg-white/5' : 'border-[#d97757] bg-blue-50'
                    }`}
                    style={{ fontSize: `${fontSize}px` }}
                    autoFocus
                  />
                </div>
              );
            }

            // Checkbox lines
            const isCheckboxUnchecked = trimmed.startsWith('- [ ]');
            const isCheckboxChecked = trimmed.startsWith('- [x]');

            if (isCheckboxUnchecked || isCheckboxChecked) {
              const cleanLine = line.replace(/^- \[( |x)\]\s*/, '');
              return (
                <div
                  key={idx}
                  className={`flex items-start gap-3 p-1.5 rounded-lg my-0.5 group/task cursor-pointer transition-all duration-200 active:scale-[0.99] select-none ${
                    isDarkMode ? 'hover:bg-white/5' : 'hover:bg-black/5'
                  }`}
                  onClick={e => {
                    e.stopPropagation();
                    toggleCheckbox(lineIdx);
                  }}
                  onDoubleClick={e => {
                    e.stopPropagation();
                    setActiveLineIndex(lineIdx);
                    setActiveLineContent(line);
                  }}
                >
                  <div
                    className={`mt-[0.2em] transform transition-all duration-300 ${
                      isCheckboxChecked
                        ? 'text-green-500 scale-110'
                        : 'text-gray-400 group-hover/task:text-[#d97757] scale-100'
                    }`}
                  >
                    {isCheckboxChecked ? (
                      <CheckSquare className="w-5 h-5" />
                    ) : (
                      <Square className="w-5 h-5" />
                    )}
                  </div>
                  <div
                    className={`transition-all duration-300 ${
                      isCheckboxChecked ? 'opacity-50 line-through decoration-gray-500' : 'opacity-100'
                    } flex-1`}
                  >
                    <RichTextLine text={cleanLine} searchQuery={searchQuery} />
                  </div>
                </div>
              );
            }

            // Regular line
            return (
              <div
                key={idx}
                className="my-1 cursor-text hover:bg-gray-500/10 rounded px-1 -mx-1 transition-colors"
                onDoubleClick={e => {
                  e.stopPropagation();
                  setActiveLineIndex(lineIdx);
                  setActiveLineContent(line);
                }}
              >
                <RichTextLine text={line} searchQuery={searchQuery} />
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
