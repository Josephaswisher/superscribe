import React, { useContext } from 'react';
import { DocumentVersion } from '../../types';
import { Clock, RotateCcw, X, History } from 'lucide-react';
import { ThemeContext } from '../../contexts/ThemeContext';

interface HistorySidebarProps {
  history: DocumentVersion[];
  currentVersionId: string;
  onRestore: (id: string) => void;
  onClose: () => void;
  isOpen: boolean;
}

export const HistorySidebar: React.FC<HistorySidebarProps> = ({ 
  history, 
  currentVersionId, 
  onRestore, 
  onClose, 
  isOpen, 
}) => {
  const { isDarkMode } = useContext(ThemeContext);
  if (!isOpen) return null;

  return (
    <div className={`absolute top-0 right-0 h-full w-[320px] shadow-2xl z-40 flex flex-col border-l transform transition-transform duration-300 animate-in slide-in-from-right
        ${isDarkMode ? 'bg-[#18181b] border-gray-700' : 'bg-white border-gray-200'}
    `}>
      {/* Header */}
      <div className={`p-4 border-b flex items-center justify-between shrink-0 ${isDarkMode ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50'}`}>
         <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-[#d97757]" />
            <h3 className={`font-bold text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Version History</h3>
         </div>
         <button onClick={onClose} className={`p-1.5 rounded-md ${isDarkMode ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-gray-200 text-gray-500'}`}>
            <X className="w-4 h-4" />
         </button>
      </div>

      {/* Timeline List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
          <div className="relative border-l-2 ml-3.5 space-y-6 border-gray-700/30">
              {/* Reversed History to show newest first */}
              {[...history].reverse().map((version) => {
                  const isActive = version.id === currentVersionId;
                  const date = version.timestamp;
                  
                  return (
                      <div key={version.id} className="relative pl-6 group">
                          {/* Dot on Timeline */}
                          <div className={`absolute -left-[9px] top-1.5 w-4 h-4 rounded-full border-2 flex items-center justify-center bg-[#18181b]
                              ${isActive 
                                ? 'border-[#d97757] text-[#d97757]' 
                                : 'border-gray-600 text-gray-600 group-hover:border-gray-400'}
                          `}>
                              {isActive && <div className="w-1.5 h-1.5 rounded-full bg-[#d97757]"></div>}
                          </div>

                          <div className={`rounded-lg border p-3 transition-all cursor-pointer
                              ${isActive 
                                ? (isDarkMode ? 'bg-[#d97757]/10 border-[#d97757]/50' : 'bg-orange-50 border-orange-200') 
                                : (isDarkMode ? 'bg-gray-800/50 border-gray-700 hover:bg-gray-800' : 'bg-white border-gray-200 hover:border-gray-300 shadow-sm')}
                          `}
                          onClick={() => onRestore(version.id)}
                          >
                              <div className="flex justify-between items-start mb-1">
                                  <span className={`text-sm font-bold ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                                      {version.label}
                                  </span>
                                  {isActive && (
                                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#d97757] text-white">
                                          Active
                                      </span>
                                  )}
                              </div>
                              
                              <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-2">
                                  <Clock className="w-3 h-3" />
                                  <span>{date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                  <span>•</span>
                                  <span>{date.toLocaleDateString()}</span>
                              </div>

                              {!isActive && (
                                  <button 
                                    className={`w-full py-1.5 text-xs font-medium rounded flex items-center justify-center gap-2 transition-colors
                                        ${isDarkMode ? 'bg-white/5 hover:bg-white/10 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}
                                    `}
                                  >
                                      <RotateCcw className="w-3 h-3" /> Restore Version
                                  </button>
                              )}
                          </div>
                      </div>
                  );
              })}
          </div>
      </div>
      
      {/* Footer Stats */}
      <div className={`p-3 text-[10px] text-center border-t ${isDarkMode ? 'border-gray-800 text-gray-500' : 'border-gray-200 text-gray-400'}`}>
          {history.length} versions saved locally
      </div>
    </div>
  );
};