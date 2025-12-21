import React, { useMemo, useContext } from 'react';
import { Pill } from 'lucide-react';
import { extractMedsFromContent } from '../../../utils/documentUtils';
import { DataViewWrapper } from './DataViewWrapper';
import { PatientDataSection } from './PatientDataSection';
import { ThemeContext } from '../../../contexts/ThemeContext';

interface MedsViewProps {
    content: string;
}

export const MedsView: React.FC<MedsViewProps> = ({ content }) => {
    const { isDarkMode } = useContext(ThemeContext);
    const patients = useMemo(() => extractMedsFromContent(content), [content]);
    return (
        <DataViewWrapper title="Medication View" icon={Pill}>
            {patients.map((p, i) => (
                <PatientDataSection key={i} header={p.patientHeader}>
                   {p.meds.map((m, j) => <p key={j} className={isDarkMode ? 'text-gray-300' : 'text-gray-800'}>{m}</p>)}
                </PatientDataSection>
            ))}
        </DataViewWrapper>
    );
};