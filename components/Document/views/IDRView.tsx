import React, { useContext, useMemo } from 'react';
import { Users, Home, Activity, Stethoscope, ClipboardCheck, AlertTriangle } from 'lucide-react';
import { DataViewWrapper } from './DataViewWrapper';
import { ThemeContext } from '../../../contexts/ThemeContext';
import { parseRawContent, extractNameFromHeader } from '../../../utils/documentUtils';

interface IDRViewProps {
  content: string;
}

interface IDRPatient {
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
  teamMember?: string;
}

// Color mapping for disposition status
const DISPO_COLORS: Record<
  IDRPatient['dispoStatus'],
  { bg: string; text: string; darkBg: string; darkText: string }
> = {
  pending: {
    bg: 'bg-yellow-100',
    text: 'text-yellow-800',
    darkBg: 'bg-yellow-900/40',
    darkText: 'text-yellow-300',
  },
  ready: {
    bg: 'bg-green-100',
    text: 'text-green-800',
    darkBg: 'bg-green-900/40',
    darkText: 'text-green-300',
  },
  blocked: {
    bg: 'bg-red-100',
    text: 'text-red-800',
    darkBg: 'bg-red-900/40',
    darkText: 'text-red-300',
  },
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
  unknown: {
    bg: 'bg-gray-100',
    text: 'text-gray-800',
    darkBg: 'bg-gray-700',
    darkText: 'text-gray-300',
  },
};

// Parse dispo text to determine status
function parseDispoStatus(dispo: string): IDRPatient['dispoStatus'] {
  const lower = dispo.toLowerCase();
  if (lower.includes('home') || lower.includes('d/c home')) return 'home';
  if (lower.includes('snf') || lower.includes('skilled nursing')) return 'snf';
  if (lower.includes('rehab') || lower.includes('rehabilitation') || lower.includes('ltach'))
    return 'rehab';
  if (lower.includes('ready') || lower.includes('today') || lower.includes('tomorrow'))
    return 'ready';
  if (lower.includes('block') || lower.includes('barrier') || lower.includes('waiting'))
    return 'blocked';
  if (lower.includes('pending') || lower.includes('unclear') || lower.includes('tbd'))
    return 'pending';
  return 'unknown';
}

// Extract IDR-relevant info from patient content
function extractIDRData(header: string, lines: string[], index: number): IDRPatient {
  const { name, room, age, gender } = extractNameFromHeader(header);
  const content = lines.join('\n').toLowerCase();

  // Extract social barriers
  const socialBarriers: string[] = [];
  if (content.includes('homeless') || content.includes('housing')) socialBarriers.push('Housing');
  if (content.includes('transport') || content.includes('ride'))
    socialBarriers.push('Transportation');
  if (
    content.includes('insurance') ||
    content.includes('uninsured') ||
    content.includes('medicaid pending')
  )
    socialBarriers.push('Insurance');
  if (content.includes('family') || content.includes('caregiver') || content.includes('support'))
    socialBarriers.push('Support System');
  if (content.includes('language') || content.includes('interpreter'))
    socialBarriers.push('Language');
  if (content.includes('safety') || content.includes('abuse') || content.includes('shelter'))
    socialBarriers.push('Safety');
  if (content.includes('substance') || content.includes('alcohol') || content.includes('drug'))
    socialBarriers.push('Substance Use');

  // Extract PT/OT status
  let ptStatus = '—';
  let otStatus = '—';
  const ptMatch =
    content.match(/pt[:\s]*([\w\s]+?)(?:\n|,|;|$)/i) ||
    content.match(/physical therapy[:\s]*([\w\s]+?)(?:\n|,|;|$)/i);
  const otMatch =
    content.match(/ot[:\s]*([\w\s]+?)(?:\n|,|;|$)/i) ||
    content.match(/occupational therapy[:\s]*([\w\s]+?)(?:\n|,|;|$)/i);

  if (ptMatch) ptStatus = ptMatch[1].trim().substring(0, 20);
  if (otMatch) otStatus = otMatch[1].trim().substring(0, 20);

  // Check for common PT/OT keywords
  if (content.includes('pt eval') || content.includes('pt consult')) ptStatus = 'Eval ordered';
  if (content.includes('pt following') || content.includes('working with pt'))
    ptStatus = 'Following';
  if (content.includes('pt cleared') || content.includes('pt ok')) ptStatus = 'Cleared';
  if (content.includes('ot eval') || content.includes('ot consult')) otStatus = 'Eval ordered';
  if (content.includes('ot following') || content.includes('working with ot'))
    otStatus = 'Following';
  if (content.includes('ot cleared') || content.includes('ot ok')) otStatus = 'Cleared';

  // Extract case management notes
  let cmNotes = '—';
  const cmMatch = content.match(/(?:cm|case management|sw|social work)[:\s]*([\w\s,]+?)(?:\n|$)/i);
  if (cmMatch) cmNotes = cmMatch[1].trim().substring(0, 40);

  // Check for common CM keywords
  if (content.includes('insurance auth') || content.includes('prior auth'))
    cmNotes = 'Working on auth';
  if (content.includes('snf search') || content.includes('placement')) cmNotes = 'Placement search';
  if (content.includes('home health')) cmNotes = 'Home health setup';

  // Extract dispo
  let dispo = 'TBD';
  const dispoMatch = content.match(
    /(?:dispo|disposition|discharge|d\/c)[:\s]*([\w\s\/]+?)(?:\n|,|;|$)/i
  );
  if (dispoMatch) {
    dispo = dispoMatch[1].trim().substring(0, 25);
  }

  // Get admitted for
  let admittedFor = '';
  const admitMatch = content.match(
    /(?:admitted for|reason|chief complaint|cc)[:\s]*([\w\s,]+?)(?:\n|$)/i
  );
  if (admitMatch) {
    admittedFor = admitMatch[1].trim().substring(0, 30);
  }

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
  };
}

