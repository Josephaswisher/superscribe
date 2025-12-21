import React, { useState, useEffect, useContext } from 'react';
import { FileOutput } from 'lucide-react';
import { generateHandoff } from '../../../services/aiService';
import { DataViewWrapper } from './DataViewWrapper';
import { ThemeContext } from '../../../contexts/ThemeContext';

interface HandoffViewProps {
    content: string;
}

export const HandoffView: React.FC<HandoffViewProps> = ({ content }) => {
    const { isDarkMode } = useContext(ThemeContext);
    const [handoffContent, setHandoffContent] = useState('Generating...');
    useEffect(() => {
        generateHandoff(content).then(setHandoffContent);
    }, [content]);
    return (
        <DataViewWrapper title="Handoff View" icon={FileOutput}>
            <pre className={`p-4 rounded-lg whitespace-pre-wrap text-sm ${isDarkMode ? 'bg-gray-950 text-gray-300' : 'bg-gray-100 text-gray-800'}`}>
                {handoffContent}
            </pre>
        </DataViewWrapper>
    );
};