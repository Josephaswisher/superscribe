import React, { useState, useEffect } from 'react';
import { Message, Role } from '../../types';
import { Bot, User, Lightbulb, Sparkles, Brain } from 'lucide-react';
import { ArtifactCard } from './ArtifactCard';

interface MessageBubbleProps {
  msg: Message;
  explanation?: string;
  isStreaming?: boolean;
}

// Thinking animation phrases
const THINKING_PHASES = [
  'Analyzing request...',
  'Reviewing context...',
  'Drafting response...',
  'Refining output...',
];

// Streaming indicator component
const StreamingIndicator: React.FC<{ text: string }> = ({ text }) => {
  const [phase, setPhase] = useState(0);
  const [dots, setDots] = useState('');

  useEffect(() => {
    const phaseInterval = setInterval(() => {
      setPhase(p => (p + 1) % THINKING_PHASES.length);
    }, 2000);

    const dotsInterval = setInterval(() => {
      setDots(d => (d.length >= 3 ? '' : d + '.'));
    }, 400);

    return () => {
      clearInterval(phaseInterval);
      clearInterval(dotsInterval);
    };
  }, []);

  // Calculate approximate progress from text length
  const hasContent = text && text.length > 10;

  return (
    <div className="flex flex-col gap-2">
      {/* Animated thinking indicator */}
      <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-[#d97757]/10 to-transparent rounded-2xl border border-[#d97757]/20">
        <div className="relative">
          <Brain className="w-5 h-5 text-[#d97757] animate-pulse" />
          <Sparkles className="w-3 h-3 text-yellow-400 absolute -top-1 -right-1 animate-bounce" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-medium text-[#d97757]">
            {THINKING_PHASES[phase]}
            {dots}
          </span>
          {hasContent && <span className="text-xs text-gray-500">Generating response...</span>}
        </div>
        {/* Animated progress bar */}
        <div className="ml-auto flex gap-1">
          {[0, 1, 2].map(i => (
            <div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-[#d97757] animate-pulse"
              style={{ animationDelay: `${i * 150}ms` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

// Check if text looks like raw JSON/streaming garbage
const isRawStreamingText = (text: string): boolean => {
  if (!text || text.length < 5) return true;
  // Check for incomplete JSON
  if (text.startsWith('{') && !text.endsWith('}')) return true;
  if (text.includes('"conversationalResponse"') && !text.includes('updatedDocument')) return true;
  // Check for JSON structure
  if (text.trim().startsWith('{') && text.includes('"')) return true;
  return false;
};

// Extract clean response from potentially raw text
const extractCleanResponse = (text: string): string => {
  if (!text) return '';

  // Try to parse as JSON and extract conversationalResponse
  try {
    const cleaned = text
      .replace(/```json\s*/g, '')
      .replace(/```\s*/g, '')
      .trim();
    if (cleaned.startsWith('{')) {
      const parsed = JSON.parse(cleaned);
      return parsed.conversationalResponse || parsed.text || text;
    }
  } catch {
    // Not valid JSON, return as-is if it looks clean
  }

  // If it doesn't look like JSON garbage, return as-is
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

  // For AI messages, check if we should show streaming indicator
  const showStreamingIndicator = !isUser && isStreaming && isRawStreamingText(msg.text);
  const displayText = isUser ? msg.text : extractCleanResponse(msg.text) || msg.text;

  // Don't show empty AI messages
  if (!isUser && !displayText && !isStreaming) {
    return null;
  }

  return (
    <div
      className={`flex gap-4 mb-6 animate-in fade-in slide-in-from-bottom-2 duration-300 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
    >
      <div
        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isUser ? 'bg-gray-700 text-gray-300' : 'bg-[#d97757] text-white shadow-lg shadow-[#d97757]/20'}`}
      >
        {isUser ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
      </div>

      <div className={`flex flex-col max-w-[85%] ${isUser ? 'items-end' : 'items-start'}`}>
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-sm font-bold text-gray-200">{isUser ? 'You' : 'SuperScribe'}</span>
          <span className="text-xs text-gray-500">
            {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        {/* Attachments Display */}
        {msg.attachments && msg.attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {msg.attachments.map((att, i) => (
              <ArtifactCard key={i} type={att.type} name={att.name} />
            ))}
          </div>
        )}

        {/* Message Content or Streaming Indicator */}
        {showStreamingIndicator ? (
          <StreamingIndicator text={msg.text} />
        ) : (
          <div
            className={`text-[15px] leading-relaxed whitespace-pre-wrap ${isUser ? 'text-gray-300 bg-gray-800 px-4 py-2 rounded-2xl rounded-tr-sm' : 'text-gray-200 bg-gray-750 px-4 py-2 rounded-2xl rounded-tl-sm'}`}
          >
            {displayText}
          </div>
        )}

        {/* AI Explanation / Reasoning Block */}
        {!isUser && explanation && !showStreamingIndicator && (
          <div className="mt-2 text-xs bg-blue-900/20 border border-blue-500/20 text-blue-300 p-2 rounded-lg flex gap-2 items-start max-w-full">
            <Lightbulb className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            <span className="break-words">{explanation}</span>
          </div>
        )}
      </div>
    </div>
  );
};
