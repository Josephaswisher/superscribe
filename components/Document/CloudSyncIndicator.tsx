import React, { useContext } from 'react';
import { Cloud, CloudOff, RefreshCw, Check, AlertTriangle } from 'lucide-react';
import { ThemeContext } from '../../contexts/ThemeContext';
import { DocumentContext } from '../../contexts/DocumentContext';

export const CloudSyncIndicator: React.FC = () => {
  const { isDarkMode } = useContext(ThemeContext);
  const { isCloudEnabled, isSyncing, lastSyncTime, syncError, syncToCloud, fetchFromCloud } =
    useContext(DocumentContext);

  if (!isCloudEnabled) {
    return (
      <div
        className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`}
        title="Cloud sync not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to enable."
      >
        <CloudOff className="w-3.5 h-3.5" />
        <span className="hidden xl:inline">Local Only</span>
      </div>
    );
  }

  if (isSyncing) {
    return (
      <div
        className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs ${isDarkMode ? 'text-blue-400' : 'text-blue-500'}`}
      >
        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
        <span className="hidden xl:inline">Syncing...</span>
      </div>
    );
  }

  if (syncError) {
    return (
      <button
        onClick={() => syncToCloud()}
        className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs ${isDarkMode ? 'text-red-400 hover:bg-red-900/30' : 'text-red-500 hover:bg-red-50'}`}
        title={`Sync error: ${syncError}. Click to retry.`}
      >
        <AlertTriangle className="w-3.5 h-3.5" />
        <span className="hidden xl:inline">Sync Failed</span>
      </button>
    );
  }

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => syncToCloud()}
        className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-colors ${isDarkMode ? 'text-green-400 hover:bg-green-900/30' : 'text-green-600 hover:bg-green-50'}`}
        title={lastSyncTime ? `Last synced: ${formatTime(lastSyncTime)}. Click to sync now.` : 'Click to sync now'}
      >
        <Cloud className="w-3.5 h-3.5" />
        {lastSyncTime && <Check className="w-2.5 h-2.5" />}
        <span className="hidden xl:inline">
          {lastSyncTime ? formatTime(lastSyncTime) : 'Cloud'}
        </span>
      </button>
      <button
        onClick={() => fetchFromCloud()}
        className={`p-1 rounded transition-colors ${isDarkMode ? 'text-gray-500 hover:text-gray-300 hover:bg-white/10' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
        title="Fetch latest from cloud"
      >
        <RefreshCw className="w-3 h-3" />
      </button>
    </div>
  );
};
