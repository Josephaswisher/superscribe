import React, { useState, useEffect, useMemo, useRef, useContext } from 'react';
import {
  ChevronDown,
  Copy,
  Edit3,
  Save,
  CheckSquare,
  Square,
  ClipboardType,
  ClipboardCopy,
  Bed,
  Activity,
  Heart,
  Thermometer,
  Wind,
  AlertTriangle,
  Trash2,
  MessageCircle,
  GripVertical,
  Sparkles,
  FileOutput,
  Check,
  User,
  GraduationCap,
} from 'lucide-react';
import { RichTextLine } from './RichTextLine';
import {
  highlightText,
  STATUS_KEYWORDS,
  cleanTextForEMR,
  extractClinicalKeywords,
  CRITICAL_LAB_REGEX,
} from '../../utils/documentUtils';
import { ThemeContext } from '../../contexts/ThemeContext';
import { UISettingsContext } from '../../contexts/UISettingsContext';
import { MacroContext } from '../../contexts/MacroContext';
import { useTeam } from '../../contexts/TeamContext';
import { useAutosave } from '../../hooks/useAutosave';
import { UIDensity } from '../../types';

interface PatientCardProps {
  header: string;
  lines: string[];
  index: number;
  searchQuery: string;
  onUpdateFullSection: (newText: string) => void;
  onCopy: (text: string) => void;
  onDelete: () => void;
  // Drag and Drop props
  onDragStart?: (e: React.DragEvent, index: number) => void;
  onDragOver?: (e: React.DragEvent, index: number) => void;
  onDrop?: (e: React.DragEvent, index: number) => void;
}

const DENSITY_STYLES: Record<UIDensity, { wrapper: string; header: string; body: string }> = {
  compact: {
    wrapper: 'mb-2 rounded-lg',
    header: 'px-3 py-2',
    body: 'px-3 py-2 font-serif text-sm leading-normal',
  },
  normal: {
    wrapper: 'mb-4 rounded-xl',
    header: 'px-4 py-3',
    body: 'px-6 py-5 font-serif leading-relaxed',
  },
  spacious: {
    wrapper: 'mb-8 rounded-2xl',
    header: 'px-6 py-5',
    body: 'px-8 py-6 font-serif text-lg leading-loose',
  },
};

