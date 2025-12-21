import React, { useMemo, useContext } from 'react';
import { AlertTriangle } from 'lucide-react';
import { extractCriticalPatients } from '../../../utils/documentUtils';
import { DataViewWrapper } from './DataViewWrapper';
import { PatientDataSection } from './PatientDataSection';
import { ThemeContext } from '../../../contexts/ThemeContext';

interface CriticalAlertsViewProps {
    content: string;
}

export const CriticalAlertsView: React.FC<CriticalAlertsViewProps> = ({ content }) => {
    const { isDarkMode } = useContext(ThemeContext);
    const patients = useMemo(() => extractCriticalPatients(content), [content]);
    return (
         <DataViewWrapper title="Critical Alerts View" icon={AlertTriangle}>
            {patients.map((p, i) => (
                <PatientDataSection key={i} header={p.header}>
                   <pre className={`whitespace-pre-wrap ${isDarkMode ? 'text-gray-300' : 'text-gray-800'}`}>{p.lines.join('\n')}</pre>
                </PatientDataSection>
            ))}
        </DataViewWrapper>
    );
};