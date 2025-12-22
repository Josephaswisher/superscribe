import React, { useState, useRef, useEffect, useContext } from 'react';
import {
  ArrowUp,
  Mic,
  Image as ImageIcon,
  X,
  Loader2,
  Paperclip,
  StopCircle,
  ChevronDown,
  Sparkles,
  Zap,
  Bot,
} from 'lucide-react';
import { Attachment } from '../../types';
import { UISettingsContext } from '../../contexts/UISettingsContext';
import { useModel } from '../../contexts/ModelContext';
import { AI_MODELS, type AIProvider } from '../../services/aiService';

interface ChatInputProps {
  onSend: (text: string, attachments: Attachment[]) => void;
  isLoading: boolean;
}

const COMMAND_SHORTCUTS: Record<string, string> = {
  '/p': '/progress',
  '/d': '/discharge',
  '/so': '/signout',
  '/hp': '/hp',
};

// Model icon mapping
const MODEL_ICONS: Record<AIProvider, React.ReactNode> = {
  'gemini-flash': <Zap className="w-3.5 h-3.5" />,
  'gemini-pro': <Sparkles className="w-3.5 h-3.5" />,
  deepseek: <Bot className="w-3.5 h-3.5" />,
};

export const ChatInput: React.FC<ChatInputProps> = ({ onSend, isLoading }) => {
  const { prefillChat, setPrefillChat } = useContext(UISettingsContext);
  const { selectedModel, setSelectedModel, currentModelConfig } = useModel();
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const modelDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modelDropdownRef.current && !modelDropdownRef.current.contains(e.target as Node)) {
        setIsModelDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Listen for prefill actions (e.g. from PatientCard)
  useEffect(() => {
    if (prefillChat) {
      setInput(prev => {
        // Avoid duplicate prefill if already present
        if (prev.startsWith(prefillChat)) return prev;
        return prefillChat + prev;
      });
      setPrefillChat(''); // Clear after consuming

      // Auto-focus
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(1000, 1000); // Cursor at end
      }
    }
  }, [prefillChat, setPrefillChat]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const expandCommand = (text: string): string => {
    const command = text.split(' ')[0];
    if (COMMAND_SHORTCUTS[command]) {
      return text.replace(command, COMMAND_SHORTCUTS[command]);
    }
    return text;
  };

  const handleSubmit = () => {
    if ((!input.trim() && attachments.length === 0) || isLoading) return;

    const finalInput = expandCommand(input.trim());

    onSend(finalInput, attachments);
    setInput('');
    setAttachments([]);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  // --- AUDIO RECORDING ---
  const startRecording = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert('Your browser does not support audio recording.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = event => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64Audio = (reader.result as string).split(',')[1];
          const newAttachment: Attachment = {
            name: `Voice Note ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
            type: 'audio',
            mimeType: 'audio/webm',
            data: base64Audio,
          };
          setAttachments(prev => [...prev, newAttachment]);
        };
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (e) {
      console.error('Error accessing microphone:', e);
      alert('Could not access microphone. Please check your browser permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const toggleRecording = () => {
    if (isRecording) stopRecording();
    else startRecording();
  };

  // --- IMAGE UPLOAD ---
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        const base64String = (reader.result as string).split(',')[1];
        const type = file.type.startsWith('image/') ? 'image' : 'pdf';
        if (type !== 'image') return;

        const newAttachment: Attachment = {
          name: file.name,
          type: 'image',
          mimeType: file.type,
          data: base64String,
        };
        setAttachments(prev => [...prev, newAttachment]);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="p-4 bg-[#18181b]">
      <div
        className={`
          relative bg-[#27272a] rounded-2xl border transition-all duration-300 group shadow-xl
          ${isRecording ? 'border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.2)]' : 'border-gray-700/80 focus-within:border-[#d97757] focus-within:shadow-[0_0_20px_rgba(217,119,87,0.15)]'}
       `}
      >
        {/* Attachment Previews */}
        {attachments.length > 0 && (
          <div className="flex gap-2 px-4 pt-4 overflow-x-auto custom-scrollbar pb-1">
            {attachments.map((att, idx) => (
              <div
                key={idx}
                className="relative group/att shrink-0 animate-in fade-in zoom-in duration-200"
              >
                <div className="bg-[#323236] hover:bg-[#3a3a3e] border border-gray-600/50 rounded-lg p-2 pr-8 flex items-center gap-3 transition-colors cursor-default">
                  <div className="w-8 h-8 bg-gray-700/50 rounded flex items-center justify-center text-gray-300">
                    {att.type === 'image' ? (
                      <ImageIcon className="w-4 h-4" />
                    ) : (
                      <Mic className="w-4 h-4" />
                    )}
                  </div>
                  <div className="flex flex-col max-w-[120px]">
                    <span className="text-xs font-medium text-gray-200 truncate">{att.name}</span>
                    <span className="text-[10px] text-gray-400 capitalize">{att.type}</span>
                  </div>
                </div>
                <button
                  onClick={() => removeAttachment(idx)}
                  className="absolute -top-1.5 -right-1.5 bg-gray-600 text-white rounded-full p-0.5 opacity-0 group-hover/att:opacity-100 transition-opacity hover:bg-red-500 shadow-sm z-10 scale-90 hover:scale-105"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Text Area */}
        <textarea
          ref={textareaRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isRecording ? 'Listening...' : 'How can I help you today?'}
          className="w-full bg-transparent text-gray-100 placeholder-gray-400 px-4 py-4 min-h-[56px] max-h-[200px] resize-none focus:outline-none custom-scrollbar text-[15px] leading-relaxed"
          rows={1}
          disabled={isLoading}
        />

        {/* Bottom Toolbar */}
        <div className="flex justify-between items-center px-2 pb-2">
          {/* Left Actions */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-2 rounded-xl text-gray-400 hover:text-gray-100 hover:bg-[#3f3f46] transition-all duration-200 hover:scale-105 active:scale-95"
              title="Attach Image/File"
              disabled={isLoading}
            >
              <Paperclip className="w-4.5 h-4.5" />
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleFileSelect}
              />
            </button>
            <button
              onClick={toggleRecording}
              className={`p-2 rounded-xl transition-all duration-200 flex items-center gap-2 hover:scale-105 active:scale-95 ${isRecording ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20' : 'text-gray-400 hover:text-gray-100 hover:bg-[#3f3f46]'}`}
              title="Voice Note"
              disabled={isLoading}
            >
              {isRecording ? (
                <StopCircle className="w-4.5 h-4.5 fill-current animate-pulse" />
              ) : (
                <Mic className="w-4.5 h-4.5" />
              )}
              {isRecording && <span className="text-xs font-bold animate-pulse">Recording</span>}
            </button>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            <div
              className={`text-[10px] transition-opacity duration-300 ${input.length > 0 ? 'text-gray-500 opacity-100' : 'opacity-0'} hidden sm:block font-medium`}
            >
              Use <span className="font-mono bg-gray-700/50 px-1 rounded text-gray-400">/</span> for
              shortcuts
            </div>
            <button
              onClick={handleSubmit}
              disabled={(!input.trim() && attachments.length === 0) || isLoading}
              className={`p-2 rounded-xl transition-all duration-200 flex items-center justify-center ${
                (input.trim() || attachments.length > 0) && !isLoading
                  ? 'bg-[#d97757] text-white shadow-lg shadow-orange-900/20 hover:bg-[#c66a4d] hover:scale-105 active:scale-95'
                  : 'bg-[#3f3f46]/50 text-gray-500 cursor-not-allowed'
              }`}
            >
              {isLoading ? (
                <Loader2 className="w-4.5 h-4.5 animate-spin" />
              ) : (
                <ArrowUp className="w-4.5 h-4.5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Model Selector Footer */}
      <div className="mt-3 flex items-center justify-center">
        <div className="relative" ref={modelDropdownRef}>
          <button
            onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-transparent hover:bg-[#27272a] border border-transparent hover:border-gray-700/50 transition-all duration-200 group"
          >
            <span className="text-gray-500 group-hover:text-gray-300 transition-colors">
              {MODEL_ICONS[selectedModel]}
            </span>
            <span className="text-[11px] text-gray-400 group-hover:text-gray-200 font-medium transition-colors">
              {currentModelConfig?.name || 'Select Model'}
            </span>
            <ChevronDown
              className={`w-3 h-3 text-gray-500 group-hover:text-gray-300 transition-all duration-200 ${isModelDropdownOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {/* Dropdown Menu */}
          {isModelDropdownOpen && (
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 bg-[#27272a] border border-gray-700/80 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200 z-50">
              <div className="p-1">
                {AI_MODELS.map(model => (
                  <button
                    key={model.id}
                    onClick={() => {
                      setSelectedModel(model.id);
                      setIsModelDropdownOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 ${
                      selectedModel === model.id
                        ? 'bg-[#d97757]/10 text-[#d97757]'
                        : 'text-gray-300 hover:bg-[#3f3f46]'
                    }`}
                  >
                    <span
                      className={selectedModel === model.id ? 'text-[#d97757]' : 'text-gray-400'}
                    >
                      {MODEL_ICONS[model.id]}
                    </span>
                    <div className="flex flex-col items-start">
                      <span className="text-sm font-medium">{model.name}</span>
                      <span className="text-[10px] text-gray-500">{model.description}</span>
                    </div>
                    {selectedModel === model.id && (
                      <span className="ml-auto text-[#d97757] text-xs">✓</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
