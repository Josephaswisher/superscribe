import React, { useContext, useState, useMemo } from 'react';
import { X, Save, Copy, Check, ArrowLeftRight, Eye, Code } from 'lucide-react';
import { ThemeContext } from '../../contexts/ThemeContext';
import { DocumentContext } from '../../contexts/DocumentContext';

interface OriginalSignoutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OriginalSignoutModal: React.FC<OriginalSignoutModalProps> = ({ isOpen, onClose }) => {
  const { isDarkMode } = useContext(ThemeContext);
  const { currentContent, originalSignout, saveOriginalSignout } = useContext(DocumentContext);

  const [viewMode, setViewMode] = useState<'side-by-side' | 'original' | 'diff'>('side-by-side');
  const [copied, setCopied] = useState<'original' | 'current' | null>(null);

  // Calculate simple diff statistics
  const diffStats = useMemo(() => {
    if (!originalSignout) return null;

    const originalLines = originalSignout.split('\n').length;
    const currentLines = currentContent.split('\n').length;
    const originalChars = originalSignout.length;
    const currentChars = currentContent.length;

    return {
      originalLines,
      currentLines,
      lineDiff: currentLines - originalLines,
      originalChars,
      currentChars,
      charDiff: currentChars - originalChars,
    };
  }, [originalSignout, currentContent]);

  if (!isOpen) return null;

  const handleCopy = (type: 'original' | 'current') => {
    const text = type === 'original' ? originalSignout : currentContent;
    if (text) {
      navigator.clipboard.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    }
  };

  const handleSaveAsOriginal = () => {
    saveOriginalSignout(currentContent);
  };

