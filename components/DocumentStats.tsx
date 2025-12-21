import React, { useContext } from 'react';
import { AlertCircle, Square, User } from 'lucide-react';
import { CRITICAL_LAB_REGEX } from '../utils/documentUtils';
import { ThemeContext } from '../contexts/ThemeContext';

interface DocumentStatsProps { 
  content: string; 
}

export const DocumentStats: React.FC<DocumentStatsProps> = ({ content }) => {
  const { isDarkMode } = useContext(ThemeContext);
  const patientCount = (content.match(/^### /gm) || []).length;
  const criticalLabs = (content.match(CRITICAL_LAB_REGEX) || []).length;
  const incompleteTasks = (content.match(/- \[ \]/g) || []).length;

  return (
    <div className={`flex items-center gap-4 px-3 py-1.5 text-[10px] font-medium rounded-full border ${isDarkMode ? 'bg-gray-900 border-gray-800 text-gray-50' : 'bg-gray-50 border-gray-200 text-gray-500'}`}>
       <div className="flex items-center gap-1.5">
         <User className="w-3 h-3" />
         <span>{patientCount} Patients</span>
       </div>
       {criticalLabs > 0 && (
         <>
            <div className="w-px h-3 bg-current opacity-20"></div>
            <div className="flex items-center gap-1.5 text-red-500">
                <AlertCircle className="w-3 h-3" />
                <span>{criticalLabs} Critical</span>
            </div>
         </>
       )}
       {incompleteTasks > 0 && (
         <>
            <div className="w-px h-3 bg-current opacity-20"></div>
            <div className="flex items-center gap-1.5 text-orange-500">
                <Square className="w-3 h-3" />
                <span>{incompleteTasks} Tasks</span>
            </div>
         </>
       )}
    </div>
  );
};