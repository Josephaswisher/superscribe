import React, { useContext } from 'react';
import { highlightText, CRITICAL_LAB_REGEX, TREND_INDICATOR_REGEX, RISK_CALCULATOR_REGEX } from '../utils/documentUtils';
import { ThemeContext } from '../contexts/ThemeContext';

interface RichTextLineProps {
  text: string;
  searchQuery: string;
}

export const RichTextLine: React.FC<RichTextLineProps> = ({ text, searchQuery }) => {
  const { isDarkMode } = useContext(ThemeContext);
  const combinedRegex = new RegExp(
    `(${CRITICAL_LAB_REGEX.source}|${TREND_INDICATOR_REGEX.source}|${RISK_CALCULATOR_REGEX.source}|\\*\\*.*?\\*\\*|#[^:\\n]+:|#[A-Za-z0-9_-]+)`,
    'gi'
  );

  const parts = text.split(combinedRegex).filter(Boolean);

  const isMarkdownTableRow = text.trim().startsWith('|') && text.trim().endsWith('|') && text.includes('---');
  const isTableContentRow = text.trim().startsWith('|') && text.trim().endsWith('|') && !isMarkdownTableRow;

  if (isTableContentRow) {
    const cells = text.split('|').map(s => s.trim()).filter(Boolean);
    return (
      <span className="markdown-table-row flex">
        {cells.map((cell, i) => (
          <span 
            key={i} 
            className={`
              flex-1 py-1 px-2 font-mono text-sm 
              ${isDarkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-50 text-gray-800'} 
              border-r border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}
              ${i === 0 ? 'border-l' : ''}
            `}
            style={{flexBasis: `${100/cells.length}%`}}
          >
            {highlightText(cell, searchQuery, isDarkMode)}
          </span>
        ))}
      </span>
    );
  }

  return (
    <span>
      {parts.map((part, i) => {
        if (!part) return null;

        if (part.startsWith('**') && part.endsWith('**')) {
          const content = part.slice(2, -2);
          const isLabel = content.trim().endsWith(':') || 
                          ['Age', 'PMHx', 'Admitted for', 'Consults', 'Summary', 'Plan', 'Dispo', 'Attestation', 'Update', 'Tasks', 'Neuro', 'CV', 'Resp', 'Renal', 'ID', 'Admission Date'].some(k => content.includes(k));
          const isAttestation = content.includes('Attestation');
          
          return (
            <strong 
              key={i} 
              className={`font-bold ${isLabel 
                ? (isDarkMode ? 'text-gray-400' : 'text-gray-600') + ' font-sans text-[11px] uppercase tracking-wider mr-2 select-none' 
                : (isDarkMode ? 'text-gray-100' : 'text-gray-900')
              } ${isAttestation ? 'text-[#d97757]' : ''}`}
            >
              {highlightText(content, searchQuery, isDarkMode)}
            </strong>
          );
        }

        if (part.startsWith('#') && part.endsWith(':')) {
             const content = part.slice(1); 
             return (
                 <span key={i} className={`font-bold ${isDarkMode ? 'text-blue-300' : 'text-blue-800'}`}>
                    {highlightText(content, searchQuery, isDarkMode)}
                 </span>
             )
        }

        if (part.startsWith('#') && !part.includes(' ')) {
             return (
                 <span key={i} className={`font-medium ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                    {highlightText(part, searchQuery, isDarkMode)}
                 </span>
             )
        }

        if (part.match(CRITICAL_LAB_REGEX)) {
            return (
                <strong key={i} className={`${isDarkMode ? 'text-red-300 bg-red-900/20' : 'text-red-700 bg-red-100'} px-0.5 rounded font-bold`}>
                    {highlightText(part, searchQuery, isDarkMode)}
                </strong>
            );
        }

        if (part.match(TREND_INDICATOR_REGEX)) {
            let colorClass = '';
            if (part === '↗') colorClass = isDarkMode ? 'text-red-400' : 'text-red-700';
            else if (part === '↘') colorClass = isDarkMode ? 'text-green-400' : 'text-green-700';
            else if (part === '↔') colorClass = isDarkMode ? 'text-yellow-400' : 'text-yellow-700';
            return (
                <span key={i} className={`font-bold ${colorClass}`}>
                    {part}
                </span>
            );
        }

        if (part.match(RISK_CALCULATOR_REGEX)) {
            return (
                <strong key={i} className={`${isDarkMode ? 'text-purple-300 bg-purple-900/20' : 'text-purple-700 bg-purple-100'} px-0.5 rounded font-bold`}>
                    {highlightText(part, searchQuery, isDarkMode)}
                </strong>
            );
        }
        
        return (
            <span key={i} className={isDarkMode ? 'text-gray-300' : 'text-gray-800'}>
                {highlightText(part, searchQuery, isDarkMode)}
            </span>
        );
      })}
    </span>
  );
};