import React, { useContext, useEffect, useCallback } from 'react';
import {
  Globe,
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
    id: 'global',
    label: 'Global View',
    shortLabel: 'Global',
    icon: Globe,
    shortcut: '`',
    color: {
      active: 'bg-cyan-500 text-white',
      inactive: 'bg-gray-100 text-gray-600 hover:bg-gray-200',
      darkActive: 'bg-cyan-600 text-white',
      darkInactive: 'bg-gray-700 text-gray-300 hover:bg-gray-600',
    },
  },
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
    id: 'table',
    label: 'Patient Table',
    shortLabel: 'Table',
    icon: Users,
    shortcut: '8',
    color: {
      active: 'bg-indigo-500 text-white',
      inactive: 'bg-gray-100 text-gray-600 hover:bg-gray-200',
      darkActive: 'bg-indigo-600 text-white',
      darkInactive: 'bg-gray-700 text-gray-300 hover:bg-gray-600',
    },
  },
  {
    id: 'handoff',
    label: 'Handoff',
    shortLabel: 'Handoff',
    icon: FileOutput,
    shortcut: '9',
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
    shortcut: '0',
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

  const containerClass = isDarkMode
    ? 'bg-gray-800/50 p-1 border-gray-700'
    : 'bg-gray-100 p-1 border-gray-200';

  return (
    <div className={`inline-flex flex-wrap gap-1 rounded-lg border ${containerClass} ${className}`}>
      {VIEW_OPTIONS.map(option => {
        const Icon = option.icon;
        const isActive = currentView === option.id;

        let buttonClass = `
          flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all duration-200
        `;

        if (isActive) {
          buttonClass += isDarkMode
            ? ' bg-gray-700 text-white shadow-sm ring-1 ring-white/10'
            : ' bg-white text-gray-900 shadow-sm ring-1 ring-black/5';
        } else {
          buttonClass += isDarkMode
            ? ' text-gray-400 hover:text-gray-200 hover:bg-white/5'
            : ' text-gray-500 hover:text-gray-900 hover:bg-gray-200/50';
        }

        return (
          <button
            key={option.id}
            onClick={() => onViewChange(option.id)}
            title={`${option.label} (${option.shortcut})`}
            className={buttonClass}
          >
            <Icon className={`w-3.5 h-3.5 ${isActive ? 'opacity-100' : 'opacity-70'}`} />
            <span className="">{option.shortLabel}</span>
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
