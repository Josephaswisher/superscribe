import React, { useContext, useMemo, useState, useCallback } from 'react';
import {
  Globe,
  Users,
  AlertTriangle,
  Activity,
  ClipboardList,
  Home,
  Clock,
  Stethoscope,
  TrendingUp,
  TrendingDown,
  Minus,
  Droplets,
  Settings,
  Check,
  X,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { DataViewWrapper } from './DataViewWrapper';
import { ThemeContext } from '../../../contexts/ThemeContext';
import {
  parseRawContent,
  extractNameFromHeader,
  CRITICAL_LAB_REGEX,
  MEDS_REGEX,
  LABS_REGEX,
} from '../../../utils/documentUtils';

// AI Fill field types that can be auto-populated
type AiFillableField =
  | 'admittedFor'
  | 'disposition'
  | 'vitals'
  | 'codeStatus'
  | 'los'
  | 'trend'
  | 'problems';

interface GlobalDashboardProps {
  content: string;
  onAiFill?: (
    patientIndex: number,
    patientName: string,
    field: AiFillableField,
    currentContext: string
  ) => Promise<void>;
}

// AI Fill prompts for each field type - used by parent component
export const AI_FILL_PROMPTS: Record<AiFillableField, string> = {
  admittedFor:
    'Based on the patient context, identify the primary admission diagnosis or chief complaint. Respond with just the diagnosis in 5 words or less.',
  disposition:
    'Based on the patient context, what is the likely discharge disposition? Respond with: Home, SNF, Rehab, LTACH, Pending, or brief status.',
  vitals: 'Extract the most recent vital signs. Format: BP HR RR SpO2 Temp',
  codeStatus: 'What is the code status? Respond with: Full Code, DNR, DNR/DNI, or Comfort Care.',
  los: 'What is the hospital day/length of stay? Respond with: Day X',
  trend: 'Is the patient improving, stable, or worsening? One word.',
  problems: 'List top 3 active problems, semicolon-separated.',
};

interface PatientSummary {
  index: number;
  room: string;
  name: string;
  age: string;
  gender: string;
  admittedFor: string;
  acuity: 'critical' | 'high' | 'medium' | 'low';
  acuityReason: string;
  dispo: string;
  dispoStatus: 'home' | 'snf' | 'rehab' | 'pending' | 'blocked' | 'ready' | 'unknown';
  hasCriticalLabs: boolean;
  criticalLabValues: string[];
  problemCount: number;
  problems: string[];
  tasksRemaining: number;
  activeMeds: number;
  codeStatus: string;
  trend: 'improving' | 'stable' | 'worsening' | 'unknown';
  los: string; // Length of stay
  vitals: string;
  keyLabs: string[];
  rawContext: string; // Full section text for AI context
}

const ACUITY_COLORS = {
  critical: {
    light: 'bg-red-100 text-red-700 border-red-200',
    dark: 'bg-red-900/50 text-red-300 border-red-800',
  },
  high: {
    light: 'bg-orange-100 text-orange-700 border-orange-200',
    dark: 'bg-orange-900/50 text-orange-300 border-orange-800',
  },
  medium: {
    light: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    dark: 'bg-yellow-900/50 text-yellow-300 border-yellow-800',
  },
  low: {
    light: 'bg-green-100 text-green-700 border-green-200',
    dark: 'bg-green-900/50 text-green-300 border-green-800',
  },
};

const DISPO_COLORS = {
  home: {
    bg: 'bg-blue-100',
    text: 'text-blue-800',
    darkBg: 'bg-blue-900/40',
    darkText: 'text-blue-300',
  },
  snf: {
    bg: 'bg-purple-100',
    text: 'text-purple-800',
    darkBg: 'bg-purple-900/40',
    darkText: 'text-purple-300',
  },
  rehab: {
    bg: 'bg-indigo-100',
    text: 'text-indigo-800',
    darkBg: 'bg-indigo-900/40',
    darkText: 'text-indigo-300',
  },
  pending: {
    bg: 'bg-yellow-100',
    text: 'text-yellow-800',
    darkBg: 'bg-yellow-900/40',
    darkText: 'text-yellow-300',
  },
  blocked: {
    bg: 'bg-red-100',
    text: 'text-red-800',
    darkBg: 'bg-red-900/40',
    darkText: 'text-red-300',
  },
  ready: {
    bg: 'bg-green-100',
    text: 'text-green-800',
    darkBg: 'bg-green-900/40',
    darkText: 'text-green-300',
  },
  unknown: {
    bg: 'bg-gray-100',
    text: 'text-gray-800',
    darkBg: 'bg-gray-700',
    darkText: 'text-gray-300',
  },
};

const STAT_COLORS = {
  blue: { light: 'bg-blue-100 text-blue-600', dark: 'bg-blue-900/40 text-blue-400' },
  green: { light: 'bg-green-100 text-green-600', dark: 'bg-green-900/40 text-green-400' },
  red: { light: 'bg-red-100 text-red-600', dark: 'bg-red-900/40 text-red-400' },
  yellow: { light: 'bg-yellow-100 text-yellow-600', dark: 'bg-yellow-900/40 text-yellow-400' },
  purple: { light: 'bg-purple-100 text-purple-600', dark: 'bg-purple-900/40 text-purple-400' },
  orange: { light: 'bg-orange-100 text-orange-600', dark: 'bg-orange-900/40 text-orange-400' },
  cyan: { light: 'bg-cyan-100 text-cyan-600', dark: 'bg-cyan-900/40 text-cyan-400' },
  pink: { light: 'bg-pink-100 text-pink-600', dark: 'bg-pink-900/40 text-pink-400' },
};

type ColumnKey =
  | 'room'
  | 'patient'
  | 'admittedFor'
  | 'acuity'
  | 'trend'
  | 'problems'
  | 'tasks'
  | 'criticalLabs'
  | 'disposition'
  | 'vitals'
  | 'meds'
  | 'codeStatus'
  | 'los';

interface ColumnConfig {
  key: ColumnKey;
  label: string;
  defaultVisible: boolean;
  width?: string;
}

const ALL_COLUMNS: ColumnConfig[] = [
  { key: 'room', label: 'Room', defaultVisible: true, width: 'w-16' },
  { key: 'patient', label: 'Patient', defaultVisible: true },
  { key: 'admittedFor', label: 'Admitted For', defaultVisible: true },
  { key: 'acuity', label: 'Acuity', defaultVisible: true, width: 'w-24' },
  { key: 'trend', label: 'Trend', defaultVisible: true, width: 'w-16' },
  { key: 'problems', label: 'Problems', defaultVisible: true },
  { key: 'tasks', label: 'Tasks', defaultVisible: true, width: 'w-16' },
  { key: 'criticalLabs', label: 'Critical Labs', defaultVisible: true },
  { key: 'disposition', label: 'Disposition', defaultVisible: true, width: 'w-28' },
  { key: 'vitals', label: 'Vitals', defaultVisible: false },
  { key: 'meds', label: 'Active Meds', defaultVisible: false, width: 'w-20' },
  { key: 'codeStatus', label: 'Code Status', defaultVisible: false, width: 'w-20' },
  { key: 'los', label: 'LOS', defaultVisible: false, width: 'w-16' },
];

const DEFAULT_VISIBLE_COLUMNS = ALL_COLUMNS.filter(c => c.defaultVisible).map(c => c.key);

function parseDispoStatus(dispo: string): PatientSummary['dispoStatus'] {
  const lower = dispo.toLowerCase();
  if (lower.includes('home') || lower.includes('d/c home')) return 'home';
  if (lower.includes('snf') || lower.includes('skilled nursing')) return 'snf';
  if (lower.includes('rehab') || lower.includes('ltach') || lower.includes('rehabilitation'))
    return 'rehab';
  if (lower.includes('ready') || lower.includes('today') || lower.includes('tomorrow'))
    return 'ready';
  if (lower.includes('block') || lower.includes('barrier') || lower.includes('waiting'))
    return 'blocked';
  if (lower.includes('pending') || lower.includes('tbd') || lower.includes('unclear'))
    return 'pending';
  return 'unknown';
}

function determineAcuity(
  content: string,
  hasCriticalLabs: boolean,
  problems: string[]
): { acuity: PatientSummary['acuity']; reason: string } {
  const lower = content.toLowerCase();

  // Critical indicators
  if (
    lower.includes('icu') ||
    lower.includes('intubat') ||
    lower.includes('vasopressor') ||
    lower.includes('code blue')
  ) {
    return { acuity: 'critical', reason: 'ICU/Critical care' };
  }
  if (lower.includes('sepsis') || lower.includes('septic')) {
    return { acuity: 'critical', reason: 'Sepsis' };
  }
  if (lower.includes('ards') || lower.includes('respiratory failure')) {
    return { acuity: 'critical', reason: 'Respiratory failure' };
  }
  if (hasCriticalLabs) {
    return { acuity: 'critical', reason: 'Critical lab values' };
  }

  // High indicators
  if (lower.includes('unstable') || lower.includes('deteriorat') || lower.includes('acute')) {
    return { acuity: 'high', reason: 'Unstable condition' };
  }
  if (lower.includes('aki') || lower.includes('acute kidney')) {
    return { acuity: 'high', reason: 'AKI' };
  }
  if (lower.includes('gi bleed') || lower.includes('hemorrhage')) {
    return { acuity: 'high', reason: 'Active bleeding' };
  }
  if (problems.length > 4) {
    return { acuity: 'high', reason: `${problems.length} active problems` };
  }

  // Low indicators
  if (lower.includes('stable') && (lower.includes('discharge') || lower.includes('d/c'))) {
    return { acuity: 'low', reason: 'Stable, pending discharge' };
  }
  if (lower.includes('improving') || lower.includes('resolved')) {
    return { acuity: 'low', reason: 'Improving' };
  }

  return { acuity: 'medium', reason: 'Standard care' };
}

function determineTrend(content: string): PatientSummary['trend'] {
  const lower = content.toLowerCase();
  if (
    lower.includes('↗') ||
    lower.includes('improving') ||
    lower.includes('better') ||
    lower.includes('resolved')
  )
    return 'improving';
  if (
    lower.includes('↘') ||
    lower.includes('worsening') ||
    lower.includes('deteriorat') ||
    lower.includes('declining')
  )
    return 'worsening';
  if (lower.includes('→') || lower.includes('stable') || lower.includes('unchanged'))
    return 'stable';
  return 'unknown';
}

function extractPatientSummary(header: string, lines: string[], index: number): PatientSummary {
  const { name, room, age, gender } = extractNameFromHeader(header);
  const content = lines.join('\n');
  const lower = content.toLowerCase();
  const rawContext = `${header}\n${content}`; // Full section for AI context

  // Extract admission reason
  let admittedFor = '';
  const admitPatterns = [
    /(?:admitted for|admission[:\s]+|chief complaint|cc)[:\s]*([^\n.]+)/i,
    /(?:presenting with|presents with)[:\s]*([^\n.]+)/i,
    /(?:reason for admission)[:\s]*([^\n.]+)/i,
  ];
  for (const pattern of admitPatterns) {
    const match = content.match(pattern);
    if (match?.[1]) {
      admittedFor = match[1].trim().substring(0, 40);
      break;
    }
  }

  // Extract disposition
  let dispo = 'TBD';
  const dispoMatch = content.match(
    /(?:dispo|disposition|discharge plan|d\/c plan)[:\s]*([^\n,;]+)/i
  );
  if (dispoMatch?.[1]) dispo = dispoMatch[1].trim().substring(0, 25);

  // Extract critical labs
  const criticalLabMatches = content.match(CRITICAL_LAB_REGEX) || [];
  const hasCriticalLabs = criticalLabMatches.length > 0;
  const criticalLabValues = criticalLabMatches.slice(0, 3).map(m => m.trim());

  // Extract problems (lines starting with #)
  const problems = lines
    .filter(l => l.trim().startsWith('#'))
    .map(l => l.replace(/^#\s*\d*\.?\s*/, '').trim())
    .filter(p => p.length > 0)
    .slice(0, 5);
  const problemCount = problems.length;

  // Count tasks
  const tasksRemaining = (content.match(/- \[ \]/g) || []).length;

  // Count active medications
  const medLines = lines.filter(l => l.match(MEDS_REGEX) && !l.startsWith('#'));
  const activeMeds = medLines.length;

  // Extract code status
  let codeStatus = '';
  if (lower.includes('dnr/dni') || lower.includes('dnr dni')) codeStatus = 'DNR/DNI';
  else if (lower.includes('dnr')) codeStatus = 'DNR';
  else if (lower.includes('comfort') || lower.includes('hospice')) codeStatus = 'Comfort';
  else if (lower.includes('full code')) codeStatus = 'Full';

  // Extract LOS
  let los = '';
  const losMatch = content.match(/(?:los|length of stay|day)[:\s#]*(\d+)/i);
  if (losMatch?.[1]) los = `Day ${losMatch[1]}`;

  // Extract vitals
  let vitals = '';
  const vitalsMatch = lines.find(l => l.match(/(?:vs|vitals)[:\s]/i));
  if (vitalsMatch)
    vitals = vitalsMatch
      .replace(/(?:vs|vitals)[:\s]*/i, '')
      .trim()
      .substring(0, 50);

  // Extract key labs (non-critical)
  const labLines = lines.filter(l => l.match(LABS_REGEX));
  const keyLabs = labLines.slice(0, 2).map(l => l.trim().substring(0, 40));

  // Determine acuity
  const { acuity, reason: acuityReason } = determineAcuity(content, hasCriticalLabs, problems);

  // Determine trend
  const trend = determineTrend(content);

  return {
    index,
    room: room || `${index}`,
    name: name || 'Unknown',
    age: age || '',
    gender: gender || '',
    admittedFor,
    acuity,
    acuityReason,
    dispo,
    dispoStatus: parseDispoStatus(dispo),
    hasCriticalLabs,
    criticalLabValues,
    problemCount,
    problems,
    tasksRemaining,
    activeMeds,
    codeStatus,
    trend,
    los,
    vitals,
    keyLabs,
    rawContext,
  };
}

interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: number | string;
  color: keyof typeof STAT_COLORS;
  isDarkMode: boolean;
  subtitle?: string;
}

const StatCard: React.FC<StatCardProps> = ({
  icon: Icon,
  label,
  value,
  color,
  isDarkMode,
  subtitle,
}) => {
  const colorClass = isDarkMode ? STAT_COLORS[color].dark : STAT_COLORS[color].light;
  return (
    <div className={`rounded-lg p-3 ${colorClass}`}>
      <div className="flex items-center gap-2">
        <Icon className="w-5 h-5" />
        <span className="text-2xl font-bold">{value}</span>
      </div>
      <div className="text-xs mt-1 opacity-80">{label}</div>
      {subtitle && <div className="text-[10px] mt-0.5 opacity-60">{subtitle}</div>}
    </div>
  );
};

const TrendIcon: React.FC<{ trend: PatientSummary['trend']; isDarkMode: boolean }> = ({
  trend,
  isDarkMode,
}) => {
  if (trend === 'improving')
    return <TrendingUp className={`w-4 h-4 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />;
  if (trend === 'worsening')
    return <TrendingDown className={`w-4 h-4 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`} />;
  if (trend === 'stable')
    return <Minus className={`w-4 h-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />;
  return null;
};

// Empty cell with AI fill capability
interface EmptyCellProps {
  field: AiFillableField;
  patientIndex: number;
  patientName: string;
  patientContext: string;
  onAiFill?: GlobalDashboardProps['onAiFill'];
  isDarkMode: boolean;
}

const EmptyCell: React.FC<EmptyCellProps> = ({
  field,
  patientIndex,
  patientName,
  patientContext,
  onAiFill,
  isDarkMode,
}) => {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (!onAiFill || loading) return;
    setLoading(true);
    try {
      await onAiFill(patientIndex, patientName, field, patientContext);
    } finally {
      setLoading(false);
    }
  };

  if (!onAiFill) {
    return <span className={isDarkMode ? 'text-gray-600' : 'text-gray-300'}>—</span>;
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`group inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] transition-all ${
        loading
          ? 'opacity-50 cursor-wait'
          : isDarkMode
            ? 'text-gray-500 hover:bg-[#d97757]/20 hover:text-[#d97757]'
            : 'text-gray-400 hover:bg-orange-50 hover:text-[#d97757]'
      }`}
      title={`Ask AI to fill ${field}`}
    >
      {loading ? (
        <Loader2 className="w-3 h-3 animate-spin" />
      ) : (
        <>
          <Sparkles className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
          <span>—</span>
        </>
      )}
    </button>
  );
};

export const GlobalDashboard: React.FC<GlobalDashboardProps> = ({ content, onAiFill }) => {
  const { isDarkMode } = useContext(ThemeContext);
  const [visibleColumns, setVisibleColumns] = useState<ColumnKey[]>(DEFAULT_VISIBLE_COLUMNS);
  const [showColumnSettings, setShowColumnSettings] = useState(false);

  const toggleColumn = useCallback((key: ColumnKey) => {
    setVisibleColumns(prev => (prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]));
  }, []);

  // Memoize visible column set for O(1) lookup instead of O(n) array.includes
  const visibleColumnSet = useMemo(() => new Set(visibleColumns), [visibleColumns]);
  const isColumnVisible = useCallback(
    (key: ColumnKey) => visibleColumnSet.has(key),
    [visibleColumnSet]
  );

  const patients = useMemo(() => {
    const groups = parseRawContent(content);
    return groups
      .filter(g => g.header !== '### Preamble')
      .map((g, idx) => extractPatientSummary(g.header, g.lines, idx + 1));
  }, [content]);

  const stats = useMemo(() => {
    // Single-pass aggregation for efficiency
    let critical = 0,
      high = 0,
      readyDC = 0,
      blocked = 0;
    let totalTasks = 0,
      criticalLabs = 0,
      improving = 0,
      worsening = 0,
      totalProblems = 0;

    for (const p of patients) {
      // Acuity counts
      if (p.acuity === 'critical') critical++;
      else if (p.acuity === 'high') high++;

      // Dispo counts
      if (p.dispoStatus === 'ready' || p.dispoStatus === 'home') readyDC++;
      else if (p.dispoStatus === 'blocked') blocked++;

      // Trend counts
      if (p.trend === 'improving') improving++;
      else if (p.trend === 'worsening') worsening++;

      // Aggregates
      if (p.hasCriticalLabs) criticalLabs++;
      totalTasks += p.tasksRemaining;
      totalProblems += p.problemCount;
    }

    return {
      total: patients.length,
      critical,
      high,
      readyDC,
      blocked,
      totalTasks,
      criticalLabs,
      improving,
      worsening,
      avgProblems: patients.length ? (totalProblems / patients.length).toFixed(1) : '0',
    };
  }, [patients]);

  const baseCardClass = isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';
  const headerClass = isDarkMode
    ? 'bg-gradient-to-r from-gray-800 to-gray-900 text-gray-100'
    : 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white';

  return (
    <DataViewWrapper title="Global Patient Dashboard" icon={Globe}>
      {/* Summary Stats - Two Rows */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 mb-6">
        <StatCard
          icon={Users}
          label="Census"
          value={stats.total}
          color="blue"
          isDarkMode={isDarkMode}
        />
        <StatCard
          icon={AlertTriangle}
          label="Critical"
          value={stats.critical}
          color="red"
          isDarkMode={isDarkMode}
        />
        <StatCard
          icon={Activity}
          label="High Acuity"
          value={stats.high}
          color="orange"
          isDarkMode={isDarkMode}
        />
        <StatCard
          icon={Droplets}
          label="Crit Labs"
          value={stats.criticalLabs}
          color="pink"
          isDarkMode={isDarkMode}
        />
        <StatCard
          icon={Home}
          label="Ready D/C"
          value={stats.readyDC}
          color="green"
          isDarkMode={isDarkMode}
        />
        <StatCard
          icon={Clock}
          label="Blocked"
          value={stats.blocked}
          color="yellow"
          isDarkMode={isDarkMode}
        />
        <StatCard
          icon={ClipboardList}
          label="Tasks"
          value={stats.totalTasks}
          color="purple"
          isDarkMode={isDarkMode}
        />
        <StatCard
          icon={Stethoscope}
          label="Avg Problems"
          value={stats.avgProblems}
          color="cyan"
          isDarkMode={isDarkMode}
        />
      </div>

      {/* Trend Summary */}
      <div
        className={`flex gap-4 mb-4 p-3 rounded-lg ${isDarkMode ? 'bg-gray-800/50' : 'bg-gray-50'}`}
      >
        <div className="flex items-center gap-2">
          <TrendingUp className={`w-4 h-4 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
          <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            <strong>{stats.improving}</strong> improving
          </span>
        </div>
        <div className="flex items-center gap-2">
          <TrendingDown className={`w-4 h-4 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`} />
          <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            <strong>{stats.worsening}</strong> worsening
          </span>
        </div>
      </div>

      {/* Column Settings */}
      <div className="flex justify-end mb-2">
        <div className="relative">
          <button
            onClick={() => setShowColumnSettings(!showColumnSettings)}
            className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium transition-all ${
              showColumnSettings
                ? isDarkMode
                  ? 'bg-cyan-900/50 text-cyan-300'
                  : 'bg-cyan-100 text-cyan-700'
                : isDarkMode
                  ? 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            Columns
          </button>
          {showColumnSettings && (
            <div
              className={`absolute right-0 top-full mt-1 z-20 p-3 rounded-lg shadow-xl border min-w-[200px] ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
            >
              <div className="flex items-center justify-between mb-2 pb-2 border-b border-gray-600/30">
                <span
                  className={`text-xs font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
                >
                  Show/Hide Columns
                </span>
                <button
                  onClick={() => setShowColumnSettings(false)}
                  className="text-gray-500 hover:text-gray-300"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="space-y-1">
                {ALL_COLUMNS.map(col => (
                  <button
                    key={col.key}
                    onClick={() => toggleColumn(col.key)}
                    className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs transition-colors ${
                      isColumnVisible(col.key)
                        ? isDarkMode
                          ? 'bg-cyan-900/30 text-cyan-300'
                          : 'bg-cyan-50 text-cyan-700'
                        : isDarkMode
                          ? 'text-gray-400 hover:bg-gray-700'
                          : 'text-gray-500 hover:bg-gray-100'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded border flex items-center justify-center ${
                        isColumnVisible(col.key)
                          ? isDarkMode
                            ? 'bg-cyan-600 border-cyan-500'
                            : 'bg-cyan-500 border-cyan-600'
                          : isDarkMode
                            ? 'border-gray-600'
                            : 'border-gray-300'
                      }`}
                    >
                      {isColumnVisible(col.key) && <Check className="w-3 h-3 text-white" />}
                    </div>
                    {col.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Table */}
      <div className={`rounded-xl border overflow-hidden shadow-lg ${baseCardClass}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className={headerClass}>
                {isColumnVisible('room') && (
                  <th className="px-3 py-3 text-left font-semibold w-16">Room</th>
                )}
                {isColumnVisible('patient') && (
                  <th className="px-3 py-3 text-left font-semibold">Patient</th>
                )}
                {isColumnVisible('admittedFor') && (
                  <th className="px-3 py-3 text-left font-semibold">Admitted For</th>
                )}
                {isColumnVisible('acuity') && (
                  <th className="px-3 py-3 text-center font-semibold w-24">Acuity</th>
                )}
                {isColumnVisible('trend') && (
                  <th className="px-3 py-3 text-center font-semibold w-16">Trend</th>
                )}
                {isColumnVisible('problems') && (
                  <th className="px-3 py-3 text-left font-semibold">Problems</th>
                )}
                {isColumnVisible('tasks') && (
                  <th className="px-3 py-3 text-center font-semibold w-16">Tasks</th>
                )}
                {isColumnVisible('criticalLabs') && (
                  <th className="px-3 py-3 text-left font-semibold">Critical Labs</th>
                )}
                {isColumnVisible('disposition') && (
                  <th className="px-3 py-3 text-left font-semibold w-28">Disposition</th>
                )}
                {isColumnVisible('vitals') && (
                  <th className="px-3 py-3 text-left font-semibold">Vitals</th>
                )}
                {isColumnVisible('meds') && (
                  <th className="px-3 py-3 text-center font-semibold w-20">Meds</th>
                )}
                {isColumnVisible('codeStatus') && (
                  <th className="px-3 py-3 text-center font-semibold w-20">Code</th>
                )}
                {isColumnVisible('los') && (
                  <th className="px-3 py-3 text-center font-semibold w-16">LOS</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {patients.length === 0 ? (
                <tr>
                  <td
                    colSpan={visibleColumns.length}
                    className={`px-4 py-12 text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
                  >
                    <Globe className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p className="font-medium">No patients in census</p>
                    <p className="text-xs mt-1 opacity-70">
                      Paste your signout to see the global dashboard
                    </p>
                  </td>
                </tr>
              ) : (
                patients.map((patient, idx) => {
                  const dispoColor = DISPO_COLORS[patient.dispoStatus];
                  const acuityColor = ACUITY_COLORS[patient.acuity];
                  const rowClass =
                    idx % 2 === 0
                      ? isDarkMode
                        ? 'bg-gray-800'
                        : 'bg-white'
                      : isDarkMode
                        ? 'bg-gray-800/50'
                        : 'bg-gray-50/50';

                  return (
                    <tr
                      key={patient.index}
                      className={`${rowClass} hover:bg-cyan-50/50 dark:hover:bg-cyan-900/10 transition-colors`}
                    >
                      {/* Room */}
                      {isColumnVisible('room') && (
                        <td className="px-3 py-2.5">
                          <span
                            className={`inline-flex items-center justify-center w-12 h-7 rounded font-bold text-xs ${isDarkMode ? 'bg-cyan-900/50 text-cyan-300' : 'bg-cyan-100 text-cyan-700'}`}
                          >
                            {patient.room}
                          </span>
                        </td>
                      )}

                      {/* Patient */}
                      {isColumnVisible('patient') && (
                        <td className="px-3 py-2.5">
                          <div
                            className={`font-medium text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                          >
                            {patient.name}
                          </div>
                          <div
                            className={`text-[10px] flex items-center gap-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}
                          >
                            {patient.age && (
                              <span>
                                {patient.age}
                                {patient.gender}
                              </span>
                            )}
                          </div>
                        </td>
                      )}

                      {/* Admitted For */}
                      {isColumnVisible('admittedFor') && (
                        <td
                          className={`px-3 py-2.5 max-w-[180px] ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
                        >
                          <span className="text-xs truncate block">
                            {patient.admittedFor || (
                              <EmptyCell
                                field="admittedFor"
                                patientIndex={patient.index}
                                patientName={patient.name}
                                patientContext={patient.rawContext}
                                onAiFill={onAiFill}
                                isDarkMode={isDarkMode}
                              />
                            )}
                          </span>
                        </td>
                      )}

                      {/* Acuity */}
                      {isColumnVisible('acuity') && (
                        <td className="px-3 py-2.5 text-center">
                          <div className="flex flex-col items-center gap-0.5">
                            <span
                              className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${isDarkMode ? acuityColor.dark : acuityColor.light}`}
                            >
                              {patient.acuity}
                            </span>
                            <span
                              className={`text-[9px] ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}
                            >
                              {patient.acuityReason}
                            </span>
                          </div>
                        </td>
                      )}

                      {/* Trend */}
                      {isColumnVisible('trend') && (
                        <td className="px-3 py-2.5 text-center">
                          <TrendIcon trend={patient.trend} isDarkMode={isDarkMode} />
                        </td>
                      )}

                      {/* Problems */}
                      {isColumnVisible('problems') && (
                        <td className="px-3 py-2.5">
                          {patient.problems.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {patient.problems.slice(0, 2).map((p, i) => (
                                <span
                                  key={i}
                                  className={`inline-block px-1.5 py-0.5 rounded text-[10px] ${isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'}`}
                                >
                                  {p.length > 15 ? p.substring(0, 15) + '...' : p}
                                </span>
                              ))}
                              {patient.problems.length > 2 && (
                                <span
                                  className={`text-[10px] ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}
                                >
                                  +{patient.problems.length - 2}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className={isDarkMode ? 'text-gray-600' : 'text-gray-300'}>
                              —
                            </span>
                          )}
                        </td>
                      )}

                      {/* Tasks */}
                      {isColumnVisible('tasks') && (
                        <td className="px-3 py-2.5 text-center">
                          {patient.tasksRemaining > 0 ? (
                            <span
                              className={`inline-flex items-center justify-center w-6 h-5 rounded text-[10px] font-bold ${isDarkMode ? 'bg-purple-900/50 text-purple-300' : 'bg-purple-100 text-purple-700'}`}
                            >
                              {patient.tasksRemaining}
                            </span>
                          ) : (
                            <span className={isDarkMode ? 'text-gray-600' : 'text-gray-300'}>
                              —
                            </span>
                          )}
                        </td>
                      )}

                      {/* Critical Labs */}
                      {isColumnVisible('criticalLabs') && (
                        <td className="px-3 py-2.5">
                          {patient.hasCriticalLabs ? (
                            <div className="flex flex-wrap gap-1">
                              {patient.criticalLabValues.map((lab, i) => (
                                <span
                                  key={i}
                                  className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${isDarkMode ? 'bg-red-900/50 text-red-300' : 'bg-red-100 text-red-700'}`}
                                >
                                  <AlertTriangle className="w-2.5 h-2.5" />
                                  {lab}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className={isDarkMode ? 'text-gray-600' : 'text-gray-300'}>
                              —
                            </span>
                          )}
                        </td>
                      )}

                      {/* Dispo */}
                      {isColumnVisible('disposition') && (
                        <td className="px-3 py-2.5">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${isDarkMode ? dispoColor.darkBg : dispoColor.bg} ${isDarkMode ? dispoColor.darkText : dispoColor.text}`}
                          >
                            {patient.dispo}
                          </span>
                        </td>
                      )}

                      {/* Vitals (optional) */}
                      {isColumnVisible('vitals') && (
                        <td
                          className={`px-3 py-2.5 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
                        >
                          {patient.vitals || (
                            <EmptyCell
                              field="vitals"
                              patientIndex={patient.index}
                              patientName={patient.name}
                              patientContext={patient.rawContext}
                              onAiFill={onAiFill}
                              isDarkMode={isDarkMode}
                            />
                          )}
                        </td>
                      )}

                      {/* Active Meds (optional) */}
                      {isColumnVisible('meds') && (
                        <td className="px-3 py-2.5 text-center">
                          <span
                            className={`inline-flex items-center justify-center w-6 h-5 rounded text-[10px] font-medium ${isDarkMode ? 'bg-blue-900/50 text-blue-300' : 'bg-blue-100 text-blue-700'}`}
                          >
                            {patient.activeMeds}
                          </span>
                        </td>
                      )}

                      {/* Code Status (optional) */}
                      {isColumnVisible('codeStatus') && (
                        <td className="px-3 py-2.5 text-center">
                          {patient.codeStatus ? (
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${patient.codeStatus === 'Full' ? (isDarkMode ? 'bg-green-900/50 text-green-300' : 'bg-green-100 text-green-700') : isDarkMode ? 'bg-yellow-900/50 text-yellow-300' : 'bg-yellow-100 text-yellow-700'}`}
                            >
                              {patient.codeStatus}
                            </span>
                          ) : (
                            <EmptyCell
                              field="codeStatus"
                              patientIndex={patient.index}
                              patientName={patient.name}
                              patientContext={patient.rawContext}
                              onAiFill={onAiFill}
                              isDarkMode={isDarkMode}
                            />
                          )}
                        </td>
                      )}

                      {/* LOS (optional) */}
                      {isColumnVisible('los') && (
                        <td
                          className={`px-3 py-2.5 text-center text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
                        >
                          {patient.los || (
                            <EmptyCell
                              field="los"
                              patientIndex={patient.index}
                              patientName={patient.name}
                              patientContext={patient.rawContext}
                              onAiFill={onAiFill}
                              isDarkMode={isDarkMode}
                            />
                          )}
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

      {/* Legend */}
      <div className={`mt-4 p-3 rounded-lg ${isDarkMode ? 'bg-gray-800/50' : 'bg-gray-50'}`}>
        <div className="flex flex-wrap gap-6">
          <div>
            <h4
              className={`text-[10px] uppercase tracking-wider font-semibold mb-2 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}
            >
              Acuity
            </h4>
            <div className="flex flex-wrap gap-2">
              {Object.entries(ACUITY_COLORS).map(([status, colors]) => (
                <span
                  key={status}
                  className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium capitalize border ${isDarkMode ? colors.dark : colors.light}`}
                >
                  {status}
                </span>
              ))}
            </div>
          </div>
          <div>
            <h4
              className={`text-[10px] uppercase tracking-wider font-semibold mb-2 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}
            >
              Trend
            </h4>
            <div className="flex gap-3">
              <div className="flex items-center gap-1 text-[10px]">
                <TrendingUp className="w-3 h-3 text-green-500" /> Improving
              </div>
              <div className="flex items-center gap-1 text-[10px]">
                <Minus className="w-3 h-3 text-gray-400" /> Stable
              </div>
              <div className="flex items-center gap-1 text-[10px]">
                <TrendingDown className="w-3 h-3 text-red-500" /> Worsening
              </div>
            </div>
          </div>
        </div>
      </div>
    </DataViewWrapper>
  );
};
