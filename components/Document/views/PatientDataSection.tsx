import React, { useContext } from 'react';
import { extractNameFromHeader } from '../../../utils/documentUtils';
import { ThemeContext } from '../../../contexts/ThemeContext';

interface PatientDataSectionProps {
    header: string;
    children: React.ReactNode;
}

export const PatientDataSection: React.FC<PatientDataSectionProps> = ({ header, children }) => {
    const { isDarkMode } = useContext(ThemeContext);
    return (
        <div className={`rounded-lg border ${isDarkMode ? 'bg-gray-850 border-gray-750' : 'bg-white border-gray-200 shadow-sm'}`}>
            <h2 className={`px-4 py-2 font-bold border-b ${isDarkMode ? 'text-gray-200 border-gray-750 bg-gray-900' : 'text-gray-800 border-gray-200 bg-gray-50'}`}>
                {extractNameFromHeader(header).name}
            </h2>
            <div className="p-4 text-sm font-mono">{children}</div>
        </div>
    );
};