import React, { useContext, useEffect, useCallback } from 'react';
import {
  LayoutGrid,
  FileText,
  Activity,
  Pill,
  ClipboardList,
  AlertTriangle,
  FileOutput,
  Phone,
  Users,
} from 'lucide-react';
import { ThemeContext } from '../contexts/ThemeContext';
import { ViewMode } from '../types';

interface ViewSwitcherProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
  className?: string;
}

interface ViewOption {
  id: ViewMode;
  label: string;
  shortLabel: string;
  icon: React.ElementType;
  shortcut: string;
  color: {
    active: string;
    inactive: string;
    darkActive: string;
    darkInactive: string;
  };
}

const VIEW_OPTIONS: ViewOption[] = [
  {
    id: 'cards',
    label: 'Patient Cards',
    shortLabel: 'Cards',
    icon: LayoutGrid,
    shortcut: '1',
    color: {
      active: 'bg-blue-500 text-white',
      inactive: 'bg-gray-100 text-gray-600 hover:bg-gray-200',
      darkActive: 'bg-blue-600 text-white',
      darkInactive: 'bg-gray-700 text-gray-300 hover:bg-gray-600',
    },
  },
  {
    id: 'document',
    label: 'Raw Document',
    shortLabel: 'Raw',
    icon: FileText,
    shortcut: '2',
    color: {
      active: 'bg-purple-500 text-white',
      inactive: 'bg-gray-100 text-gray-600 hover:bg-gray-200',
      darkActive: 'bg-purple-600 text-white',
      darkInactive: 'bg-gray-700 text-gray-300 hover:bg-gray-600',
    },
  },
  {
    id: 'idr',
    label: 'IDR Rounds',
    shortLabel: 'IDR',
    icon: Users,
    shortcut: '3',
    color: {
      active: 'bg-teal-500 text-white',
      inactive: 'bg-gray-100 text-gray-600 hover:bg-gray-200',
      darkActive: 'bg-teal-600 text-white',
      darkInactive: 'bg-gray-700 text-gray-300 hover:bg-gray-600',
    },
  },
  {
    id: 'plan',
    label: 'Plan View',
    shortLabel: 'Plan',
    icon: ClipboardList,
    shortcut: '4',
    color: {
      active: 'bg-green-500 text-white',
      inactive: 'bg-gray-100 text-gray-600 hover:bg-gray-200',
      darkActive: 'bg-green-600 text-white',
      darkInactive: 'bg-gray-700 text-gray-300 hover:bg-gray-600',
    },
  },
  {
    id: 'labs',
    label: 'Labs View',
    shortLabel: 'Labs',
    icon: Activity,
    shortcut: '5',
    color: {
      active: 'bg-orange-500 text-white',
      inactive: 'bg-gray-100 text-gray-600 hover:bg-gray-200',
      darkActive: 'bg-orange-600 text-white',
      darkInactive: 'bg-gray-700 text-gray-300 hover:bg-gray-600',
    },
  },
  {
    id: 'meds',
    label: 'Medications',
    shortLabel: 'Meds',
    icon: Pill,
    shortcut: '6',
    color: {
      active: 'bg-pink-500 text-white',
      inactive: 'bg-gray-100 text-gray-600 hover:bg-gray-200',
      darkActive: 'bg-pink-600 text-white',
      darkInactive: 'bg-gray-700 text-gray-300 hover:bg-gray-600',
    },
  },
  {
    id: 'critical',
    label: 'Critical Alerts',
    shortLabel: 'Critical',
    icon: AlertTriangle,
    shortcut: '7',
    color: {
      active: 'bg-red-500 text-white',
      inactive: 'bg-gray-100 text-gray-600 hover:bg-gray-200',
      darkActive: 'bg-red-600 text-white',
      darkInactive: 'bg-gray-700 text-gray-300 hover:bg-gray-600',
    },
  },
  {
    id: 'handoff',
    label: 'Handoff',
    shortLabel: 'Handoff',
    icon: FileOutput,
    shortcut: '8',
    color: {
      active: 'bg-indigo-500 text-white',
      inactive: 'bg-gray-100 text-gray-600 hover:bg-gray-200',
      darkActive: 'bg-indigo-600 text-white',
      darkInactive: 'bg-gray-700 text-gray-300 hover:bg-gray-600',
    },
  },
  {
    id: 'pages',
    label: 'Pages',
    shortLabel: 'Pages',
    icon: Phone,
    shortcut: '9',
    color: {
      active: 'bg-amber-500 text-white',
      inactive: 'bg-gray-100 text-gray-600 hover:bg-gray-200',
      darkActive: 'bg-amber-600 text-white',
      darkInactive: 'bg-gray-700 text-gray-300 hover:bg-gray-600',
    },
  },
];

