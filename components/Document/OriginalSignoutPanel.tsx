import React, { useContext, useState } from 'react';
import { X, Copy, Check, FileText, ArrowLeftRight } from 'lucide-react';
import { ThemeContext } from '../../contexts/ThemeContext';
import { DocumentContext } from '../../contexts/DocumentContext';

interface OriginalSignoutPanelProps {
  onClose: () => void;
}

export const OriginalSignoutPanel: React.FC<OriginalSignoutPanelProps> = ({ onClose }) => {
  const { isDarkMode } = useContext(ThemeContext);
  const { originalSignout, currentContent } = useContext(DocumentContext);
  const [justCopied, setJustCopied] = useState(false);
  const [showComparison, setShowComparison] = useState(false);

  const handleCopy = () => {
    if (originalSignout) {
      navigator.clipboard.writeText(originalSignout);
      setJustCopied(true);
      setTimeout(() => setJustCopied(false), 2000);
    }
  };

  if (!originalSignout) {
    return (
      <div
        className={`fixed inset-y-0 right-0 w-[480px] z-50 shadow-2xl border-l flex flex-col ${isDarkMode ? 'bg-[#1a1a1a] border-gray-800' : 'bg-white border-gray-200'}`}
      >
        <div
          className={`h-12 flex items-center justify-between px-4 border-b ${isDarkMode ? 'border-gray-800' : 'border-gray-200'}`}
        >
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#d97757]" />
            <span className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Original Signout
            </span>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-md ${isDarkMode ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center">
            <FileText
              className={`w-12 h-12 mx-auto mb-4 ${isDarkMode ? 'text-gray-600' : 'text-gray-300'}`}
            />
            <h3
              className={`text-lg font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
            >
              No Original Signout Saved
            </h3>
            <p className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              When you paste a new patient list, the original content will be saved here for
              reference.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`fixed inset-y-0 right-0 w-[600px] z-50 shadow-2xl border-l flex flex-col ${isDarkMode ? 'bg-[#1a1a1a] border-gray-800' : 'bg-white border-gray-200'}`}
    >
      {/* Header */}
      <div
        className={`h-12 flex items-center justify-between px-4 border-b shrink-0 ${isDarkMode ? 'border-gray-800' : 'border-gray-200'}`}
      >
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-[#d97757]" />
          <span className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Original Signout
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowComparison(!showComparison)}
            className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium transition-colors ${
              showComparison
                ? isDarkMode
                  ? 'bg-[#d97757]/20 text-[#d97757]'
                  : 'bg-orange-100 text-[#d97757]'
                : isDarkMode
                  ? 'hover:bg-white/10 text-gray-400'
                  : 'hover:bg-gray-100 text-gray-500'
            }`}
          >
            <ArrowLeftRight className="w-3 h-3" />
            Compare
          </button>
          <button
            onClick={handleCopy}
            className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium ${isDarkMode ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
          >
            {justCopied ? (
              <Check className="w-3 h-3 text-green-500" />
            ) : (
              <Copy className="w-3 h-3" />
            )}
            {justCopied ? 'Copied!' : 'Copy'}
          </button>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-md ${isDarkMode ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden flex">
        {showComparison ? (
          <>
            {/* Side by side comparison */}
            <div className="flex-1 flex flex-col border-r border-gray-200 dark:border-gray-700">
              <div
                className={`px-3 py-2 text-xs font-bold uppercase tracking-wider border-b ${isDarkMode ? 'bg-gray-900 border-gray-800 text-gray-400' : 'bg-gray-50 border-gray-200 text-gray-500'}`}
              >
                Original
              </div>
              <div className="flex-1 overflow-auto p-4">
                <pre
                  className={`text-xs font-mono whitespace-pre-wrap leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
                >
                  {originalSignout}
                </pre>
              </div>
            </div>
            <div className="flex-1 flex flex-col">
              <div
                className={`px-3 py-2 text-xs font-bold uppercase tracking-wider border-b ${isDarkMode ? 'bg-gray-900 border-gray-800 text-gray-400' : 'bg-gray-50 border-gray-200 text-gray-500'}`}
              >
                Current
              </div>
              <div className="flex-1 overflow-auto p-4">
                <pre
                  className={`text-xs font-mono whitespace-pre-wrap leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
                >
                  {currentContent}
                </pre>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 overflow-auto p-6">
            <div
              className={`mb-4 p-3 rounded-lg ${isDarkMode ? 'bg-amber-900/20 border border-amber-800/50' : 'bg-amber-50 border border-amber-200'}`}
            >
              <p className={`text-xs ${isDarkMode ? 'text-amber-300' : 'text-amber-700'}`}>
                This is the original content that was pasted when this document was created. It's
                preserved for reference and comparison.
              </p>
            </div>
            <pre
              className={`text-sm font-mono whitespace-pre-wrap leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
            >
              {originalSignout}
            </pre>
          </div>
        )}
      </div>

      {/* Footer Stats */}
      <div
        className={`h-10 flex items-center justify-between px-4 border-t text-xs ${isDarkMode ? 'border-gray-800 text-gray-500' : 'border-gray-200 text-gray-400'}`}
      >
        <span>
          {originalSignout.split('\n').length} lines • {originalSignout.length.toLocaleString()}{' '}
          chars
        </span>
        <span>
          Current: {currentContent.split('\n').length} lines •{' '}
          {currentContent.length.toLocaleString()} chars
        </span>
      </div>
    </div>
  );
};