  const baseClass = isDarkMode ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-900';
  const borderClass = isDarkMode ? 'border-gray-700' : 'border-gray-200';
  const textAreaClass = isDarkMode
    ? 'bg-gray-800 text-gray-200 border-gray-700'
    : 'bg-gray-50 text-gray-800 border-gray-200';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div
        className={`w-full max-w-6xl max-h-[90vh] overflow-hidden rounded-xl shadow-2xl ${baseClass} border ${borderClass}`}
      >
        {/* Header */}
        <div className={`flex items-center justify-between px-6 py-4 border-b ${borderClass}`}>
          <div className="flex items-center gap-3">
            <ArrowLeftRight className="w-6 h-6 text-blue-500" />
            <h2 className="text-xl font-bold">Original Signout Comparison</h2>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-2">
            <div className={`flex rounded-lg p-1 ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
              <button
                onClick={() => setViewMode('side-by-side')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'side-by-side'
                    ? 'bg-blue-500 text-white'
                    : isDarkMode
                      ? 'text-gray-400 hover:text-white'
                      : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                <ArrowLeftRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('original')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'original'
                    ? 'bg-blue-500 text-white'
                    : isDarkMode
                      ? 'text-gray-400 hover:text-white'
                      : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                <Eye className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('diff')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'diff'
                    ? 'bg-blue-500 text-white'
                    : isDarkMode
                      ? 'text-gray-400 hover:text-white'
                      : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                <Code className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Diff Stats */}
        {diffStats && (
          <div className={`px-6 py-3 border-b ${borderClass} flex items-center gap-6 text-sm`}>
            <div className="flex items-center gap-2">
              <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>Lines:</span>
              <span className="font-mono">{diffStats.originalLines}</span>
              <span className="text-gray-500">→</span>
              <span className="font-mono">{diffStats.currentLines}</span>
              <span
                className={`font-mono text-xs px-1.5 py-0.5 rounded ${
                  diffStats.lineDiff > 0
                    ? 'bg-green-500/20 text-green-500'
                    : diffStats.lineDiff < 0
                      ? 'bg-red-500/20 text-red-500'
                      : 'bg-gray-500/20 text-gray-500'
                }`}
              >
                {diffStats.lineDiff > 0 ? '+' : ''}
                {diffStats.lineDiff}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>Characters:</span>
              <span className="font-mono">{diffStats.originalChars}</span>
              <span className="text-gray-500">→</span>
              <span className="font-mono">{diffStats.currentChars}</span>
              <span
                className={`font-mono text-xs px-1.5 py-0.5 rounded ${
                  diffStats.charDiff > 0
                    ? 'bg-green-500/20 text-green-500'
                    : diffStats.charDiff < 0
                      ? 'bg-red-500/20 text-red-500'
                      : 'bg-gray-500/20 text-gray-500'
                }`}
              >
                {diffStats.charDiff > 0 ? '+' : ''}
                {diffStats.charDiff}
              </span>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-auto max-h-[calc(90vh-200px)]">
          {!originalSignout ? (
            <div className="flex flex-col items-center justify-center h-64 text-center p-8">
              <Save className="w-16 h-16 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium mb-2">No Original Signout Saved</h3>
              <p className={`text-sm mb-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Save the current document as the original signout to compare future changes.
              </p>
              <button
                onClick={handleSaveAsOriginal}
                className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
              >
                <Save className="w-4 h-4 inline mr-2" />
                Save Current as Original
              </button>
            </div>
          ) : viewMode === 'side-by-side' ? (
            <div className="grid grid-cols-2 gap-0 h-full">
              {/* Original */}
              <div className={`border-r ${borderClass}`}>
                <div
                  className={`sticky top-0 px-4 py-2 border-b ${borderClass} ${isDarkMode ? 'bg-amber-900/30' : 'bg-amber-50'} flex items-center justify-between`}
                >
                  <span className="font-semibold text-amber-600">Original Signout</span>
                  <button
                    onClick={() => handleCopy('original')}
                    className="p-1.5 rounded hover:bg-amber-200/30"
                  >
                    {copied === 'original' ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4 text-amber-600" />
                    )}
                  </button>
                </div>
                <pre
                  className={`p-4 text-sm font-mono whitespace-pre-wrap overflow-auto ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
                  style={{ maxHeight: 'calc(90vh - 280px)' }}
                >
                  {originalSignout}
                </pre>
              </div>

              {/* Current */}
              <div>
                <div
                  className={`sticky top-0 px-4 py-2 border-b ${borderClass} ${isDarkMode ? 'bg-green-900/30' : 'bg-green-50'} flex items-center justify-between`}
                >
                  <span className="font-semibold text-green-600">Current Document</span>
                  <button
                    onClick={() => handleCopy('current')}
                    className="p-1.5 rounded hover:bg-green-200/30"
                  >
                    {copied === 'current' ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4 text-green-600" />
                    )}
                  </button>
                </div>
                <pre
                  className={`p-4 text-sm font-mono whitespace-pre-wrap overflow-auto ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
                  style={{ maxHeight: 'calc(90vh - 280px)' }}
                >
                  {currentContent}
                </pre>
              </div>
            </div>
          ) : viewMode === 'original' ? (
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-lg">Original Signout</h3>
                <button
                  onClick={() => handleCopy('original')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}
                >
                  {copied === 'original' ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                  Copy
                </button>
              </div>
              <pre
                className={`p-4 rounded-lg text-sm font-mono whitespace-pre-wrap overflow-auto border ${textAreaClass}`}
                style={{ maxHeight: 'calc(90vh - 300px)' }}
              >
                {originalSignout}
              </pre>
            </div>
          ) : (
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-lg">Changes Summary</h3>
              </div>
              <div
                className={`p-4 rounded-lg text-sm font-mono whitespace-pre-wrap overflow-auto border ${textAreaClass}`}
                style={{ maxHeight: 'calc(90vh - 300px)' }}
              >
                {/* Simple diff view - highlight changes */}
                {originalSignout.split('\n').map((line, i) => {
                  const currentLine = currentContent.split('\n')[i] || '';
                  const isDifferent = line !== currentLine;

                  return (
                    <div
                      key={i}
                      className={`py-0.5 px-2 -mx-2 ${
                        isDifferent ? (isDarkMode ? 'bg-yellow-900/30' : 'bg-yellow-100') : ''
                      }`}
                    >
                      <span className="text-gray-500 mr-3 select-none">{i + 1}</span>
                      {line || ' '}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {originalSignout && (
          <div className={`px-6 py-4 border-t ${borderClass} flex justify-between items-center`}>
            <button
              onClick={handleSaveAsOriginal}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                isDarkMode
                  ? 'bg-gray-700 hover:bg-gray-600 text-gray-200'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              <Save className="w-4 h-4 inline mr-2" />
              Update Original Signout
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