const SimpleSparkline: React.FC<{ data: number[]; color: string }> = ({ data, color }) => {
  if (data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const points = data
    .map((d, i) => {
      const x = (i / (data.length - 1)) * 30;
      const y = 10 - ((d - min) / range) * 10;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg width="30" height="12" viewBox="0 0 30 12" className="overflow-visible">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx={(data.length - 1) * (30 / (data.length - 1))}
        cy={10 - ((data[data.length - 1] - min) / range) * 10}
        r="1.5"
        fill={color}
      />
    </svg>
  );
};

export const PatientCard: React.FC<PatientCardProps> = React.memo(
  ({
    header,
    lines,
    index,
    searchQuery,
    onUpdateFullSection,
    onCopy,
    onDelete,
    onDragStart,
    onDragOver,
    onDrop,
  }) => {
    const { isDarkMode } = useContext(ThemeContext);
    const { fontSize, uiDensity, setPrefillChat } = useContext(UISettingsContext);
    const { expandMacros } = useContext(MacroContext);
    const { currentRoster } = useTeam();

    // Team assignment state (persisted in localStorage by patient identifier)
    const patientKey = `${header.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 50)}`;
    const [assignedResident, setAssignedResident] = useState<string>(() => {
      try {
        const saved = localStorage.getItem(`superscribe_assignment_res_${patientKey}`);
        return saved || '';
      } catch {
        return '';
      }
    });
    const [assignedStudent, setAssignedStudent] = useState<string>(() => {
      try {
        const saved = localStorage.getItem(`superscribe_assignment_stu_${patientKey}`);
        return saved || '';
      } catch {
        return '';
      }
    });

    // Persist team assignments
    useEffect(() => {
      if (assignedResident) {
        localStorage.setItem(`superscribe_assignment_res_${patientKey}`, assignedResident);
      } else {
        localStorage.removeItem(`superscribe_assignment_res_${patientKey}`);
      }
    }, [assignedResident, patientKey]);

    useEffect(() => {
      if (assignedStudent) {
        localStorage.setItem(`superscribe_assignment_stu_${patientKey}`, assignedStudent);
      } else {
        localStorage.removeItem(`superscribe_assignment_stu_${patientKey}`);
      }
    }, [assignedStudent, patientKey]);

    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState('');
    const [justCopied, setJustCopied] = useState(false);

    const AUTOSAVE_KEY = `superscribe_card_draft_${index}`;
    useAutosave(editContent, AUTOSAVE_KEY, isEditing);

    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Line-by-Line Editing State
    const [activeLineIndex, setActiveLineIndex] = useState<number | null>(null);
    const [activeLineContent, setActiveLineContent] = useState('');
    const lineInputRef = useRef<HTMLTextAreaElement>(null);

    // Auto-expand if search query matches content inside this card
    useEffect(() => {
      if (searchQuery && searchQuery.trim().length > 1) {
        const lowerQuery = searchQuery.toLowerCase();
        const headerMatch = header.toLowerCase().includes(lowerQuery);
        const linesMatch = lines.some(l => l.toLowerCase().includes(lowerQuery));
        if (headerMatch || linesMatch) {
          setIsCollapsed(false);
        }
      }
    }, [searchQuery, header, lines]);

    // Initialize edit content and focus/resize when entering edit mode
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

    // Auto-resize line editor
    useEffect(() => {
      if (activeLineIndex !== null && lineInputRef.current) {
        lineInputRef.current.style.height = 'auto';
        lineInputRef.current.style.height = lineInputRef.current.scrollHeight + 'px';
        lineInputRef.current.focus();
      }
    }, [activeLineIndex, activeLineContent]);

    // Auto-resize on content change (Global Edit)
    useEffect(() => {
      if (isEditing && textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
      }
    }, [editContent, isEditing]);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value;
      if (newValue.endsWith(' ') || newValue.endsWith('\n')) {
        const expanded = expandMacros(newValue);
        setEditContent(expanded);
      } else {
        setEditContent(newValue);
      }
    };

    const handleLineChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setActiveLineContent(e.target.value);
    };

    const handleSaveEdit = () => {
      onUpdateFullSection(editContent);
      localStorage.removeItem(AUTOSAVE_KEY);
      setIsEditing(false);
    };

    const saveLine = () => {
      if (activeLineIndex === null) return;
      const newLines = [...lines];
      newLines[activeLineIndex] = activeLineContent;
      onUpdateFullSection([header, ...newLines].join('\n'));
      setActiveLineIndex(null);
    };

    const handleBlur = () => {
      handleSaveEdit();
    };

    const handleLineBlur = () => {
      saveLine();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') setIsEditing(false);
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        handleSaveEdit();
      }
    };

    const handleLineKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') setActiveLineIndex(null);
      if ((e.key === 'Enter' && !e.shiftKey) || (e.key === 'Enter' && (e.metaKey || e.ctrlKey))) {
        e.preventDefault();
        saveLine();
      }
    };

    const handleHeaderKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setIsCollapsed(!isCollapsed);
      }
    };

    // --- DATA EXTRACTION ---
    const rawHeader = header.replace(/^###\s*(\d+\.\s*)?/, '');
    const separatorMatch = rawHeader.match(/\s[–-]\s/);
    let patientName = rawHeader;
    let patientRoom = '';

    if (separatorMatch && separatorMatch.index) {
      const potentialRoom = rawHeader.substring(separatorMatch.index + 3).trim();
      if (potentialRoom.length < 15) {
        // Slightly increased limit for complex room numbers
        patientName = rawHeader.substring(0, separatorMatch.index).trim();
        patientRoom = potentialRoom;
      }
    }

    const ageLine = lines.find(l => l.match(/\*\*Age:\*\*/i));
    const age = ageLine ? ageLine.replace(/\*\*Age:\*\*\s*/i, '').trim() : '';

    const admitLine = lines.find(l => l.match(/\*\*Admitted( for)?:\*\*/i));
    const admitReason = admitLine
      ? admitLine.replace(/\*\*Admitted( for)?:\*\*\s*/i, '').trim()
      : '';

    const statusBadges = STATUS_KEYWORDS.filter(kw =>
      lines.some(l => l.toLowerCase().includes(kw.toLowerCase()))
    );
    const assessmentPlanText = lines
      .filter(l => l.match(/\*\*Assessment:\*\*/i) || l.startsWith('#'))
      .join('\n');
    const clinicalKeywords = extractClinicalKeywords(assessmentPlanText);

    const tasks = lines.filter(l => l.includes('- [ ]') || l.includes('- [x]'));
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(l => l.includes('- [x]')).length;
    const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    const problems = useMemo(() => {
      return lines
        .filter(l => l.trim().startsWith('#'))
        .map(l => {
          let text = l.trim().replace(/^#+/, '');
          if (text.includes(':')) {
            text = text.split(':')[0];
          }
          return text.trim();
        })
        .filter(p => p.length > 0 && p.length < 60);
    }, [lines]);

    const summarySnippet = useMemo(() => {
      const idx = lines.findIndex(l =>
        l.match(/^(#+ |\*\*)?(Summary|Assessment|TL;DR|Impression)(:)?(\*\*)?/i)
      );
      if (idx === -1) return '';
      let text = lines[idx]
        .replace(/^(#+ |\*\*)?(Summary|Assessment|TL;DR|Impression)(:)?(\*\*)?/i, '')
        .trim();
      if (!text && lines[idx + 1]) {
        text = lines[idx + 1].trim();
      }
      return text;
    }, [lines]);

    const dispo = useMemo(() => {
      const idx = lines.findIndex(l => l.match(/^(#+ |\*\*)?Dispo(sition)?(:)?(\*\*)?/i));
      if (idx === -1) return '';
      let text = lines[idx].replace(/^(#+ |\*\*)?Dispo(sition)?(:)?(\*\*)?/i, '').trim();
      if (!text && lines[idx + 1]) {
        text = lines[idx + 1].trim();
      }
      return text;
    }, [lines]);

    // New Extracted Data: Vitals & Criticals
    const vitals = useMemo(() => {
      const line = lines.find(
        l => l.match(/^VS:|^\*\*VS:\*\*/i) || l.match(/\bBP:\s*\d+\/\d+/) || l.match(/^T:\s*\d+/)
      );
      if (!line) return null;
      const text = line.replace(/^(\*\*VS:\*\*|VS:)\s*/i, '');
      return {
        text,
        bp: text.match(/BP:?\s*(\d{2,3}\/\d{2,3})/i)?.[1],
        hr: text.match(/HR:?\s*(\d{2,3})/i)?.[1],
        temp: text.match(/[T|Temp]:?\s*(\d{2,3}(\.\d)?)/i)?.[1],
        o2: text.match(/SpO2:?\s*(\d{2,3}%?)/i)?.[1] || text.match(/O2:?\s*(\d{2,3}%?)/i)?.[1],
      };
    }, [lines]);

    // Mock sparkline data generator based on value (Simulated for Demo)
    const getTrend = (val: string | undefined, base: number) => {
      if (!val) return [];
      const num = parseFloat(val);
      if (isNaN(num)) return [];
      // Generate a fake trend that ends in the current value
      return [base, base + (Math.random() * 2 - 1), num];
    };

    const criticalLabs = useMemo(() => {
      return lines
        .filter(l => l.match(CRITICAL_LAB_REGEX))
        .map(l => {
          // Extract strictly the critical part if possible, or just truncate the line
          const match = l.match(CRITICAL_LAB_REGEX);
          return match ? match[0] : l.slice(0, 20);
        });
    }, [lines]);

    const toggleCheckbox = (originalLineIndex: number) => {
      const newLines = [...lines];
      const line = newLines[originalLineIndex];
      if (line.includes('- [ ]')) {
        newLines[originalLineIndex] = line.replace('- [ ]', '- [x]');
      } else {
        newLines[originalLineIndex] = line.replace('- [x]', '- [ ]');
      }
      onUpdateFullSection([header, ...newLines].join('\n'));
    };

    const handleCopy = () => {
      const fullText = [header.replace('### ', ''), ...lines]
        .join('\n')
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/^- \[ \]/gm, '[ ]')
        .replace(/^- \[x\]/gm, '[x]')
        .replace(/^- /gm, '- ');
      onCopy(fullText);
      setJustCopied(true);
      setTimeout(() => setJustCopied(false), 2000);
    };

    const handleEmrCopy = () => {
      onCopy(cleanTextForEMR([header, ...lines].join('\n')));
      setJustCopied(true);
      setTimeout(() => setJustCopied(false), 2000);
    };

    const handleRawCopy = () => {
      onCopy([header, ...lines].join('\n'));
      setJustCopied(true);
      setTimeout(() => setJustCopied(false), 2000);
    };

    const handleChatFocus = (type: string = '') => {
      setPrefillChat(
        type ? `Regarding ${patientName}, please ${type}: ` : `Regarding ${patientName}: `
      );
    };

    const contentGroups = useMemo(() => {
      const groups: {
        type: 'default' | 'tasks' | 'plan';
        items: { text: string; originalIndex: number }[];
      }[] = [];
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

    const styles = DENSITY_STYLES[uiDensity];

    return (
      <div
        id={`patient-${index}`}
        draggable
        onDragStart={e => onDragStart && onDragStart(e, index)}
        onDragOver={e => onDragOver && onDragOver(e, index)}
        onDrop={e => onDrop && onDrop(e, index)}
        className={`
           transition-all duration-200 border overflow-hidden shadow-sm scroll-mt-24 group/card relative
            ${styles.wrapper}
            ${isDarkMode ? 'bg-[#1e1e1e] border-gray-800 hover:border-gray-700' : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-md'}
        `}
      >
        {/* Drag Handle Overlay */}
        <div
          className={`absolute left-0 top-0 bottom-0 w-4 cursor-grab active:cursor-grabbing hover:bg-gray-500/10 flex items-center justify-center opacity-0 group-hover/card:opacity-100 transition-opacity z-20`}
        >
          <GripVertical className="w-3 h-3 text-gray-500" />
        </div>

        {/* Card Header */}
        <div
          className={`${styles.header} flex items-start justify-between pl-6 ${isDarkMode ? 'bg-[#252525] border-b border-gray-800' : 'bg-gray-50/50 border-b border-gray-100'}`}
        >
          <div
            className="flex-1 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#d97757]/50 rounded-lg -m-2 p-2"
            onClick={() => setIsCollapsed(!isCollapsed)}
            role="button"
            tabIndex={0}
            aria-expanded={!isCollapsed}
            onKeyDown={handleHeaderKeyDown}
          >
            <div className="flex flex-col gap-3">
              {/* Row 1: Name, Room, Vitals (Horizontal Layout) */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center flex-wrap gap-4">
                  <h2
                    className={`text-xl font-bold leading-none tracking-tight ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}
                  >
                    {highlightText(patientName, searchQuery, isDarkMode)}
                  </h2>
                  {patientRoom && (
                    <div
                      className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-bold font-mono border shadow-sm ${isDarkMode ? 'bg-gray-800 border-gray-700 text-gray-300' : 'bg-white border-gray-200 text-gray-700'}`}
                      title="Room Number"
                    >
                      <Bed className="w-3.5 h-3.5 opacity-70" />
                      <span className="font-bold font-mono text-sm tracking-tight">
                        {highlightText(patientRoom, searchQuery, isDarkMode)}
                      </span>
                    </div>
                  )}
                  {/* Team Assignment Badges */}
                  <div className="flex items-center gap-1">
                    <div className="relative group/res">
                      <button
                        onClick={e => e.stopPropagation()}
                        className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium border ${assignedResident ? (isDarkMode ? 'bg-green-900/40 border-green-800 text-green-300' : 'bg-green-50 border-green-200 text-green-700') : isDarkMode ? 'bg-gray-800 border-gray-700 text-gray-500' : 'bg-gray-50 border-gray-200 text-gray-400'}`}
                        title={assignedResident || 'Assign Resident'}
                      >
                        <User className="w-2.5 h-2.5" />
                        <span className="max-w-[40px] truncate">{assignedResident || 'Res'}</span>
                      </button>
                      <div
                        className={`absolute top-full left-0 mt-1 z-50 hidden group-hover/res:block min-w-[100px] rounded-lg border shadow-xl ${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'}`}
                      >
                        <div className="p-1">
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              setAssignedResident('');
                            }}
                            className={`w-full text-left px-2 py-1 text-[10px] rounded ${isDarkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
                          >
                            None
                          </button>
                          {currentRoster?.interns
                            ?.filter(i => i.name)
                            .map(intern => (
                              <button
                                key={intern.id}
                                onClick={e => {
                                  e.stopPropagation();
                                  setAssignedResident(intern.name);
                                }}
                                className={`w-full text-left px-2 py-1 text-[10px] rounded ${isDarkMode ? 'hover:bg-gray-800 text-gray-200' : 'hover:bg-gray-100 text-gray-700'}`}
                              >
                                {intern.name}
                              </button>
                            ))}
                          {currentRoster?.seniorResident?.name && (
                            <button
                              onClick={e => {
                                e.stopPropagation();
                                setAssignedResident(currentRoster.seniorResident!.name);
                              }}
                              className={`w-full text-left px-2 py-1 text-[10px] rounded ${isDarkMode ? 'hover:bg-gray-800 text-purple-300' : 'hover:bg-gray-100 text-purple-700'}`}
                            >
                              {currentRoster.seniorResident.name}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="relative group/stu">
                      <button
                        onClick={e => e.stopPropagation()}
                        className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium border ${assignedStudent ? (isDarkMode ? 'bg-amber-900/40 border-amber-800 text-amber-300' : 'bg-amber-50 border-amber-200 text-amber-700') : isDarkMode ? 'bg-gray-800 border-gray-700 text-gray-500' : 'bg-gray-50 border-gray-200 text-gray-400'}`}
                        title={assignedStudent || 'Assign Student'}
                      >
                        <GraduationCap className="w-2.5 h-2.5" />
                        <span className="max-w-[40px] truncate">{assignedStudent || 'Stu'}</span>
                      </button>
                      <div
                        className={`absolute top-full left-0 mt-1 z-50 hidden group-hover/stu:block min-w-[100px] rounded-lg border shadow-xl ${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'}`}
                      >
                        <div className="p-1">
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              setAssignedStudent('');
                            }}
                            className={`w-full text-left px-2 py-1 text-[10px] rounded ${isDarkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
                          >
                            None
                          </button>
                          {currentRoster?.medicalStudents
                            ?.filter(s => s.name)
                            .map(student => (
                              <button
                                key={student.id}
                                onClick={e => {
                                  e.stopPropagation();
                                  setAssignedStudent(student.name);
                                }}
                                className={`w-full text-left px-2 py-1 text-[10px] rounded ${isDarkMode ? 'hover:bg-gray-800 text-gray-200' : 'hover:bg-gray-100 text-gray-700'}`}
                              >
                                {student.name}
                              </button>
                            ))}
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Quick AI Action Chips */}
                  <div className="hidden sm:flex gap-1.5 opacity-0 group-hover/card:opacity-100 transition-opacity duration-300">
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        handleChatFocus('draft a progress note');
                      }}
                      className={`text-[10px] flex items-center gap-1 px-2 py-0.5 rounded border transition-colors ${isDarkMode ? 'border-gray-700 hover:bg-gray-700 text-gray-400' : 'border-gray-200 hover:bg-gray-100 text-gray-500'}`}
                    >
                      <Sparkles className="w-2.5 h-2.5 text-[#d97757]" /> Note
                    </button>
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        handleChatFocus('prepare discharge summary');
                      }}
                      className={`text-[10px] flex items-center gap-1 px-2 py-0.5 rounded border transition-colors ${isDarkMode ? 'border-gray-700 hover:bg-gray-700 text-gray-400' : 'border-gray-200 hover:bg-gray-100 text-gray-500'}`}
                    >
                      <FileOutput className="w-2.5 h-2.5" /> DC
                    </button>
                  </div>
                </div>

                {/* Vitals Display (Top Right) with Tabular Nums & Sparklines */}
                {vitals && (
                  <div
                    className={`hidden sm:flex items-center gap-3 text-xs font-mono px-3 py-1.5 rounded-md border shadow-sm tabular-nums ${isDarkMode ? 'bg-black/20 border-gray-700 text-gray-300' : 'bg-white border-gray-200 text-gray-600'}`}
                  >
                    {vitals.bp && (
                      <div className="flex items-center gap-1.5" title="Blood Pressure">
                        <Activity className="w-3 h-3 text-rose-500" />
                        <span className="font-bold">{vitals.bp}</span>
                      </div>
                    )}
                    {vitals.hr && (
                      <div
                        className="flex items-center gap-1.5 border-l pl-3 border-gray-500/20"
                        title="Heart Rate"
                      >
                        <Heart className="w-3 h-3 text-red-500" />
                        <span>{vitals.hr}</span>
                        {parseInt(vitals.hr) > 100 && (
                          <SimpleSparkline data={getTrend(vitals.hr, 80)} color="#ef4444" />
                        )}
                      </div>
                    )}
                    {vitals.o2 && (
                      <div
                        className="flex items-center gap-1.5 border-l pl-3 border-gray-500/20"
                        title="SpO2"
                      >
                        <Wind className="w-3 h-3 text-blue-400" />
                        <span>{vitals.o2}</span>
                      </div>
                    )}
                    {vitals.temp && (
                      <div
                        className="flex items-center gap-1.5 border-l pl-3 border-gray-500/20"
                        title="Temperature"
                      >
                        <Thermometer className="w-3 h-3 text-orange-500" />
                        <span>{vitals.temp}</span>
                        {parseFloat(vitals.temp) > 38 && (
                          <SimpleSparkline data={getTrend(vitals.temp, 37)} color="#f97316" />
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Row 2: Age, Reason, Critical Alerts */}
              {(age || admitReason) && (
                <div
                  className={`flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
                >
                  {age && (
                    <div className="flex items-center gap-2 shrink-0">
                      <div
                        className={`w-1.5 h-1.5 rounded-full ${isDarkMode ? 'bg-[#d97757]' : 'bg-[#d97757]'}`}
                      />
                      <span
                        className={`font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}
                      >
                        {age}
                      </span>
                    </div>
                  )}

                  {admitReason && (
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="hidden sm:block opacity-20">|</span>
                      <span className="truncate flex-1" title={admitReason}>
                        <span className="opacity-60 text-xs uppercase tracking-wider font-bold mr-2">
                          Admitted for
                        </span>
                        <span
                          className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-800'}`}
                        >
                          {highlightText(admitReason, searchQuery, isDarkMode)}
                        </span>
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Row 3: Badges & Keywords */}
              {(statusBadges.length > 0 || clinicalKeywords.length > 0) && (
                <div className="flex flex-wrap gap-2">
                  {statusBadges.map(b => (
                    <span
                      key={b}
                      className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-md border ${isDarkMode ? 'bg-indigo-900/30 border-indigo-800 text-indigo-300' : 'bg-indigo-50 border-indigo-100 text-indigo-700'}`}
                    >
                      {b}
                    </span>
                  ))}
                  {clinicalKeywords.slice(0, 4).map(kw => (
                    <span
                      key={kw}
                      className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-md border ${isDarkMode ? 'bg-blue-900/30 border-blue-800 text-blue-300' : 'bg-blue-50 border-blue-100 text-blue-700'}`}
                    >
                      {kw}
                    </span>
                  ))}
                </div>
              )}

              {/* Row 4: Progress (Tasks) */}
              {totalTasks > 0 && (
                <div
                  className="flex items-center gap-3 mt-1 opacity-90"
                  title={`${completedTasks}/${totalTasks} Tasks Complete`}
                >
                  <div className="w-24 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${progress === 100 ? 'bg-green-500' : 'bg-[#d97757]'}`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <span
                    className={`text-[10px] font-medium ${progress === 100 ? 'text-green-500' : 'text-gray-400'}`}
                  >
                    {completedTasks}/{totalTasks} Tasks
                  </span>
                </div>
              )}

              {isCollapsed && (
                <div
                  className={`mt-2 pt-3 border-t border-dashed animate-in fade-in slide-in-from-top-1 duration-200 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}
                >
                  {/* Critical Labs Section */}
                  {criticalLabs.length > 0 && (
                    <div
                      className={`flex flex-wrap gap-2 mb-3 p-2 rounded-md ${isDarkMode ? 'bg-red-900/10 border border-red-900/30' : 'bg-red-50 border border-red-100'}`}
                    >
                      <div className="flex items-center gap-1.5 text-red-500 text-[10px] font-bold uppercase tracking-wider mr-1">
                        <AlertTriangle className="w-3 h-3 animate-pulse" /> Critical
                      </div>
                      {criticalLabs.map((lab, i) => (
                        <span
                          key={i}
                          className={`text-xs font-bold px-1.5 rounded ${isDarkMode ? 'text-red-300 bg-red-900/30' : 'text-red-700 bg-white border border-red-200 shadow-sm'}`}
                        >
                          {lab}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Active Problems / Diagnosis */}
                  {problems.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {problems.map((p, i) => (
                        <span
                          key={i}
                          className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${isDarkMode ? 'bg-blue-900/20 text-blue-300 border-blue-800' : 'bg-blue-50 text-blue-700 border-blue-100'}`}
                        >
                          #{p}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="grid grid-cols-1 gap-1">
                    {/* One-Liner Summary */}
                    {summarySnippet && (
                      <div
                        className={`flex gap-2 text-xs leading-relaxed ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
                      >
                        <span
                          className={`font-bold shrink-0 text-[10px] uppercase tracking-wider mt-0.5 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}
                        >
                          Summary
                        </span>
                        <span className="line-clamp-2">
                          {highlightText(summarySnippet, searchQuery, isDarkMode)}
                        </span>
                      </div>
                    )}

                    {/* Disposition */}
                    {dispo && (
                      <div
                        className={`flex gap-2 text-xs leading-relaxed items-center mt-1 ${isDarkMode ? 'text-green-400' : 'text-green-700'}`}
                      >
                        <span
                          className={`font-bold shrink-0 text-[10px] uppercase tracking-wider opacity-70 ${isDarkMode ? 'text-green-500' : 'text-green-600'}`}
                        >
                          Plan
                        </span>
                        <span className="font-medium">
                          {highlightText(dispo, searchQuery, isDarkMode)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1 opacity-0 group-hover/card:opacity-100 transition-opacity pl-4 pt-1">
            {isEditing ? (
              <div className="flex items-center gap-2 mr-2">
                <span className="text-xs text-gray-500 animate-pulse">Editing...</span>
                <button
                  onMouseDown={handleSaveEdit}
                  className="p-1.5 rounded-lg bg-green-600 hover:bg-green-500 text-white"
                  title="Save"
                >
                  <Save className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <>
                <button
                  onClick={e => {
                    e.stopPropagation();
                    handleChatFocus();
                  }}
                  className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-blue-900/30 text-blue-400 hover:text-blue-300' : 'hover:bg-blue-50 text-blue-500 hover:text-blue-600'}`}
                  title={`Chat about ${patientName}`}
                >
                  <MessageCircle className="w-4 h-4" />
                </button>
                <button
                  onClick={e => {
                    e.stopPropagation();
                    if (confirm('Delete this patient card?')) onDelete();
                  }}
                  className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-red-900/30 text-gray-400 hover:text-red-400' : 'hover:bg-red-50 text-gray-500 hover:text-red-500'}`}
                  title="Delete Patient"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  onClick={e => {
                    e.stopPropagation();
                    handleEmrCopy();
                  }}
                  className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-200 text-gray-500'}`}
                  title="Copy Plain Text (EMR Safe)"
                >
                  {justCopied ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <ClipboardType className="w-4 h-4" />
                  )}
                </button>
                <button
                  onClick={e => {
                    e.stopPropagation();
                    handleRawCopy();
                  }}
                  className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-200 text-gray-500'}`}
                  title="Copy All Markdown"
                >
                  <ClipboardCopy className="w-4 h-4" />
                </button>
                <button
                  onClick={e => {
                    e.stopPropagation();
                    handleCopy();
                  }}
                  className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-200 text-gray-500'}`}
                  title="Copy Text (Standard)"
                >
                  <Copy className="w-4 h-4" />
                </button>
                <button
                  onClick={e => {
                    e.stopPropagation();
                    setIsEditing(true);
                  }}
                  className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-200 text-gray-500'}`}
                  title="Edit Text"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={e => {
                    e.stopPropagation();
                    setIsCollapsed(!isCollapsed);
                  }}
                  className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-200 text-gray-500'}`}
                  aria-expanded={!isCollapsed}
                  aria-label={isCollapsed ? 'Expand card' : 'Collapse card'}
                >
                  <ChevronDown
                    className={`w-4 h-4 transition-transform ${isCollapsed ? '-rotate-90' : ''}`}
                  />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Card Body */}
        <div
          id={`patient-content-${index}`}
          className={`transition-all duration-300 overflow-hidden ${isCollapsed ? 'max-h-0' : `max-h-[4000px] ${styles.body}`}`}
          aria-hidden={isCollapsed}
        >
          {isEditing ? (
            <div className="relative group/edit">
              <textarea
                ref={textareaRef}
                value={editContent}
                onChange={handleChange}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                className={`w-full p-6 font-serif leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#d97757]/50 ${isDarkMode ? 'bg-[#1e1e1e] text-gray-200' : 'bg-white text-gray-900'}`}
                style={{ fontSize: `${fontSize}px`, minHeight: '200px' }}
                spellCheck={false}
              />
              <div className="absolute bottom-2 right-2 flex flex-col items-end gap-1 text-[10px] text-gray-500 bg-black/20 backdrop-blur px-2 py-1 rounded pointer-events-none opacity-0 group-hover/edit:opacity-100 transition-opacity">
                <span>Markdown Supported</span>
                <span className="text-[#d97757]">Try typing .norm, .ros, .aki</span>
              </div>
            </div>
          ) : (
            <div
              className="cursor-text"
              style={{ fontSize: `${fontSize}px` }}
              onDoubleClick={() => setIsEditing(true)}
            >
              {contentGroups.map((group, groupIdx) => (
                <div
                  key={groupIdx}
                  className={`mb-2 rounded-lg transition-colors
                        ${group.type === 'tasks' ? (isDarkMode ? 'bg-orange-500/10 border border-orange-500/20 p-3' : 'bg-orange-50 border border-orange-200 p-3') : ''}
                        ${group.type === 'plan' ? (isDarkMode ? 'border-l-2 border-gray-700 pl-3 py-1 hover:bg-white/5' : 'border-l-2 border-gray-300 pl-3 py-1 hover:bg-gray-50') : ''}
                    `}
                >
                  {group.items.map((item, idx) => {
                    const { text: line, originalIndex: lineIdx } = item;
                    const trimmed = line.trim();

                    if (!trimmed) {
                      if (activeLineIndex === lineIdx) {
                        return (
                          <div key={idx} className="my-1" onClick={e => e.stopPropagation()}>
                            <textarea
                              ref={lineInputRef}
                              value={activeLineContent}
                              onChange={handleLineChange}
                              onBlur={handleLineBlur}
                              onKeyDown={handleLineKeyDown}
                              className={`w-full p-2 rounded bg-transparent border-l-2 resize-none focus:outline-none ${isDarkMode ? 'border-[#d97757] bg-white/5' : 'border-[#d97757] bg-blue-50'}`}
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
                    if (activeLineIndex === lineIdx) {
                      return (
                        <div key={idx} className="my-1" onClick={e => e.stopPropagation()}>
                          <textarea
                            ref={lineInputRef}
                            value={activeLineContent}
                            onChange={handleLineChange}
                            onBlur={handleLineBlur}
                            onKeyDown={handleLineKeyDown}
                            className={`w-full p-2 rounded bg-transparent border-l-2 resize-none focus:outline-none ${isDarkMode ? 'border-[#d97757] bg-white/5' : 'border-[#d97757] bg-blue-50'}`}
                            style={{ fontSize: `${fontSize}px` }}
                            autoFocus
                          />
                        </div>
                      );
                    }
                    const isCheckboxUnchecked = trimmed.startsWith('- [ ]');
                    const isCheckboxChecked = trimmed.startsWith('- [x]');
                    if (isCheckboxUnchecked || isCheckboxChecked) {
                      const cleanLine = line.replace(/^- \[( |x)\]\s*/, '');
                      return (
                        <div
                          key={idx}
                          className={`flex items-start gap-3 p-1.5 rounded-lg my-0.5 group/task cursor-pointer transition-all duration-200 active:scale-[0.99] select-none ${isDarkMode ? 'hover:bg-white/5' : 'hover:bg-black/5'}`}
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
                            className={`mt-[0.2em] transform transition-all duration-300 ${isCheckboxChecked ? 'text-green-500 scale-110' : 'text-gray-400 group-hover/task:text-[#d97757] scale-100'}`}
                          >
                            {isCheckboxChecked ? (
                              <CheckSquare className="w-5 h-5" />
                            ) : (
                              <Square className="w-5 h-5" />
                            )}
                          </div>
                          <div
                            className={`transition-all duration-300 ${isCheckboxChecked ? 'opacity-50 line-through decoration-gray-500' : 'opacity-100'} flex-1`}
                          >
                            <RichTextLine text={cleanLine} searchQuery={searchQuery} />
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={idx}
                        className={`my-1 cursor-text hover:bg-gray-500/10 rounded px-1 -mx-1 transition-colors`}
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
          )}
        </div>
      </div>
    );
  }
);
