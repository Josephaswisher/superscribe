import React, { useState, useRef, useEffect, useContext } from 'react';
import { Message, Role, Attachment } from '../../types';
import { sendMessageToAI } from '../../services/aiService';
import { Bot, MoreHorizontal } from 'lucide-react';

// Imported Sub-Components
import { ChatInput } from './ChatInput';
import { MessageBubble } from './MessageBubble';
import { DocumentContext } from '../../contexts/DocumentContext';

// --- MAIN COMPONENT ---

export const ChatInterface: React.FC = () => {
  const { currentContent, activeTemplate, handleDocumentUpdate } = useContext(DocumentContext);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: Role.MODEL,
      text: "Hello, Dr. Swisher! I'm your AI documentation partner. You can now tell me what to do (e.g., 'Add sepsis plan', '/progress'), upload images (EKG, Labs), or record voice notes directly. I'll provide fast, precise, and clinically intelligent notes.",
      timestamp: new Date()
    }
  ]);
  // Store explanations separately to keep Message type clean, or extend Message type in UI state
  const [explanations, setExplanations] = useState<Record<string, string>>({});
  const [isReasoning, setIsReasoning] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (text: string, attachments: Attachment[]) => {
    // Add user message immediately
    const userMsg: Message = {
      id: Date.now().toString(),
      role: Role.USER,
      text,
      timestamp: new Date(),
      attachments
    };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    // Placeholder for AI message to allow streaming updates
    const tempAiMsgId = (Date.now() + 1).toString();
    const tempAiMsg: Message = {
      id: tempAiMsgId,
      role: Role.MODEL,
      text: '', // Start empty
      timestamp: new Date()
    };
    setMessages(prev => [...prev, tempAiMsg]);

    try {
      if (!activeTemplate) {
        throw new Error("No active template selected.");
      }

      const result = await sendMessageToAI(
        [...messages, userMsg], // Include new user message in history
        text,
        attachments,
        currentContent,
        activeTemplate,
        isReasoning,
        (chunkText) => {
          // STREAMING CALLBACK
          setMessages(prev => prev.map(m =>
            m.id === tempAiMsgId ? { ...m, text: chunkText } : m
          ));
        }
      );

      // Final update with processed result
      setMessages(prev => prev.map(m =>
        m.id === tempAiMsgId ? {
          ...m,
          text: result.text,
          isInternal: false, // Ensure it's visible
          attachments: result.updatedDocument ? [{ name: 'Document Updated', type: 'pdf', mimeType: 'application/pdf', data: '' }] : undefined
        } : m
      ));

      if (result.explanation) {
        setExplanations(prev => ({ ...prev, [tempAiMsgId]: result.explanation! }));
      }

      if (result.updatedDocument) {
        handleDocumentUpdate(result.updatedDocument);
      }
    } catch (error) {
      console.error("Chat Error", error);
      setMessages(prev => prev.map(m =>
        m.id === tempAiMsgId ? { ...m, text: "I'm sorry, I encountered an error processing your request." } : m
      ));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#18181b] relative">
      {/* Header */}
      <div className={`h-16 px-5 flex items-center justify-between border-b shrink-0 bg-[#18181b]/95 backdrop-blur supports-[backdrop-filter]:bg-[#18181b]/80 border-white/5`}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#d97757] to-[#c66a4d] flex items-center justify-center shadow-lg shadow-orange-900/20">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white tracking-tight">SuperScribe</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#d97757]/10 text-[#d97757] border border-[#d97757]/20">PRO</span>
            </div>
            <div className="text-[10px] text-gray-500 font-medium">Medical Assistant (DeepSeek V3)</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsReasoning(!isReasoning)}
            className={`px-3 py-1.5 rounded text-[11px] font-bold border transition-all flex items-center gap-1.5 ${isReasoning ? 'bg-[#d97757] text-white border-[#d97757] shadow-lg shadow-orange-900/20' : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10 hover:border-white/20'}`}
            title="Enable DeepSeek-R1 Chain of Thought"
          >
            {isReasoning && <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
            DeepSeek R1
          </button>
          <button className="p-2 hover:bg-white/5 rounded-lg text-gray-400 transition-colors">
            <MoreHorizontal className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} msg={msg} explanation={explanations[msg.id]} />
        ))}
        {isLoading && (
          <div className="flex gap-4 animate-pulse">
            <div className="w-8 h-8 rounded-lg bg-[#d97757]/50 flex items-center justify-center shrink-0">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div className="flex items-center gap-1 mt-2">
              <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce delay-100"></div>
              <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce delay-200"></div>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <ChatInput onSend={handleSendMessage} isLoading={isLoading} />
    </div>
  );
};