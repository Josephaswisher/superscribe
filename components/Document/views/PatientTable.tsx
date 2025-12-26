import React, { useContext, useMemo, useState, useEffect } from 'react';
import {
    Users, Activity,
    Settings, ChevronDown, ChevronUp, Search,
    UserCircle, ListFilter, Plus, Trash2, X
} from 'lucide-react';
import { DataViewWrapper } from './DataViewWrapper';
import { ThemeContext } from '../../../contexts/ThemeContext';
import { parseRawContent, extractNameFromHeader } from '../../../utils/documentUtils';

interface PatientTableViewProps {
    content: string;
}

interface CustomColumn {
    id: string;
    label: string;
    prompt: string;
}

interface PatientData {
    index: number;
    room: string;
    name: string;
    age: string;
    gender: string;
    admittedFor: string;
    socialBarriers: string[];
    ptStatus: string;
    otStatus: string;
    cmNotes: string;
    dispo: string;
    dispoStatus: 'pending' | 'ready' | 'blocked' | 'home' | 'snf' | 'rehab' | 'unknown';
    acuity: 'Stable' | 'Guarded' | 'Critical' | 'Unknown';
    vitals: string;
    team: string;
    problems: string[];
    customFields: Record<string, string>;
}

const DISPO_COLORS: Record<
    PatientData['dispoStatus'],
    { bg: string; text: string; darkBg: string; darkText: string }
> = {
    pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', darkBg: 'bg-yellow-900/40', darkText: 'text-yellow-300' },
    ready: { bg: 'bg-green-100', text: 'text-green-800', darkBg: 'bg-green-900/40', darkText: 'text-green-300' },
    blocked: { bg: 'bg-red-100', text: 'text-red-800', darkBg: 'bg-red-900/40', darkText: 'text-red-300' },
    home: { bg: 'bg-blue-100', text: 'text-blue-800', darkBg: 'bg-blue-900/40', darkText: 'text-blue-300' },
    snf: { bg: 'bg-purple-100', text: 'text-purple-800', darkBg: 'bg-purple-900/40', darkText: 'text-purple-300' },
    rehab: { bg: 'bg-indigo-100', text: 'text-indigo-800', darkBg: 'bg-indigo-900/40', darkText: 'text-indigo-300' },
    unknown: { bg: 'bg-gray-100', text: 'text-gray-800', darkBg: 'bg-gray-700', darkText: 'text-gray-300' },
};

const ACUITY_COLORS: Record<PatientData['acuity'], string> = {
    Stable: 'text-green-500 bg-green-50 dark:bg-green-900/20',
    Guarded: 'text-orange-500 bg-orange-50 dark:bg-orange-900/20',
    Critical: 'text-red-500 bg-red-50 dark:bg-red-900/20',
    Unknown: 'text-gray-500 bg-gray-50 dark:bg-gray-900/20',
};

function parseDispoStatus(dispo: string): PatientData['dispoStatus'] {
    const lower = dispo.toLowerCase();
    if (lower.includes('home') || lower.includes('d/c home')) return 'home';
    if (lower.includes('snf') || lower.includes('skilled nursing')) return 'snf';
    if (lower.includes('rehab') || lower.includes('rehabilitation') || lower.includes('ltach')) return 'rehab';
    if (lower.includes('ready') || lower.includes('today') || lower.includes('tomorrow')) return 'ready';
    if (lower.includes('block') || lower.includes('barrier') || lower.includes('waiting')) return 'blocked';
    if (lower.includes('pending') || lower.includes('unclear') || lower.includes('tbd')) return 'pending';
    return 'unknown';
}

function extractCustomField(content: string, prompt: string): string {
    // Escape prompt for regex and create a flexible matcher
    const escaped = prompt.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // Match the prompt followed by colon/separator and then the value until newline or delimiter
    const regex = new RegExp(`(?:${escaped})[:\\s]*([^\\n,;]+)(?:\\n|,|;|$)`, 'i');
    const match = content.match(regex);
    return (match && match[1]) ? match[1].trim() : '—';
}

