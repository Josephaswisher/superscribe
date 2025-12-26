import React from 'react';
import { Message, Role } from '../../types';
import { Bot, User, Sparkles } from 'lucide-react';

interface MessageBubbleProps {
  msg: Message;
  explanation?: string;
  isStreaming?: boolean;
}

// Check if text looks like raw JSON/streaming garbage
const isRawStreamingText = (text: string): boolean => {
  if (!text || text.length < 5) return true;
  if (text.startsWith('{') && !text.endsWith('}')) return true;
  if (text.includes('"conversationalResponse"') && !text.includes('updatedDocument')) return true;
  if (text.trim().startsWith('{') && text.includes('"')) return true;
  return false;
};

// Extract clean response from potentially raw text
const extractCleanResponse = (text: string): string => {
  if (!text) return '';
  try {
    const cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    if (cleaned.startsWith('{')) {
      const parsed = JSON.parse(cleaned);
      return parsed.conversationalResponse || parsed.text || text;
    }
  } catch {
    // Not valid JSON
  }
  if (!text.includes('"conversationalResponse"') && !text.startsWith('{')) {
    return text;
  }
  return '';
};

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  msg,
  explanation,
  isStreaming = false,
}) => {
  const isUser = msg.role === Role.USER;
  const showStreamingIndicator = !isUser && isStreaming && isRawStreamingText(msg.text);
  const displayText = isUser ? msg.text : extractCleanResponse(msg.text) || msg.text;

  if (!isUser && !displayText && !isStreaming) return null;

  return (
    <div className={`flex gap-2 mb-2 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Compact avatar */}
      <div
        className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 ${
          isUser ? 'bg-gray-700' : 'bg-[#d97757]'
        }`}
      >
        {isUser ? <User className="w-3 h-3 text-gray-300" /> : <Bot className="w-3 h-3 text-white" />}
      </div>

      <div className={`flex flex-col max-w-[85%] ${isUser ? 'items-end' : 'items-start'}`}>
        {/* Streaming indicator - minimal */}
        {showStreamingIndicator ? (
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[#d97757]/10 border border-[#d97757]/20">
            <Sparkles className="w-3 h-3 text-[#d97757] animate-pulse" />
            <span className="text-[10px] text-[#d97757] font-medium">Generating...</span>
            <div className="flex gap-0.5">
              {[0, 1, 2].map(i => (
                <div
                  key={i}
                  className="w-1 h-1 rounded-full bg-[#d97757] animate-pulse"
                  style={{ animationDelay: `${i * 100}ms` }}
                />
              ))}
            </div>
          </div>
        ) : (
          <div
            className={`text-xs leading-relaxed whitespace-pre-wrap px-2.5 py-1.5 rounded-lg ${
              isUser
                ? 'text-gray-200 bg-gray-700/80'
                : 'text-gray-300 bg-[#232326]'
            }`}
          >
            {displayText}
          </div>
        )}

        {/* Compact explanation */}
        {!isUser && explanation && !showStreamingIndicator && (
          <div className="mt-1 text-[10px] text-blue-400/80 italic pl-1">
            💡 {explanation}
          </div>
        )}
      </div>
    </div>
  );
};