export const ViewSwitcher: React.FC<ViewSwitcherProps> = ({
  currentView,
  onViewChange,
  className = '',
}) => {
  const { isDarkMode } = useContext(ThemeContext);

  // Keyboard shortcuts
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Only trigger if no modifier keys and not in an input
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      const option = VIEW_OPTIONS.find(v => v.shortcut === e.key);
      if (option) {
        e.preventDefault();
        onViewChange(option.id);
      }
    },
    [onViewChange]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className={`flex flex-wrap gap-1.5 ${className}`}>
      {VIEW_OPTIONS.map(option => {
        const Icon = option.icon;
        const isActive = currentView === option.id;
        const colorClass = isActive
          ? isDarkMode
            ? option.color.darkActive
            : option.color.active
          : isDarkMode
            ? option.color.darkInactive
            : option.color.inactive;

        return (
          <button
            key={option.id}
            onClick={() => onViewChange(option.id)}
            title={`${option.label} (${option.shortcut})`}
            className={`
              flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium
              transition-all duration-150 ease-out
              ${colorClass}
              ${isActive ? 'shadow-md scale-105' : 'shadow-sm'}
            `}
          >
            <Icon className="w-4 h-4" />
            <span className="hidden sm:inline">{option.shortLabel}</span>
            <span
              className={`
              text-xs px-1.5 py-0.5 rounded-full ml-1
              ${isActive ? 'bg-white/20' : isDarkMode ? 'bg-gray-600' : 'bg-gray-200'}
            `}
            >
              {option.shortcut}
            </span>
          </button>
        );
      })}
    </div>
  );
};

// Compact version for toolbar
export const ViewSwitcherCompact: React.FC<ViewSwitcherProps> = ({
  currentView,
  onViewChange,
  className = '',
}) => {
  const { isDarkMode } = useContext(ThemeContext);

  // Keyboard shortcuts (same as above)
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      const option = VIEW_OPTIONS.find(v => v.shortcut === e.key);
      if (option) {
        e.preventDefault();
        onViewChange(option.id);
      }
    },
    [onViewChange]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const baseClass = isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';

  return (
    <div className={`inline-flex rounded-lg border overflow-hidden ${baseClass} ${className}`}>
      {VIEW_OPTIONS.map((option, index) => {
        const Icon = option.icon;
        const isActive = currentView === option.id;

        return (
          <button
            key={option.id}
            onClick={() => onViewChange(option.id)}
            title={`${option.label} (${option.shortcut})`}
            className={`
              p-2 transition-colors relative
              ${index > 0 ? (isDarkMode ? 'border-l border-gray-700' : 'border-l border-gray-200') : ''}
              ${
                isActive
                  ? isDarkMode
                    ? 'bg-blue-600 text-white'
                    : 'bg-blue-500 text-white'
                  : isDarkMode
                    ? 'text-gray-400 hover:text-white hover:bg-gray-700'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
              }
            `}
          >
            <Icon className="w-4 h-4" />
            {isActive && (
              <span className="absolute -bottom-0.5 left-1/2 transform -translate-x-1/2 w-1 h-1 rounded-full bg-current" />
            )}
          </button>
        );
      })}
    </div>
  );
};
