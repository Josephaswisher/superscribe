import React, { useContext } from 'react';
import {
  LayoutGrid,
  FileText,
  LayoutDashboard,
  FileOutput,
  Users,
  AlertTriangle,
  ListTodo,
  TestTube2,
  Pill,
  BookOpen,
} from 'lucide-react';
import { ViewMode } from '../../types';
import { ThemeContext } from '../../contexts/ThemeContext';

interface ViewSwitcherProps {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
}

interface ViewTab {
  id: ViewMode;
  label: string;
  shortLabel: string;
  icon: React.ElementType;
  color: string;
  group: 'main' | 'focus';
}

const VIEW_TABS: ViewTab[] = [
  { id: 'cards', label: 'Cards', shortLabel: 'Cards', icon: LayoutGrid, color: 'text-blue-500', group: 'main' },
  { id: 'document', label: 'Document', shortLabel: 'Doc', icon: FileText, color: 'text-gray-500', group: 'main' },
  { id: 'dashboard', label: 'Dashboard', shortLabel: 'Dash', icon: LayoutDashboard, color: 'text-purple-500', group: 'main' },
  { id: 'handoff', label: 'Handoff', shortLabel: 'Hand', icon: FileOutput, color: 'text-green-500', group: 'main' },
  { id: 'idr', label: 'IDR Rounds', shortLabel: 'IDR', icon: Users, color: 'text-orange-500', group: 'main' },
  { id: 'pages', label: 'Pages', shortLabel: 'Pgs', icon: BookOpen, color: 'text-indigo-500', group: 'main' },
  { id: 'critical', label: 'Critical', shortLabel: 'Crit', icon: AlertTriangle, color: 'text-red-500', group: 'focus' },
  { id: 'plan', label: 'Plan', shortLabel: 'Plan', icon: ListTodo, color: 'text-teal-500', group: 'focus' },
  { id: 'labs', label: 'Labs', shortLabel: 'Labs', icon: TestTube2, color: 'text-cyan-500', group: 'focus' },
  { id: 'meds', label: 'Meds', shortLabel: 'Meds', icon: Pill, color: 'text-pink-500', group: 'focus' },
];

export const ViewSwitcher: React.FC<ViewSwitcherProps> = ({ viewMode, setViewMode }) => {
  const { isDarkMode } = useContext(ThemeContext);

  const mainTabs = VIEW_TABS.filter(t => t.group === 'main');
  const focusTabs = VIEW_TABS.filter(t => t.group === 'focus');

  const renderTab = (tab: ViewTab) => {
    const Icon = tab.icon;
    const isActive = viewMode === tab.id;

    return (
      <button
        key={tab.id}
        onClick={() => setViewMode(tab.id)}
        className={`
          flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all
          ${isActive
            ? isDarkMode
              ? 'bg-white/10 text-white shadow-sm'
              : 'bg-white text-gray-900 shadow-sm'
            : isDarkMode
              ? 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
          }
        `}
        title={tab.label}
      >
        <Icon className={`w-3.5 h-3.5 ${isActive ? tab.color : ''}`} />
        <span className="hidden sm:inline">{tab.shortLabel}</span>
      </button>
    );
  };

  return (
    <div
      className={`
        flex items-center gap-1 px-2 py-1.5 rounded-xl border
        ${isDarkMode ? 'bg-gray-900/50 border-gray-800' : 'bg-gray-50 border-gray-200'}
      `}
    >
      {/* Main Views */}
      <div className="flex items-center gap-0.5">
        {mainTabs.map(renderTab)}
      </div>

      {/* Separator */}
      <div className={`w-px h-5 mx-1 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-300'}`} />

      {/* Focus Views */}
      <div className="flex items-center gap-0.5">
        {focusTabs.map(renderTab)}
      </div>
    </div>
  );
};