export const IDRView: React.FC<IDRViewProps> = ({ content }) => {
  const { isDarkMode } = useContext(ThemeContext);

  // Parse content into IDR patient data
  const patients = useMemo(() => {
    const groups = parseRawContent(content);
    return groups
      .filter(g => g.header !== '### Preamble')
      .map((g, idx) => extractIDRData(g.header, g.lines, idx + 1));
  }, [content]);

  // Summary stats
  const stats = useMemo(() => {
    const total = patients.length;
    const readyForDC = patients.filter(
      p => p.dispoStatus === 'ready' || p.dispoStatus === 'home'
    ).length;
    const blocked = patients.filter(p => p.dispoStatus === 'blocked').length;
    const withSocialBarriers = patients.filter(p => p.socialBarriers.length > 0).length;
    const needsPT = patients.filter(p => p.ptStatus !== '—' && p.ptStatus !== 'Cleared').length;
    const needsOT = patients.filter(p => p.otStatus !== '—' && p.otStatus !== 'Cleared').length;
    return { total, readyForDC, blocked, withSocialBarriers, needsPT, needsOT };
  }, [patients]);

  const baseCardClass = isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';
  const headerClass = isDarkMode
    ? 'bg-gray-900 text-gray-100'
    : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white';

  return (
    <DataViewWrapper title="IDR Rounds View" icon={Users}>
      {/* Summary Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        <StatCard
          icon={Users}
          label="Total Patients"
          value={stats.total}
          color="blue"
          isDarkMode={isDarkMode}
        />
        <StatCard
          icon={Home}
          label="Ready for D/C"
          value={stats.readyForDC}
          color="green"
          isDarkMode={isDarkMode}
        />
        <StatCard
          icon={AlertTriangle}
          label="Blocked"
          value={stats.blocked}
          color="red"
          isDarkMode={isDarkMode}
        />
        <StatCard
          icon={ClipboardCheck}
          label="Social Barriers"
          value={stats.withSocialBarriers}
          color="yellow"
          isDarkMode={isDarkMode}
        />
        <StatCard
          icon={Activity}
          label="Needs PT"
          value={stats.needsPT}
          color="purple"
          isDarkMode={isDarkMode}
        />
        <StatCard
          icon={Stethoscope}
          label="Needs OT"
          value={stats.needsOT}
          color="indigo"
          isDarkMode={isDarkMode}
        />
      </div>

      {/* Main IDR Table */}
      <div className={`rounded-xl border overflow-hidden shadow-lg ${baseCardClass}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className={headerClass}>
                <th className="px-4 py-3 text-left font-semibold">Room</th>
                <th className="px-4 py-3 text-left font-semibold">Patient</th>
                <th className="px-4 py-3 text-left font-semibold">Admitted For</th>
                <th className="px-4 py-3 text-left font-semibold">Social Barriers</th>
                <th className="px-4 py-3 text-center font-semibold">PT</th>
                <th className="px-4 py-3 text-center font-semibold">OT</th>
                <th className="px-4 py-3 text-left font-semibold">CM/SW Notes</th>
                <th className="px-4 py-3 text-left font-semibold">Dispo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {patients.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className={`px-4 py-8 text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
                  >
                    No patients found. Paste your signout to see IDR data.
                  </td>
                </tr>
              ) : (
                patients.map((patient, idx) => {
                  const dispoColor = DISPO_COLORS[patient.dispoStatus];
                  const rowClass =
                    idx % 2 === 0
                      ? isDarkMode
                        ? 'bg-gray-800'
                        : 'bg-white'
                      : isDarkMode
                        ? 'bg-gray-850'
                        : 'bg-gray-50';

                  return (
                    <tr
                      key={patient.index}
                      className={`${rowClass} hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors`}
                    >
                      {/* Room */}
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center justify-center w-14 h-8 rounded-lg font-bold text-sm
                          ${isDarkMode ? 'bg-blue-900/50 text-blue-300' : 'bg-blue-100 text-blue-700'}`}
                        >
                          {patient.room}
                        </span>
                      </td>

                      {/* Patient Name */}
                      <td className="px-4 py-3">
                        <div
                          className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                        >
                          {patient.name}
                        </div>
                        {(patient.age || patient.gender) && (
                          <div
                            className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
                          >
                            {patient.age}
                            {patient.age && patient.gender && ', '}
                            {patient.gender}
                          </div>
                        )}
                      </td>

                      {/* Admitted For */}
                      <td className={`px-4 py-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        {patient.admittedFor || '—'}
                      </td>

                      {/* Social Barriers */}
                      <td className="px-4 py-3">
                        {patient.socialBarriers.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {patient.socialBarriers.map((barrier, i) => (
                              <span
                                key={i}
                                className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium
                                  ${isDarkMode ? 'bg-orange-900/50 text-orange-300' : 'bg-orange-100 text-orange-700'}`}
                              >
                                {barrier}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className={isDarkMode ? 'text-gray-500' : 'text-gray-400'}>—</span>
                        )}
                      </td>

                      {/* PT Status */}
                      <td className="px-4 py-3 text-center">
                        <StatusBadge status={patient.ptStatus} type="pt" isDarkMode={isDarkMode} />
                      </td>

                      {/* OT Status */}
                      <td className="px-4 py-3 text-center">
                        <StatusBadge status={patient.otStatus} type="ot" isDarkMode={isDarkMode} />
                      </td>

                      {/* CM/SW Notes */}
                      <td
                        className={`px-4 py-3 max-w-xs truncate ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
                      >
                        {patient.cmNotes}
                      </td>

                      {/* Dispo */}
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-semibold
                          ${isDarkMode ? dispoColor.darkBg : dispoColor.bg}
                          ${isDarkMode ? dispoColor.darkText : dispoColor.text}`}
                        >
                          {patient.dispo}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Legend */}
      <div className={`mt-4 p-4 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
        <h3
          className={`text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
        >
          Dispo Status Legend
        </h3>
        <div className="flex flex-wrap gap-3">
          {Object.entries(DISPO_COLORS).map(([status, colors]) => (
            <span
              key={status}
              className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium
                ${isDarkMode ? colors.darkBg : colors.bg}
                ${isDarkMode ? colors.darkText : colors.text}`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
          ))}
        </div>
      </div>
    </DataViewWrapper>
  );
};

// Stat Card Component
interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: number;
  color: 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'indigo';
  isDarkMode: boolean;
}

const STAT_COLORS = {
  blue: { light: 'bg-blue-100 text-blue-600', dark: 'bg-blue-900/40 text-blue-400' },
  green: { light: 'bg-green-100 text-green-600', dark: 'bg-green-900/40 text-green-400' },
  red: { light: 'bg-red-100 text-red-600', dark: 'bg-red-900/40 text-red-400' },
  yellow: { light: 'bg-yellow-100 text-yellow-600', dark: 'bg-yellow-900/40 text-yellow-400' },
  purple: { light: 'bg-purple-100 text-purple-600', dark: 'bg-purple-900/40 text-purple-400' },
  indigo: { light: 'bg-indigo-100 text-indigo-600', dark: 'bg-indigo-900/40 text-indigo-400' },
};

const StatCard: React.FC<StatCardProps> = ({ icon: Icon, label, value, color, isDarkMode }) => {
  const colorClass = isDarkMode ? STAT_COLORS[color].dark : STAT_COLORS[color].light;
  return (
    <div className={`rounded-lg p-3 ${colorClass}`}>
      <div className="flex items-center gap-2">
        <Icon className="w-5 h-5" />
        <span className="text-2xl font-bold">{value}</span>
      </div>
      <div className="text-xs mt-1 opacity-80">{label}</div>
    </div>
  );
};

// Status Badge for PT/OT
interface StatusBadgeProps {
  status: string;
  type: 'pt' | 'ot';
  isDarkMode: boolean;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, isDarkMode }) => {
  if (status === '—') {
    return <span className={isDarkMode ? 'text-gray-500' : 'text-gray-400'}>—</span>;
  }

  let bgColor = isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700';

  if (status.toLowerCase().includes('cleared') || status.toLowerCase().includes('ok')) {
    bgColor = isDarkMode ? 'bg-green-900/50 text-green-300' : 'bg-green-100 text-green-700';
  } else if (status.toLowerCase().includes('eval') || status.toLowerCase().includes('ordered')) {
    bgColor = isDarkMode ? 'bg-yellow-900/50 text-yellow-300' : 'bg-yellow-100 text-yellow-700';
  } else if (status.toLowerCase().includes('following')) {
    bgColor = isDarkMode ? 'bg-blue-900/50 text-blue-300' : 'bg-blue-100 text-blue-700';
  }

  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${bgColor}`}>
      {status}
    </span>
  );
};
