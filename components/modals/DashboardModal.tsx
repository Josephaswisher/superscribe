import React, { useMemo, useContext } from 'react';
import { X, LayoutDashboard, TrendingUp, TrendingDown, Circle } from 'lucide-react';
import { DashboardPatient } from '../../types';
import { parseForDashboard } from '../../utils/documentUtils';
import { ThemeContext } from '../../contexts/ThemeContext';
import { DocumentContext } from '../../contexts/DocumentContext';

interface DashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  content: string; // Deprecated prop in favor of global context access
}

const AcuityPill: React.FC<{ acuity: DashboardPatient['acuity'] }> = ({ acuity }) => {
    const { isDarkMode } = useContext(ThemeContext);
    const config = {
        High: 'bg-red-500/20 text-red-400 border-red-500/30',
        Medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
        Low: 'bg-green-500/20 text-green-400 border-green-500/30',
    };
    const TrendIcon = acuity === 'High' ? TrendingUp : acuity === 'Medium' ? Circle : TrendingDown;
    return (
        <span className={`flex items-center gap-1.5 text-xs font-bold px-2 py-1 rounded-full border ${config[acuity]}`}>
           <TrendIcon className="w-3 h-3" /> {acuity}
        </span>
    );
};


export const DashboardModal: React.FC<DashboardModalProps> = ({ isOpen, onClose }) => {
  const { isDarkMode } = useContext(ThemeContext);
  const { documents, switchDocument } = useContext(DocumentContext);

  const dashboardData = useMemo(() => {
      let allPatients: (DashboardPatient & { docId: string, docName: string })[] = [];
      
      documents.forEach(doc => {
          const patients = parseForDashboard(doc.content);
          const tagged = patients.map(p => ({
              ...p,
              docId: doc.id,
              docName: doc.name
          }));
          allPatients = [...allPatients, ...tagged];
      });
      return allPatients;
  }, [documents]);
  
  if (!isOpen) return null;
  
  const handleRowClick = (docId: string, patientId: number) => {
      switchDocument(docId);
      // We need to wait for state update to scroll, but since switchDocument is sync in React state terms but render is async:
      setTimeout(() => {
          const element = document.getElementById(`patient-${patientId}`);
          if (element) {
              element.scrollIntoView({ behavior: 'smooth', block: 'start' });
              element.classList.add('ring-2', 'ring-offset-2', 'ring-offset-gray-900', 'ring-accent-primary', 'transition-all', 'duration-1000');
              setTimeout(() => {
                element.classList.remove('ring-2', 'ring-offset-2', 'ring-offset-gray-900', 'ring-accent-primary', 'transition-all', 'duration-1000');
              }, 1500);
          }
      }, 100);
      onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className={`w-full max-w-7xl rounded-xl shadow-2xl flex flex-col h-[90vh] overflow-hidden ${isDarkMode ? 'bg-[#18181b] border border-gray-700' : 'bg-white'}`}>
         <div className="flex items-center justify-between p-4 border-b border-gray-700/50 shrink-0">
            <div className="flex items-center gap-3">
               <LayoutDashboard className="w-5 h-5 text-[#d97757]" />
               <h3 className={`font-bold text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Global Patient Dashboard</h3>
            </div>
            <button onClick={onClose} className="p-1 hover:bg-gray-700/50 rounded text-gray-400">
                <X className="w-5 h-5" />
            </button>
         </div>

         <div className="flex-1 overflow-y-auto custom-scrollbar">
            <table className="w-full text-sm text-left">
                <thead className={`sticky top-0 z-10 ${isDarkMode ? 'bg-[#18181b]' : 'bg-gray-50'}`}>
                    <tr>
                        <th className="p-3 font-semibold text-xs uppercase tracking-wider text-gray-500">List / Sheet</th>
                        <th className="p-3 font-semibold text-xs uppercase tracking-wider text-gray-500">Patient</th>
                        <th className="p-3 font-semibold text-xs uppercase tracking-wider text-gray-500">Acuity</th>
                        <th className="p-3 font-semibold text-xs uppercase tracking-wider text-gray-500">Vitals</th>
                        <th className="p-3 font-semibold text-xs uppercase tracking-wider text-gray-500">Critical Labs</th>
                        <th className="p-3 font-semibold text-xs uppercase tracking-wider text-gray-500">Active Problems</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                    {dashboardData.map((p, idx) => (
                        <tr 
                            key={`${p.docId}-${p.id}-${idx}`} 
                            onClick={() => handleRowClick(p.docId, p.id)}
                            className="cursor-pointer transition-colors hover:bg-white/5"
                        >
                            <td className="p-3 text-xs text-gray-500 font-medium">
                                {p.docName}
                            </td>
                            <td className="p-3 font-bold text-gray-200">
                                {p.name}
                                {p.room && <span className="block text-xs text-gray-500 font-mono">{p.room}</span>}
                            </td>
                            <td className="p-3">
                                <AcuityPill acuity={p.acuity} />
                            </td>
                            <td className="p-3 text-gray-400 font-mono text-xs">{p.vitals}</td>
                            <td className="p-3">
                                {p.criticalLabs.length > 0 ? (
                                    <div className="flex flex-wrap gap-1">
                                        {p.criticalLabs.map((lab, i) => (
                                            <span key={i} className="text-[10px] font-bold text-red-400 bg-red-500/10 border border-red-500/20 px-1.5 py-0.5 rounded">
                                                {lab}
                                            </span>
                                        ))}
                                    </div>
                                ) : (
                                    <span className="text-xs text-gray-600">None</span>
                                )}
                            </td>
                             <td className="p-3">
                                {p.activeProblems.length > 0 ? (
                                    <div className="flex flex-col gap-1">
                                        {p.activeProblems.map((prob, i) => (
                                            <span key={i} className="text-xs text-blue-300 font-medium">#{prob}</span>
                                        ))}
                                    </div>
                                ) : (
                                    <span className="text-xs text-gray-600">None</span>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {dashboardData.length === 0 && (
                <div className="text-center py-20 text-gray-600">No patient data found across any sheets.</div>
            )}
         </div>

         <div className="p-3 border-t border-gray-700/50 flex justify-between items-center bg-black/20 text-xs text-gray-500 shrink-0">
             <span>{dashboardData.length} total patients across {documents.length} sheets.</span>
             <span>Click a row to open that sheet.</span>
         </div>
      </div>
    </div>
  );
};