import React, { useState, useEffect, useContext, useRef } from 'react';
import { FileOutput, RefreshCw, Copy, Check } from 'lucide-react';
import { generateHandoff } from '../../../services/aiService';
import { DataViewWrapper } from './DataViewWrapper';
import { ThemeContext } from '../../../contexts/ThemeContext';

interface HandoffViewProps {
  content: string;
}

export const HandoffView: React.FC<HandoffViewProps> = ({ content }) => {
  const { isDarkMode } = useContext(ThemeContext);
  const [handoffContent, setHandoffContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const hasGenerated = useRef(false);

  const generate = async () => {
    if (!content.trim()) {
      setError('No patient content to generate handoff from.');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const result = await generateHandoff(content);
      setHandoffContent(result);
      hasGenerated.current = true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate handoff');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!hasGenerated.current && content.trim()) {
      generate();
    }
  }, [content]);

  const handleCopy = () => {
    navigator.clipboard.writeText(handoffContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <DataViewWrapper title="Handoff View" icon={FileOutput}>
      <div className="flex items-center justify-between mb-3">
        <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
          AI-generated sign-out for night coverage
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={generate}
            disabled={isLoading}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              isLoading
                ? 'opacity-50 cursor-wait'
                : isDarkMode
                  ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Generating...' : 'Regenerate'}
          </button>
          {handoffContent && (
            <button
              onClick={handleCopy}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                isDarkMode
                  ? 'bg-[#d97757] text-white hover:bg-[#c66a4d]'
                  : 'bg-[#d97757] text-white hover:bg-[#c66a4d]'
              }`}
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
          )}
        </div>
      </div>

      {error ? (
        <div
          className={`p-4 rounded-lg text-sm ${isDarkMode ? 'bg-red-900/30 text-red-300' : 'bg-red-100 text-red-700'}`}
        >
          {error}
        </div>
      ) : isLoading && !handoffContent ? (
        <div className={`p-8 rounded-lg text-center ${isDarkMode ? 'bg-gray-950' : 'bg-gray-100'}`}>
          <RefreshCw
            className={`w-8 h-8 mx-auto mb-3 animate-spin ${isDarkMode ? 'text-[#d97757]' : 'text-[#d97757]'}`}
          />
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Generating SBAR handoff...
          </p>
        </div>
      ) : (
        <pre
          className={`p-4 rounded-lg whitespace-pre-wrap text-sm ${isDarkMode ? 'bg-gray-950 text-gray-300' : 'bg-gray-100 text-gray-800'}`}
        >
          {handoffContent || 'Click "Regenerate" to create a handoff document.'}
        </pre>
      )}
    </DataViewWrapper>
  );
};