function extractPatientData(header: string, lines: string[], index: number, customColumns: CustomColumn[]): PatientData {
    const { name, room, age, gender } = extractNameFromHeader(header);
    const content = lines.join('\n');
    const lowerContent = content.toLowerCase();

    // Enhanced Extraction Logic
    const socialBarriers: string[] = [];
    if (lowerContent.includes('homeless') || lowerContent.includes('housing')) socialBarriers.push('Housing');
    if (lowerContent.includes('transport') || lowerContent.includes('ride')) socialBarriers.push('Transport');
    if (lowerContent.includes('insurance') || lowerContent.includes('uninsured')) socialBarriers.push('Insurance');
    if (lowerContent.includes('family') || lowerContent.includes('support')) socialBarriers.push('Support');
    if (lowerContent.includes('language') || lowerContent.includes('interp')) socialBarriers.push('Language');

    let ptStatus = '—';
    let otStatus = '—';
    if (lowerContent.includes('pt eval') || lowerContent.includes('pt consult')) ptStatus = 'Eval ordered';
    else if (lowerContent.includes('pt cleared') || lowerContent.includes('pt ok')) ptStatus = 'Cleared';
    else if (lowerContent.includes('working with pt')) ptStatus = 'Following';

    if (lowerContent.includes('ot eval') || lowerContent.includes('ot consult')) otStatus = 'Eval ordered';
    else if (lowerContent.includes('ot cleared') || lowerContent.includes('ot ok')) otStatus = 'Cleared';
    else if (lowerContent.includes('working with ot')) otStatus = 'Following';

    let cmNotes = '—';
    const cmMatch = content.match(/(?:cm|case management|sw|social work)[:\s]*([\w\s,]+?)(?:\n|$)/i);
    if (cmMatch && cmMatch[1]) cmNotes = cmMatch[1].trim();

    let dispo = 'TBD';
    const dispoMatch = content.match(/(?:dispo|disposition|discharge|d\/c)[:\s]*([\w\s/]+?)(?:\n|,|;|$)/i);
    if (dispoMatch && dispoMatch[1]) dispo = dispoMatch[1].trim();

    let admittedFor = '';
    const admitMatch = content.match(/(?:admitted for|reason|chief complaint|cc)[:\s]*([\w\s,]+?)(?:\n|$)/i);
    if (admitMatch && admitMatch[1]) admittedFor = admitMatch[1].trim();

    // Acuity
    let acuity: PatientData['acuity'] = 'Unknown';
    if (lowerContent.includes('critical') || lowerContent.includes('icu') || lowerContent.includes('unstable')) acuity = 'Critical';
    else if (lowerContent.includes('guarded') || lowerContent.includes('sick') || lowerContent.includes('warning')) acuity = 'Guarded';
    else if (lowerContent.includes('stable') || lowerContent.includes('doing well')) acuity = 'Stable';

    // Vitals
    let vitals = '—';
    const vitalsMatch = content.match(/(?:vitals|vss)[:\s]*([\w\s,./]+?)(?:\n|$)/i);
    if (vitalsMatch && vitalsMatch[1]) vitals = vitalsMatch[1].trim();

    // Team
    let team = '—';
    const teamMatch = content.match(/(?:attending|team|service)[:\s]*([\w\s,]+?)(?:\n|$)/i);
    if (teamMatch && teamMatch[1]) team = teamMatch[1].trim();

    // Problems
    const problems: string[] = [];
    const problemLines = lines.filter(l => l.trim().startsWith('#') && !l.trim().startsWith('###'));
    problemLines.forEach(l => {
        const p = l.replace(/^#\d*[:\s]*/, '').trim();
        if (p) problems.push(p);
    });

    // Custom Fields Autoparsing
    const customFields: Record<string, string> = {};
    customColumns.forEach(cc => {
        customFields[cc.id] = extractCustomField(content, cc.prompt);
    });

    return {
        index,
        room: room || `Room ${index}`,
        name: name || 'Unknown',
        age: age || '',
        gender: gender || '',
        admittedFor,
        socialBarriers,
        ptStatus,
        otStatus,
        cmNotes,
        dispo,
        dispoStatus: parseDispoStatus(dispo),
        acuity,
        vitals,
        team,
        problems: problems.slice(0, 3),
        customFields
    };
}

type ColumnId = 'room' | 'patient' | 'admittedFor' | 'acuity' | 'vitals' | 'team' | 'problems' | 'barriers' | 'therapy' | 'cm' | 'dispo';

export const PatientTableView: React.FC<PatientTableViewProps> = ({ content }) => {
    const { isDarkMode } = useContext(ThemeContext);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
    const [visibleColumns, setVisibleColumns] = useState<Record<ColumnId, boolean>>({
        room: true,
        patient: true,
        admittedFor: true,
        acuity: true,
        vitals: false,
        team: false,
        problems: true,
        barriers: true,
        therapy: true,
        cm: false,
        dispo: true
    });
    const [customColumns, setCustomColumns] = useState<CustomColumn[]>(() => {
        const saved = localStorage.getItem('superscribe_custom_columns');
        return saved ? JSON.parse(saved) : [];
    });
    const [showCustomize, setShowCustomize] = useState(false);
    const [newColLabel, setNewColLabel] = useState('');
    const [newColPrompt, setNewColPrompt] = useState('');

    useEffect(() => {
        localStorage.setItem('superscribe_custom_columns', JSON.stringify(customColumns));
    }, [customColumns]);

    const patients = useMemo(() => {
        const groups = parseRawContent(content);
        let data = groups
            .filter(g => g.header !== '### Preamble')
            .map((g, idx) => extractPatientData(g.header, g.lines, idx + 1, customColumns));

        // Filtering
        if (searchTerm) {
            const lowSearch = searchTerm.toLowerCase();
            data = data.filter(p =>
                p.name.toLowerCase().includes(lowSearch) ||
                p.room.toLowerCase().includes(lowSearch) ||
                p.admittedFor.toLowerCase().includes(lowSearch)
            );
        }

        if (sortConfig) {
            data.sort((a: PatientData, b: PatientData) => {
                let valA: string | number = '';
                let valB: string | number = '';

                const key = sortConfig.key;
                if (key.startsWith('custom_')) {
                    const customKey = key.replace('custom_', '');
                    valA = a.customFields[customKey] || '';
                    valB = b.customFields[customKey] || '';
                } else {
                    const fieldVal = a[key as keyof PatientData];
                    valA = (typeof fieldVal === 'string' || typeof fieldVal === 'number') ? fieldVal : String(fieldVal);
                    const fieldValB = b[key as keyof PatientData];
                    valB = (typeof fieldValB === 'string' || typeof fieldValB === 'number') ? fieldValB : String(fieldValB);
                }
                if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
                if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }

        return data;
    }, [content, searchTerm, sortConfig, customColumns]);

    const handleSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const toggleColumn = (id: ColumnId) => {
        setVisibleColumns(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const addCustomColumn = () => {
        if (!newColLabel.trim()) return;
        const id = `custom_${Date.now()}`;
        setCustomColumns([...customColumns, {
            id,
            label: newColLabel.trim(),
            prompt: newColPrompt.trim() || newColLabel.trim()
        }]);
        setNewColLabel('');
        setNewColPrompt('');
    };

    const removeCustomColumn = (id: string) => {
        setCustomColumns(customColumns.filter(c => c.id !== id));
    };

    const SortIcon = ({ colKey }: { colKey: string }) => {
        if (sortConfig?.key !== colKey) return <ChevronDown className="w-3 h-3 opacity-20" />;
        return sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />;
    };

    return (
        <DataViewWrapper title="Patient Information Dashboard" icon={Users}>
            <div className={`mb-4 flex flex-wrap items-center gap-3 p-3 rounded-xl border ${isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                <div className="relative flex-1 min-w-[240px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by name, room, or reason..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className={`w-full pl-10 pr-4 py-2 rounded-lg border text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all ${isDarkMode ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-500' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'}`}
                    />
                </div>

                <div className="relative">
                    <button
                        onClick={() => setShowCustomize(!showCustomize)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${isDarkMode ? 'bg-gray-900 border-gray-700 text-gray-300 hover:bg-gray-800' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'}`}
                    >
                        <Settings className="w-4 h-4" />
                        Customize
                    </button>

                    {showCustomize && (
                        <div className={`absolute right-0 mt-2 w-72 p-4 rounded-xl shadow-xl z-20 border ${isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'}`}>
                            <div className="flex justify-between items-center mb-4 border-b pb-2 border-gray-700">
                                <div className="text-xs font-bold uppercase text-gray-500 flex items-center gap-2">
                                    <ListFilter className="w-3 h-3" /> Dashboard Settings
                                </div>
                                <X className="w-4 h-4 cursor-pointer opacity-50 hover:opacity-100" onClick={() => setShowCustomize(false)} />
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <div className="text-[10px] font-bold text-gray-500 uppercase mb-2">Standard Columns</div>
                                    <div className="grid grid-cols-2 gap-2">
                                        {Object.keys(visibleColumns).map((col) => (
                                            <label key={col} className="flex items-center gap-2 cursor-pointer group">
                                                <input
                                                    type="checkbox"
                                                    checked={visibleColumns[col as ColumnId]}
                                                    onChange={() => toggleColumn(col as ColumnId)}
                                                    className="rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500"
                                                />
                                                <span className="text-xs capitalize truncate">{col.replace(/([A-Z])/g, ' $1')}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <div className="text-[10px] font-bold text-gray-500 uppercase mb-2">Custom Autoparse Columns</div>
                                    <div className="space-y-2 mb-3 max-h-32 overflow-y-auto pr-1">
                                        {customColumns.map((cc) => (
                                            <div key={cc.id} className={`flex items-center justify-between p-2 rounded text-xs ${isDarkMode ? 'bg-gray-900 border border-gray-700' : 'bg-gray-100 border border-gray-200'}`}>
                                                <div className="truncate pr-2">
                                                    <div className="font-bold">{cc.label}</div>
                                                    <div className="text-[10px] opacity-60">Search: "{cc.prompt}"</div>
                                                </div>
                                                <Trash2 className="w-3.5 h-3.5 text-red-500 cursor-pointer shrink-0 hover:scale-110" onClick={() => removeCustomColumn(cc.id)} />
                                            </div>
                                        ))}
                                    </div>

                                    <div className="space-y-2 border-t pt-3 border-gray-700">
                                        <input
                                            placeholder="Label (e.g. Pain)"
                                            value={newColLabel}
                                            onChange={(e) => setNewColLabel(e.target.value)}
                                            className={`w-full px-2 py-1.5 rounded border text-xs outline-none ${isDarkMode ? 'bg-gray-900 border-gray-700 text-white' : 'bg-white border-gray-200'}`}
                                        />
                                        <input
                                            placeholder="Prompt/Keyword (optional)"
                                            value={newColPrompt}
                                            onChange={(e) => setNewColPrompt(e.target.value)}
                                            className={`w-full px-2 py-1.5 rounded border text-xs outline-none ${isDarkMode ? 'bg-gray-900 border-gray-700 text-white' : 'bg-white border-gray-200'}`}
                                        />
                                        <button
                                            onClick={addCustomColumn}
                                            className="w-full flex items-center justify-center gap-2 py-1.5 rounded bg-blue-600 hover:bg-blue-700 transition-colors text-white text-xs font-bold"
                                        >
                                            <Plus className="w-3.5 h-3.5" /> Add Column
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className={`rounded-xl border shadow-sm overflow-hidden ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                <div className="overflow-x-auto min-h-[400px]">
                    <table className="w-full text-sm text-left border-collapse" aria-label="Patient Information Table">
                        <thead className={`text-xs uppercase font-semibold border-b ${isDarkMode ? 'bg-gray-900/50 text-gray-400 border-gray-700' : 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                            <tr>
                                {visibleColumns.room && (
                                    <th scope="col" className="px-6 py-4 cursor-pointer hover:text-blue-500" onClick={() => handleSort('room')}>
                                        <div className="flex items-center gap-2">Room <SortIcon colKey="room" /></div>
                                    </th>
                                )}
                                {visibleColumns.patient && (
                                    <th scope="col" className="px-6 py-4 cursor-pointer hover:text-blue-500" onClick={() => handleSort('name')}>
                                        <div className="flex items-center gap-2">Patient <SortIcon colKey="name" /></div>
                                    </th>
                                )}
                                {visibleColumns.acuity && (
                                    <th scope="col" className="px-6 py-4 cursor-pointer hover:text-blue-500" onClick={() => handleSort('acuity')}>
                                        <div className="flex items-center gap-2">Acuity <SortIcon colKey="acuity" /></div>
                                    </th>
                                )}

                                {/* Custom Dynamic Columns */}
                                {customColumns.map((cc) => (
                                    <th key={cc.id} scope="col" className="px-6 py-4 border-l border-gray-700/50 cursor-pointer hover:text-blue-500" onClick={() => handleSort(`custom_${cc.id}`)}>
                                        <div className="flex items-center gap-2">{cc.label} <SortIcon colKey={`custom_${cc.id}`} /></div>
                                    </th>
                                ))}

                                {visibleColumns.admittedFor && <th scope="col" className="px-6 py-4">Reason</th>}
                                {visibleColumns.problems && <th scope="col" className="px-6 py-4">Active Problems</th>}
                                {visibleColumns.vitals && <th scope="col" className="px-6 py-4">Vitals</th>}
                                {visibleColumns.team && <th scope="col" className="px-6 py-4">Team</th>}
                                {visibleColumns.barriers && <th scope="col" className="px-6 py-4 text-center">Barriers</th>}
                                {visibleColumns.therapy && <th scope="col" className="px-6 py-4 text-center">Therapy</th>}
                                {visibleColumns.cm && <th scope="col" className="px-6 py-4">Case Mgmt</th>}
                                {visibleColumns.dispo && <th scope="col" className="px-6 py-4">Disposition</th>}
                            </tr>
                        </thead>
                        <tbody className={`divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                            {patients.length === 0 ? (
                                <tr>
                                    <td colSpan={visibleColumns.room ? 12 : 11} className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center gap-3 text-gray-500">
                                            <Search className="w-8 h-8 opacity-20" />
                                            {searchTerm ? `No results found for "${searchTerm}"` : 'No patient data available.'}
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                patients.map((p, idx) => {
                                    const dispoColor = DISPO_COLORS[p.dispoStatus];
                                    return (
                                        <tr key={p.index} className={`transition-colors ${isDarkMode ? 'hover:bg-gray-750' : 'hover:bg-gray-50'} ${idx % 2 === 0 ? (isDarkMode ? 'bg-gray-800' : 'bg-white') : (isDarkMode ? 'bg-gray-800/30' : 'bg-gray-50/30')}`}>
                                            {visibleColumns.room && (
                                                <td className="px-6 py-4 font-bold text-blue-500 tabular-nums">{p.room}</td>
                                            )}
                                            {visibleColumns.patient && (
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <UserCircle className="w-4 h-4 opacity-30 shrink-0" />
                                                        <div>
                                                            <div className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{p.name}</div>
                                                            {(p.age || p.gender) && (
                                                                <div className="text-xs text-gray-500">{p.age} {p.gender}</div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                            )}
                                            {visibleColumns.acuity && (
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-1 rounded text-[10px] uppercase font-bold tracking-wider ${ACUITY_COLORS[p.acuity]}`}>
                                                        {p.acuity}
                                                    </span>
                                                </td>
                                            )}

                                            {/* Custom Dynamic Column Values */}
                                            {customColumns.map((cc) => (
                                                <td key={cc.id} className={`px-6 py-4 border-l border-gray-700/30 font-medium ${isDarkMode ? 'text-blue-300' : 'text-blue-700'}`}>
                                                    {p.customFields[cc.id]}
                                                </td>
                                            ))}

                                            {visibleColumns.admittedFor && (
                                                <td className={`px-6 py-4 max-w-[180px] break-words ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                                    {p.admittedFor || '—'}
                                                </td>
                                            )}
                                            {visibleColumns.problems && (
                                                <td className="px-6 py-4 min-w-[200px]">
                                                    <div className="space-y-1">
                                                        {p.problems.length > 0 ? p.problems.map((pb, i) => (
                                                            <div key={i} className="flex items-start gap-2 text-xs truncate">
                                                                <span className="text-gray-400 shrink-0 select-none">•</span>
                                                                <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>{pb}</span>
                                                            </div>
                                                        )) : <span className="text-gray-400">—</span>}
                                                    </div>
                                                </td>
                                            )}
                                            {visibleColumns.vitals && (
                                                <td className={`px-6 py-4 whitespace-nowrap tabular-nums text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                                    {p.vitals}
                                                </td>
                                            )}
                                            {visibleColumns.team && (
                                                <td className={`px-6 py-4 whitespace-nowrap text-xs italic ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                                    {p.team}
                                                </td>
                                            )}
                                            {visibleColumns.barriers && (
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-wrap justify-center gap-1">
                                                        {p.socialBarriers.length > 0 ? (
                                                            p.socialBarriers.map(b => (
                                                                <span key={b} className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase transition-colors ${isDarkMode ? 'bg-orange-800/20 text-orange-400' : 'bg-orange-100 text-orange-700'}`}>
                                                                    {b}
                                                                </span>
                                                            ))
                                                        ) : (
                                                            <span className="text-gray-400">—</span>
                                                        )}
                                                    </div>
                                                </td>
                                            )}
                                            {visibleColumns.therapy && (
                                                <td className="px-6 py-4 text-center">
                                                    <div className="flex flex-col gap-1 items-center">
                                                        {p.ptStatus !== '—' && (
                                                            <div className={`text-[10px] font-bold px-1.5 py-0.5 rounded border border-blue-500/20 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                                                                PT: {p.ptStatus.toUpperCase()}
                                                            </div>
                                                        )}
                                                        {p.otStatus !== '—' && (
                                                            <div className={`text-[10px] font-bold px-1.5 py-0.5 rounded border border-indigo-500/20 ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>
                                                                OT: {p.otStatus.toUpperCase()}
                                                            </div>
                                                        )}
                                                        {p.ptStatus === '—' && p.otStatus === '—' && <span className="text-gray-400">—</span>}
                                                    </div>
                                                </td>
                                            )}
                                            {visibleColumns.cm && (
                                                <td className={`px-6 py-4 text-xs italic ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                                    {p.cmNotes}
                                                </td>
                                            )}
                                            {visibleColumns.dispo && (
                                                <td className="px-6 py-4">
                                                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold ring-1 ring-inset ${isDarkMode ? dispoColor.darkBg + ' ' + dispoColor.darkText + ' ring-white/10' : dispoColor.bg + ' ' + dispoColor.text + ' ring-black/5'}`}>
                                                        <Activity className="w-3 h-3" />
                                                        {p.dispo}
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </DataViewWrapper>
    );
};
