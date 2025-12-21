import { useState, useEffect, useContext } from 'react';
import { ThemeContext } from '../../contexts/ThemeContext';
import { UISettingsContext } from '../../contexts/UISettingsContext';
import { cleanTextForEMR } from '../../utils/documentUtils';
import { usePatientData } from './usePatientData';
import { PatientCardHeader } from './PatientCardHeader';
import { PatientCardActions } from './PatientCardActions';
import { PatientCardBody } from './PatientCardBody';
import { UIDensity } from '../../types';

interface PatientCardProps {
  header: string;
  lines: string[];
  index: number;
  searchQuery: string;
  onUpdateFullSection: (newText: string) => void;
  onCopy: (text: string) => void;
  onDelete: () => void;
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

export function PatientCard({
  header,
  lines,
  index,
  searchQuery,
  onUpdateFullSection,
  onCopy,
  onDelete,
}: PatientCardProps) {
  const { isDarkMode } = useContext(ThemeContext);
  const { uiDensity, setPrefillChat } = useContext(UISettingsContext);

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const patientData = usePatientData(header, lines);
  const styles = DENSITY_STYLES[uiDensity];

  // Auto-expand if search query matches content
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

  // Copy handlers
  const handleCopy = () => {
    const fullText = [header.replace('### ', ''), ...lines]
      .join('\n')
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/^- \[ \]/gm, '[ ]')
      .replace(/^- \[x\]/gm, '[x]')
      .replace(/^- /gm, '- ');
    onCopy(fullText);
  };

  const handleEmrCopy = () => {
    onCopy(cleanTextForEMR([header, ...lines].join('\n')));
  };

  const handleRawCopy = () => {
    onCopy([header, ...lines].join('\n'));
  };

  const handleChatFocus = () => {
    setPrefillChat(`Regarding ${patientData.patientName}: `);
  };

  const handleHeaderKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setIsCollapsed(!isCollapsed);
    }
  };

  return (
    <div
      id={`patient-${index}`}
      className={`
        transition-all duration-200 border overflow-hidden shadow-sm scroll-mt-24 group/card
        ${styles.wrapper}
        ${
          isDarkMode
            ? 'bg-[#1e1e1e] border-gray-800 hover:border-gray-700'
            : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-md'
        }
      `}
    >
      {/* Card Header */}
      <div
        className={`${styles.header} flex items-start justify-between ${
          isDarkMode
            ? 'bg-[#252525] border-b border-gray-800'
            : 'bg-gray-50/50 border-b border-gray-100'
        }`}
      >
        <div
          className="flex-1 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#d97757]/50 rounded-lg -m-2 p-2"
          onClick={() => setIsCollapsed(!isCollapsed)}
          role="button"
          tabIndex={0}
          aria-expanded={!isCollapsed}
          onKeyDown={handleHeaderKeyDown}
        >
          <PatientCardHeader
            data={patientData}
            searchQuery={searchQuery}
            isCollapsed={isCollapsed}
          />
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover/card:opacity-100 transition-opacity pl-4 pt-1">
          <PatientCardActions
            patientName={patientData.patientName}
            isEditing={isEditing}
            isCollapsed={isCollapsed}
            onSave={() => setIsEditing(false)}
            onEdit={() => setIsEditing(true)}
            onDelete={onDelete}
            onCopy={handleCopy}
            onEmrCopy={handleEmrCopy}
            onRawCopy={handleRawCopy}
            onChatFocus={handleChatFocus}
            onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
          />
        </div>
      </div>

      {/* Card Body */}
      <div
        id={`patient-content-${index}`}
        className={`transition-all duration-300 overflow-hidden ${
          isCollapsed ? 'max-h-0' : `max-h-[4000px] ${styles.body}`
        }`}
        aria-hidden={isCollapsed}
      >
        <PatientCardBody
          header={header}
          lines={lines}
          index={index}
          searchQuery={searchQuery}
          isEditing={isEditing}
          onUpdateFullSection={onUpdateFullSection}
          onSaveEdit={() => setIsEditing(false)}
          setIsEditing={setIsEditing}
        />
      </div>
    </div>
  );
}

// Re-export for backward compatibility
export { PatientCard as default };
