import React from 'react';
import { Message, Role } from '../../types';
import { Bot, User, Lightbulb } from 'lucide-react';
import { ArtifactCard } from './ArtifactCard';

interface MessageBubbleProps { 
  msg: Message; 
  explanation?: string; 
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ msg, explanation }) => {
  const isUser = msg.role === Role.USER;
  
  return (
    <div className={`flex gap-4 mb-6 animate-in fade-in slide-in-from-bottom-2 duration-300 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isUser ? 'bg-gray-700 text-gray-300' : 'bg-[#d97757] text-white shadow-lg shadow-[#d97757]/20'}`}>
        {isUser ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
      </div>
      
      <div className={`flex flex-col max-w-[85%] ${isUser ? 'items-end' : 'items-start'}`}>
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-sm font-bold text-gray-200">{isUser ? 'You' : 'SuperScribe'}</span>
          <span className="text-xs text-gray-500">{msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
        
        {/* Attachments Display */}
        {msg.attachments && msg.attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
                {msg.attachments.map((att, i) => (
                    <ArtifactCard key={i} type={att.type} name={att.name} />
                ))}
            </div>
        )}

        <div className={`text-[15px] leading-relaxed whitespace-pre-wrap ${isUser ? 'text-gray-300 bg-gray-800 px-4 py-2 rounded-2xl rounded-tr-sm' : 'text-gray-200 bg-gray-750 px-4 py-2 rounded-2xl rounded-tl-sm'}`}>
          {msg.text}
        </div>

        {/* AI Explanation / Reasoning Block */}
        {!isUser && explanation && (
            <div className="mt-2 text-xs bg-blue-900/20 border border-blue-500/20 text-blue-300 p-2 rounded-lg flex gap-2 items-start">
                <Lightbulb className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                <span>{explanation}</span>
            </div>
        )}
      </div>
    </div>
  );
};