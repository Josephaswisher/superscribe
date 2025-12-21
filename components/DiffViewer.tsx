import { useMemo, useState, useRef, useEffect } from 'react';
import * as Diff from 'diff';
import { Check, X, FileDiff, Columns, AlignJustify, Activity } from 'lucide-react';

interface DiffViewerProps {
  oldText: string;
  newText: string;
  onAccept: () => void;
  onReject: () => void;
  isDarkMode: boolean;
}

export const DiffViewer: React.FC<DiffViewerProps> = ({
  oldText,
  newText,
  onAccept,
  onReject,
  isDarkMode,
}) => {
  const [viewMode, setViewMode] = useState<'unified' | 'split'>('split');

  const diff = useMemo(() => {
    return Diff.diffWordsWithSpace(oldText, newText);
  }, [oldText, newText]);

  // Calculate stats
  const stats = useMemo(() => {
    let additions = 0;
    let deletions = 0;
    diff.forEach(part => {
      if (part.added) additions += part.value.length;
      if (part.removed) deletions += part.value.length;
    });
    return { additions, deletions };
  }, [diff]);

  // Mini-Map Calculation
  const miniMapRef = useRef<HTMLDivElement>(null);
  const [mapPoints, setMapPoints] = useState<
    { type: 'add' | 'del'; top: number; height: number }[]
  >([]);

  useEffect(() => {
    // Approximate map points based on character count ratios
    // This is a rough visualization, not exact line mapping
    const totalChars = oldText.length + stats.additions;
    if (totalChars === 0) return;

    let currentCharCursor = 0;
    const points: { type: 'add' | 'del'; top: number; height: number }[] = [];

    diff.forEach(part => {
      const length = part.value.length;
      const percentStart = (currentCharCursor / totalChars) * 100;
      const percentHeight = Math.max((length / totalChars) * 100, 1); // Min 1% height visibility

      if (part.added) {
        points.push({ type: 'add', top: percentStart, height: percentHeight });
        currentCharCursor += length;
      } else if (part.removed) {
        points.push({ type: 'del', top: percentStart, height: percentHeight });
        // Removed text doesn't advance cursor in the "New" document representation usually,
        // but for a unified linear map, we treat it as occupying space.
        currentCharCursor += length;
      } else {
        currentCharCursor += length;
      }
    });
    setMapPoints(points);
  }, [diff, oldText.length, stats.additions]);

  return (
    <div
      className={`flex flex-col h-full rounded-xl overflow-hidden border shadow-2xl animate-in fade-in zoom-in-95 duration-200 relative ${isDarkMode ? 'bg-[#151515] border-gray-700' : 'bg-white border-gray-300'}`}
    >
      {/* Header */}
      <div
        className={`px-6 py-4 border-b flex items-center justify-between shrink-0 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}
      >
        <div className="flex items-center gap-4">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-[#d97757]/20 text-[#d97757]' : 'bg-orange-100 text-[#d97757]'}`}
          >
            <FileDiff className="w-5 h-5" />
          </div>
          <div>
            <h3 className={`font-bold text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Review Changes
            </h3>
            <div className="flex items-center gap-3 text-xs font-mono mt-0.5">
              <span className="text-green-500 font-bold flex items-center gap-1">
                <Activity className="w-3 h-3" /> +{stats.additions} chars
              </span>
              <span className="text-gray-500">|</span>
              <span className="text-red-500 font-bold flex items-center gap-1">
                <Activity className="w-3 h-3" /> -{stats.deletions} chars
              </span>
            </div>
          </div>
        </div>

        {/* View Toggles */}
        <div
          className={`flex p-1 rounded-lg border ${isDarkMode ? 'bg-black/20 border-white/10' : 'bg-gray-200 border-gray-300'}`}
        >
          <button
            onClick={() => setViewMode('unified')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
              viewMode === 'unified'
                ? isDarkMode
                  ? 'bg-gray-700 text-white shadow'
                  : 'bg-white text-black shadow'
                : 'text-gray-500 hover:text-gray-400'
            }`}
          >
            <AlignJustify className="w-4 h-4" /> Unified
          </button>
          <button
            onClick={() => setViewMode('split')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
              viewMode === 'split'
                ? isDarkMode
                  ? 'bg-gray-700 text-white shadow'
                  : 'bg-white text-black shadow'
                : 'text-gray-500 hover:text-gray-400'
            }`}
          >
            <Columns className="w-4 h-4" /> Split
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Main Diff Scroller */}
        <div
          className={`flex-1 overflow-y-auto custom-scrollbar ${viewMode === 'split' ? 'flex' : ''}`}
        >
          {viewMode === 'unified' ? (
            // --- UNIFIED VIEW ---
            <div
              className={`p-8 font-serif text-base leading-relaxed whitespace-pre-wrap ${isDarkMode ? 'text-gray-300' : 'text-gray-800'}`}
            >
              {diff.map((part, index) => {
                if (part.removed) {
                  return (
                    <span
                      key={index}
                      className={`${isDarkMode ? 'bg-red-900/40 text-red-300 decoration-red-400/50' : 'bg-red-100 text-red-700 decoration-red-400/30'} line-through decoration-2 mx-0.5 px-0.5 rounded`}
                    >
                      {part.value}
                    </span>
                  );
                }
                if (part.added) {
                  return (
                    <span
                      key={index}
                      className={`${isDarkMode ? 'bg-green-900/40 text-green-300 border-b-2 border-green-500/50' : 'bg-green-100 text-green-800 border-b-2 border-green-500/30'} font-bold mx-0.5 px-0.5 rounded`}
                    >
                      {part.value}
                    </span>
                  );
                }
                return <span key={index}>{part.value}</span>;
              })}
            </div>
          ) : (
            // --- SPLIT VIEW ---
            <>
              {/* Left Pane: Original (Deletions Highlighted) */}
              <div
                className={`flex-1 p-6 border-r overflow-y-auto custom-scrollbar ${isDarkMode ? 'border-gray-700 bg-black/10' : 'border-gray-200 bg-gray-50/50'}`}
              >
                <div className="text-xs font-bold uppercase tracking-wider mb-4 text-gray-500 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-500"></div> Original
                </div>
                <div
                  className={`font-serif text-sm leading-relaxed whitespace-pre-wrap ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
                >
                  {diff.map((part, index) => {
                    if (part.added) return null; // Hide additions in left pane
                    if (part.removed) {
                      return (
                        <span
                          key={index}
                          className={`${isDarkMode ? 'bg-red-900/30 text-red-300' : 'bg-red-100 text-red-700'} px-0.5 rounded`}
                        >
                          {part.value}
                        </span>
                      );
                    }
                    return <span key={index}>{part.value}</span>;
                  })}
                </div>
              </div>

              {/* Right Pane: New (Additions Highlighted) */}
              <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
                <div className="text-xs font-bold uppercase tracking-wider mb-4 text-gray-500 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div> Proposed Update
                </div>
                <div
                  className={`font-serif text-base leading-relaxed whitespace-pre-wrap ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}
                >
                  {diff.map((part, index) => {
                    if (part.removed) return null; // Hide removals in right pane
                    if (part.added) {
                      return (
                        <span
                          key={index}
                          className={`${isDarkMode ? 'bg-green-900/30 text-green-300' : 'bg-green-100 text-green-800'} font-bold px-0.5 rounded`}
                        >
                          {part.value}
                        </span>
                      );
                    }
                    return <span key={index}>{part.value}</span>;
                  })}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Mini-Map (Visual Scrollbar) */}
        <div
          className={`w-3 border-l shrink-0 relative ${isDarkMode ? 'bg-[#111] border-gray-800' : 'bg-gray-100 border-gray-200'}`}
          ref={miniMapRef}
        >
          {mapPoints.map((pt, i) => (
            <div
              key={i}
              className={`absolute left-0 w-full ${pt.type === 'add' ? 'bg-green-500' : 'bg-red-500'}`}
              style={{ top: `${pt.top}%`, height: `${pt.height}%`, minHeight: '2px', opacity: 0.6 }}
            />
          ))}
        </div>
      </div>

      {/* Footer Actions */}
      <div
        className={`p-4 border-t flex justify-end gap-3 shrink-0 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}
      >
        <button
          onClick={onReject}
          className={`px-5 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-colors ${isDarkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'}`}
        >
          <X className="w-4 h-4" />
          Reject
        </button>
        <button
          onClick={onAccept}
          className="px-5 py-2.5 rounded-lg font-bold text-white bg-[#d97757] hover:bg-[#c66a4d] flex items-center gap-2 shadow-lg shadow-orange-900/20 transition-transform active:scale-95"
        >
          <Check className="w-4 h-4" />
          Accept Changes
        </button>
      </div>
    </div>
  );
};
