import React, { useState, useRef, useEffect, useContext } from 'react';
import { Message, Role, Attachment } from '../../types';
import { sendMessageToAI } from '../../services/aiService';
import {
  Bot,
  UserPlus,
  Database,
  StickyNote,
  Wrench,
  Send,
  Paperclip,
  X,
  Loader2,
  Settings,
  Zap,
  Sparkles,
  FilePlus,
  FolderOpen,
} from 'lucide-react';

import { MessageBubble } from './MessageBubble';
import { DocumentContext } from '../../contexts/DocumentContext';
import { useModel } from '../../contexts/ModelContext';
import { UISettingsContext } from '../../contexts/UISettingsContext';
import { parseRawContent } from '../../utils/documentUtils';
import { generateMockPatients } from '../../utils/generatePatients';
import { DEFAULT_TEMPLATES } from '../../constants';
import { AI_MODELS } from '../../services/aiService';

export const ChatInterface: React.FC = () => {
  const {
    currentContent,
    activeTemplate,
    activeTemplateId,
    setActiveTemplateId,
    handleDocumentUpdate,
    handleManualUpdate,
    createDocument,
  } = useContext(DocumentContext);
  const { setIsScratchpadOpen, setIsTemplateModalOpen, setIsDocumentManagerOpen } =
    useContext(UISettingsContext);
  const { selectedModel, setSelectedModel, currentModelConfig } = useModel();

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: Role.MODEL,
      text: "Ready to assist. Try commands like '/progress' or ask me to update your notes.",
      timestamp: new Date(),
    },
  ]);
  const [explanations, setExplanations] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isToolsOpen, setIsToolsOpen] = useState(true);
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);

  const handleAddPatient = () => {
    const groups = parseRawContent(currentContent);
    const patientCount = groups.filter(g => g.header !== '### Preamble').length;
    const nextNum = patientCount + 1;
    const roomInput = window.prompt('Room Number (optional):');
    const roomSuffix = roomInput ? ` - Room ${roomInput}` : ' - Room';
    const newPatient = `### ${nextNum}. New Patient${roomSuffix}\n**Age:** \n**Admitted for:** \n\n# Problem 1\n`;
    const newContent = currentContent.trim()
      ? `${currentContent.trim()}\n\n${newPatient}`
      : newPatient;
    handleManualUpdate(newContent);
  };

  const handleAddTestData = () => {
    const testData = generateMockPatients(5);
    const newContent = currentContent.trim() ? `${currentContent.trim()}\n${testData}` : testData;
    handleManualUpdate(newContent);
  };

  const handleSend = async () => {
    if ((!input.trim() && attachments.length === 0) || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: Role.USER,
      text: input.trim(),
      timestamp: new Date(),
      attachments,
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setAttachments([]);
    setIsLoading(true);

    const tempAiMsgId = (Date.now() + 1).toString();
    setMessages(prev => [
      ...prev,
      { id: tempAiMsgId, role: Role.MODEL, text: '', timestamp: new Date() },
    ]);

    try {
      if (!activeTemplate) throw new Error('No template selected.');

      const result = await sendMessageToAI(
        [...messages, userMsg],
        userMsg.text,
        attachments,
        currentContent,
        activeTemplate,
        false,
        chunkText => {
          setMessages(prev =>
            prev.map(m => (m.id === tempAiMsgId ? { ...m, text: chunkText } : m))
          );
        },
        selectedModel
      );

      setMessages(prev => prev.map(m => (m.id === tempAiMsgId ? { ...m, text: result.text } : m)));

      if (result.explanation) {
        setExplanations(prev => ({ ...prev, [tempAiMsgId]: result.explanation! }));
      }
      if (result.updatedDocument) {
        handleDocumentUpdate(result.updatedDocument);
      }
    } catch (error) {
      console.error('Chat Error', error);
      setMessages(prev =>
        prev.map(m => (m.id === tempAiMsgId ? { ...m, text: 'Error processing request.' } : m))
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        if (base64) {
          setAttachments(prev => [
            ...prev,
            { name: file.name, type: 'image', mimeType: file.type, data: base64 },
          ]);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const ToolButton: React.FC<{
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
    accent?: boolean;
  }> = ({ icon, label, onClick, accent }) => (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-medium transition-all ${
        accent
          ? 'bg-[#d97757]/20 text-[#d97757] hover:bg-[#d97757]/30'
          : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-gray-200'
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );

  return (
    <div className="flex flex-col h-full bg-[#18181b]">
      {/* Compact Header */}
      <div className="h-11 px-3 flex items-center justify-between border-b border-white/5 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-gradient-to-br from-[#d97757] to-[#c66a4d] flex items-center justify-center">
            <Bot className="w-3.5 h-3.5 text-white" />
          </div>
          <div>
            <span className="text-xs font-bold text-white">SuperScribe</span>
            <span className="ml-1.5 px-1 py-0.5 rounded text-[8px] font-bold bg-[#d97757]/10 text-[#d97757]">
              PRO
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsToolsOpen(!isToolsOpen)}
            className="p-1.5 rounded-md text-gray-500 hover:text-gray-300 hover:bg-white/5"
          >
            <Wrench className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Collapsible Tools Panel */}
      {isToolsOpen && (
        <div className="px-3 py-2 border-b border-white/5 space-y-2 animate-in slide-in-from-top-1 duration-150">
          {/* Template Selector */}
          <div className="flex items-center gap-2">
            <span className="text-[9px] uppercase tracking-wider text-gray-500 font-semibold w-14">
              Template
            </span>
            <div className="flex-1 flex flex-wrap gap-1">
              {DEFAULT_TEMPLATES.slice(0, 4).map(t => (
                <button
                  key={t.id}
                  onClick={() => setActiveTemplateId(t.id)}
                  className={`px-2 py-0.5 rounded text-[10px] font-medium transition-all ${
                    activeTemplateId === t.id
                      ? 'bg-[#d97757] text-white'
                      : 'bg-white/5 text-gray-400 hover:bg-white/10'
                  }`}
                >
                  {t.name}
                </button>
              ))}
              <button
                onClick={() => setIsTemplateModalOpen(true)}
                className="px-1.5 py-0.5 rounded text-[10px] text-gray-500 hover:text-gray-300"
              >
                <Settings className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            <span className="text-[9px] uppercase tracking-wider text-gray-500 font-semibold w-14">
              Actions
            </span>
            <div className="flex flex-wrap gap-1">
              <ToolButton
                icon={<UserPlus className="w-3 h-3" />}
                label="Add Patient"
                onClick={handleAddPatient}
                accent
              />
              <ToolButton
                icon={<FilePlus className="w-3 h-3" />}
                label="New Sheet"
                onClick={() => createDocument()}
                accent
              />
              <ToolButton
                icon={<FolderOpen className="w-3 h-3" />}
                label="My Sheets"
                onClick={() => setIsDocumentManagerOpen(true)}
              />
              <ToolButton
                icon={<StickyNote className="w-3 h-3" />}
                label="Scratchpad"
                onClick={() => setIsScratchpadOpen(true)}
              />
              <ToolButton
                icon={<Database className="w-3 h-3" />}
                label="Test Data"
                onClick={handleAddTestData}
              />
            </div>
          </div>

          {/* Model Selector */}
          <div className="flex items-center gap-2">
            <span className="text-[9px] uppercase tracking-wider text-gray-500 font-semibold w-14">
              Model
            </span>
            <div className="flex gap-1">
              {AI_MODELS.map(m => (
                <button
                  key={m.id}
                  onClick={() => setSelectedModel(m.id)}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium transition-all ${
                    selectedModel === m.id
                      ? 'bg-blue-500/20 text-blue-400'
                      : 'bg-white/5 text-gray-500 hover:bg-white/10'
                  }`}
                >
                  {m.id === 'gemini-flash' ? (
                    <Zap className="w-2.5 h-2.5" />
                  ) : (
                    <Sparkles className="w-2.5 h-2.5" />
                  )}
                  {m.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Messages - Limited Height with Scroll */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-3 space-y-1 max-h-[40vh] custom-scrollbar"
      >
        {messages.map((msg, idx) => {
          const isLastModel = msg.role === Role.MODEL && idx === messages.length - 1;
          return (
            <MessageBubble
              key={msg.id}
              msg={msg}
              explanation={explanations[msg.id]}
              isStreaming={isLoading && isLastModel}
            />
          );
        })}
      </div>

      {/* Compact Inline Input */}
      <div className="p-2 border-t border-white/5">
        {/* Attachment previews */}
        {attachments.length > 0 && (
          <div className="flex gap-1 mb-2 flex-wrap">
            {attachments.map((att, i) => (
              <div
                key={i}
                className="flex items-center gap-1 px-2 py-0.5 bg-gray-700 rounded text-[10px] text-gray-300"
              >
                <span className="truncate max-w-[80px]">{att.name}</span>
                <button
                  onClick={() => setAttachments(prev => prev.filter((_, idx) => idx !== i))}
                  className="text-gray-500 hover:text-red-400"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2 bg-[#232326] rounded-lg px-2 py-1.5 border border-gray-700/50 focus-within:border-[#d97757]/50">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-1 text-gray-500 hover:text-gray-300"
          >
            <Paperclip className="w-3.5 h-3.5" />
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleFileSelect}
            />
          </button>

          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder="Ask anything or use /commands..."
            className="flex-1 bg-transparent text-xs text-gray-200 placeholder-gray-500 focus:outline-none"
            disabled={isLoading}
          />

          <button
            onClick={handleSend}
            disabled={(!input.trim() && attachments.length === 0) || isLoading}
            className={`p-1.5 rounded-md transition-all ${
              (input.trim() || attachments.length > 0) && !isLoading
                ? 'bg-[#d97757] text-white hover:bg-[#c66a4d]'
                : 'bg-gray-700 text-gray-500'
            }`}
          >
            {isLoading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
          </button>
        </div>

        <div className="text-center mt-1.5 text-[9px] text-gray-600">
          {currentModelConfig?.name} • {activeTemplate?.name}
        </div>
      </div>
    </div>
  );
};
