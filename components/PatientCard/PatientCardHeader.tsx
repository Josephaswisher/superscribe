import { useContext } from 'react';
import {
  Bed,
  Activity,
  Heart,
  Thermometer,
  Wind,
  AlertTriangle,
  User,
  GraduationCap,
} from 'lucide-react';
import { ThemeContext } from '../../contexts/ThemeContext';
import { highlightText } from '../../utils/documentUtils';
import type { PatientData } from './usePatientData';

interface PatientCardHeaderProps {
  data: PatientData;
  searchQuery: string;
  isCollapsed: boolean;
}

export function PatientCardHeader({ data, searchQuery, isCollapsed }: PatientCardHeaderProps) {
  const { isDarkMode } = useContext(ThemeContext);
  const { patientName, patientRoom, age, admitReason, vitals } = data;

  return (
    <div className="flex flex-col gap-3">
      {/* Row 1: Name, Room, Vitals */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center flex-wrap gap-4">
          <h2
            className={`text-xl font-bold leading-none tracking-tight ${
              isDarkMode ? 'text-gray-100' : 'text-gray-900'
            }`}
          >
            {highlightText(patientName, searchQuery, isDarkMode)}
          </h2>
          {patientRoom && (
            <div
              className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-bold font-mono border shadow-sm ${
                isDarkMode
                  ? 'bg-gray-800 border-gray-700 text-gray-300'
                  : 'bg-white border-gray-200 text-gray-700'
              }`}
              title="Room Number"
            >
              <Bed className="w-3.5 h-3.5 opacity-70" />
              <span className="font-bold font-mono text-sm tracking-tight">
                {highlightText(patientRoom, searchQuery, isDarkMode)}
              </span>
            </div>
          )}
        </div>

        {/* Vitals Display */}
        {vitals && <VitalsDisplay vitals={vitals} isDarkMode={isDarkMode} />}
      </div>

      {/* Row 2: Age, Reason */}
      {(age || admitReason) && (
        <PatientDemographics
          age={age}
          admitReason={admitReason}
          searchQuery={searchQuery}
          isDarkMode={isDarkMode}
        />
      )}

      {/* Row 3: Badges */}
      <PatientBadges data={data} isDarkMode={isDarkMode} />

      {/* Row 4: Progress */}
      <TaskProgress tasks={data.tasks} />

      {/* Collapsed Summary */}
      {isCollapsed && (
        <CollapsedSummary data={data} searchQuery={searchQuery} isDarkMode={isDarkMode} />
      )}
    </div>
  );
}

// Sub-components

function VitalsDisplay({
  vitals,
  isDarkMode,
}: {
  vitals: NonNullable<PatientData['vitals']>;
  isDarkMode: boolean;
}) {
  return (
    <div
      className={`hidden sm:flex items-center gap-3 text-xs font-mono px-3 py-1.5 rounded-md border shadow-sm ${
        isDarkMode
          ? 'bg-black/20 border-gray-700 text-gray-300'
          : 'bg-white border-gray-200 text-gray-600'
      }`}
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
        </div>
      )}
      {vitals.o2 && (
        <div className="flex items-center gap-1.5 border-l pl-3 border-gray-500/20" title="SpO2">
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
        </div>
      )}
    </div>
  );
}

function PatientDemographics({
  age,
  admitReason,
  searchQuery,
  isDarkMode,
}: {
  age: string;
  admitReason: string;
  searchQuery: string;
  isDarkMode: boolean;
}) {
  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 text-sm ${
        isDarkMode ? 'text-gray-400' : 'text-gray-600'
      }`}
    >
      {age && (
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-1.5 h-1.5 rounded-full bg-[#d97757]" />
          <span className={`font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
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
            <span className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-800'}`}>
              {highlightText(admitReason, searchQuery, isDarkMode)}
            </span>
          </span>
        </div>
      )}
    </div>
  );
}

function PatientBadges({ data, isDarkMode }: { data: PatientData; isDarkMode: boolean }) {
  const { statusBadges, clinicalKeywords, residentMD, studentMD } = data;

  const hasTeamAssignments = residentMD || studentMD;
  if (statusBadges.length === 0 && clinicalKeywords.length === 0 && !hasTeamAssignments)
    return null;

  return (
    <div className="flex flex-wrap gap-2">
      {/* Team Assignment Badges */}
      {residentMD && (
        <span
          className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md border ${
            isDarkMode
              ? 'bg-purple-900/30 border-purple-800 text-purple-300'
              : 'bg-purple-50 border-purple-100 text-purple-700'
          }`}
          title="Assigned Resident"
        >
          <User className="w-3 h-3" />
          {residentMD}
        </span>
      )}
      {studentMD && (
        <span
          className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md border ${
            isDarkMode
              ? 'bg-amber-900/30 border-amber-800 text-amber-300'
              : 'bg-amber-50 border-amber-100 text-amber-700'
          }`}
          title="Assigned Medical Student"
        >
          <GraduationCap className="w-3 h-3" />
          {studentMD}
        </span>
      )}

      {/* Status Badges */}
      {statusBadges.map(b => (
        <span
          key={b}
          className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-md border ${
            isDarkMode
              ? 'bg-indigo-900/30 border-indigo-800 text-indigo-300'
              : 'bg-indigo-50 border-indigo-100 text-indigo-700'
          }`}
        >
          {b}
        </span>
      ))}
      {clinicalKeywords.slice(0, 4).map(kw => (
        <span
          key={kw}
          className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-md border ${
            isDarkMode
              ? 'bg-blue-900/30 border-blue-800 text-blue-300'
              : 'bg-blue-50 border-blue-100 text-blue-700'
          }`}
        >
          {kw}
        </span>
      ))}
    </div>
  );
}

function TaskProgress({ tasks }: { tasks: PatientData['tasks'] }) {
  if (tasks.total === 0) return null;

  return (
    <div
      className="flex items-center gap-3 mt-1 opacity-90"
      title={`${tasks.completed}/${tasks.total} Tasks Complete`}
    >
      <div className="w-24 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            tasks.progress === 100 ? 'bg-green-500' : 'bg-[#d97757]'
          }`}
          style={{ width: `${tasks.progress}%` }}
        />
      </div>
      <span
        className={`text-[10px] font-medium ${
          tasks.progress === 100 ? 'text-green-500' : 'text-gray-400'
        }`}
      >
        {tasks.completed}/{tasks.total} Tasks
      </span>
    </div>
  );
}

function CollapsedSummary({
  data,
  searchQuery,
  isDarkMode,
}: {
  data: PatientData;
  searchQuery: string;
  isDarkMode: boolean;
}) {
  const { criticalLabs, problems, summarySnippet, dispo } = data;

  return (
    <div
      className={`mt-2 pt-3 border-t border-dashed animate-in fade-in slide-in-from-top-1 duration-200 ${
        isDarkMode ? 'border-gray-700' : 'border-gray-200'
      }`}
    >
      {/* Critical Labs */}
      {criticalLabs.length > 0 && (
        <div
          className={`flex flex-wrap gap-2 mb-3 p-2 rounded-md ${
            isDarkMode
              ? 'bg-red-900/10 border border-red-900/30'
              : 'bg-red-50 border border-red-100'
          }`}
        >
          <div className="flex items-center gap-1.5 text-red-500 text-[10px] font-bold uppercase tracking-wider mr-1">
            <AlertTriangle className="w-3 h-3" /> Critical
          </div>
          {criticalLabs.map((lab, i) => (
            <span
              key={i}
              className={`text-xs font-bold px-1.5 rounded ${
                isDarkMode
                  ? 'text-red-300 bg-red-900/30'
                  : 'text-red-700 bg-white border border-red-200 shadow-sm'
              }`}
            >
              {lab}
            </span>
          ))}
        </div>
      )}

      {/* Problems */}
      {problems.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {problems.map((p, i) => (
            <span
              key={i}
              className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${
                isDarkMode
                  ? 'bg-blue-900/20 text-blue-300 border-blue-800'
                  : 'bg-blue-50 text-blue-700 border-blue-100'
              }`}
            >
              #{p}
            </span>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 gap-1">
        {summarySnippet && (
          <div
            className={`flex gap-2 text-xs leading-relaxed ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}
          >
            <span
              className={`font-bold shrink-0 text-[10px] uppercase tracking-wider mt-0.5 ${
                isDarkMode ? 'text-gray-500' : 'text-gray-400'
              }`}
            >
              Summary
            </span>
            <span className="line-clamp-2">
              {highlightText(summarySnippet, searchQuery, isDarkMode)}
            </span>
          </div>
        )}
        {dispo && (
          <div
            className={`flex gap-2 text-xs leading-relaxed items-center mt-1 ${
              isDarkMode ? 'text-green-400' : 'text-green-700'
            }`}
          >
            <span
              className={`font-bold shrink-0 text-[10px] uppercase tracking-wider opacity-70 ${
                isDarkMode ? 'text-green-500' : 'text-green-600'
              }`}
            >
              Plan
            </span>
            <span className="font-medium">{highlightText(dispo, searchQuery, isDarkMode)}</span>
          </div>
        )}
      </div>
    </div>
  );
}
