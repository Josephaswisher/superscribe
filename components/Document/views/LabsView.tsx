import React, { useMemo, useContext } from 'react';
import { TestTube2 } from 'lucide-react';
import { extractLabsFromContent } from '../../../utils/documentUtils';
import { DataViewWrapper } from './DataViewWrapper';
import { PatientDataSection } from './PatientDataSection';
import { ThemeContext } from '../../../contexts/ThemeContext';

interface LabsViewProps {
    content: string;
}

export const LabsView: React.FC<LabsViewProps> = ({ content }) => {
    const { isDarkMode } = useContext(ThemeContext);
    const patients = useMemo(() => extractLabsFromContent(content), [content]);
    return (
        <DataViewWrapper title="Labs-Only View" icon={TestTube2}>
            {patients.map((p, i) => (
                <PatientDataSection key={i} header={p.patientHeader}>
                   {p.labs.map((l, j) => <p key={j} className={isDarkMode ? 'text-gray-300' : 'text-gray-800'}>{l}</p>)}
                </PatientDataSection>
            ))}
        </DataViewWrapper>
    );
};