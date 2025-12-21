import { useContext } from 'react';
import {
  ChevronDown,
  Copy,
  Edit3,
  Save,
  ClipboardType,
  ClipboardCopy,
  Trash2,
  MessageCircle,
} from 'lucide-react';
import { ThemeContext } from '../../contexts/ThemeContext';

interface PatientCardActionsProps {
  patientName: string;
  isEditing: boolean;
  isCollapsed: boolean;
  onSave: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onCopy: () => void;
  onEmrCopy: () => void;
  onRawCopy: () => void;
  onChatFocus: () => void;
  onToggleCollapse: () => void;
}

export function PatientCardActions({
  patientName,
  isEditing,
  isCollapsed,
  onSave,
  onEdit,
  onDelete,
  onCopy,
  onEmrCopy,
  onRawCopy,
  onChatFocus,
  onToggleCollapse,
}: PatientCardActionsProps) {
  const { isDarkMode } = useContext(ThemeContext);

  if (isEditing) {
    return (
      <div className="flex items-center gap-2 mr-2">
        <span className="text-xs text-gray-500 animate-pulse">Editing...</span>
        <button
          onMouseDown={onSave}
          className="p-1.5 rounded-lg bg-green-600 hover:bg-green-500 text-white"
          title="Save"
        >
          <Save className="w-3 h-3" />
        </button>
      </div>
    );
  }

  const buttonClass = (hoverBg: string, textColor: string, hoverTextColor?: string) =>
    `p-2 rounded-lg transition-colors ${
      isDarkMode
        ? `hover:${hoverBg} ${textColor} ${hoverTextColor ? `hover:${hoverTextColor}` : ''}`
        : `hover:${hoverBg} ${textColor} ${hoverTextColor ? `hover:${hoverTextColor}` : ''}`
    }`;

  return (
    <>
      <button
        onClick={e => {
          e.stopPropagation();
          onChatFocus();
        }}
        className={`p-2 rounded-lg transition-colors ${
          isDarkMode
            ? 'hover:bg-blue-900/30 text-blue-400 hover:text-blue-300'
            : 'hover:bg-blue-50 text-blue-500 hover:text-blue-600'
        }`}
        title={`Chat about ${patientName}`}
      >
        <MessageCircle className="w-4 h-4" />
      </button>

      <button
        onClick={e => {
          e.stopPropagation();
          if (confirm('Delete this patient card?')) onDelete();
        }}
        className={`p-2 rounded-lg transition-colors ${
          isDarkMode
            ? 'hover:bg-red-900/30 text-gray-400 hover:text-red-400'
            : 'hover:bg-red-50 text-gray-500 hover:text-red-500'
        }`}
        title="Delete Patient"
      >
        <Trash2 className="w-4 h-4" />
      </button>

      <button
        onClick={e => {
          e.stopPropagation();
          onEmrCopy();
        }}
        className={`p-2 rounded-lg transition-colors ${
          isDarkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-200 text-gray-500'
        }`}
        title="Copy Plain Text (EMR Safe)"
      >
        <ClipboardType className="w-4 h-4" />
      </button>

      <button
        onClick={e => {
          e.stopPropagation();
          onRawCopy();
        }}
        className={`p-2 rounded-lg transition-colors ${
          isDarkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-200 text-gray-500'
        }`}
        title="Copy All Markdown"
      >
        <ClipboardCopy className="w-4 h-4" />
      </button>

      <button
        onClick={e => {
          e.stopPropagation();
          onCopy();
        }}
        className={`p-2 rounded-lg transition-colors ${
          isDarkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-200 text-gray-500'
        }`}
        title="Copy Text (Standard)"
      >
        <Copy className="w-4 h-4" />
      </button>

      <button
        onClick={e => {
          e.stopPropagation();
          onEdit();
        }}
        className={`p-2 rounded-lg transition-colors ${
          isDarkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-200 text-gray-500'
        }`}
        title="Edit Text"
      >
        <Edit3 className="w-4 h-4" />
      </button>

      <button
        onClick={e => {
          e.stopPropagation();
          onToggleCollapse();
        }}
        className={`p-2 rounded-lg transition-colors ${
          isDarkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-200 text-gray-500'
        }`}
        aria-expanded={!isCollapsed}
        aria-label={isCollapsed ? 'Expand card' : 'Collapse card'}
      >
        <ChevronDown className={`w-4 h-4 transition-transform ${isCollapsed ? '-rotate-90' : ''}`} />
      </button>
    </>
  );
}
