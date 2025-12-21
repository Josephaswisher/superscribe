import { useContext } from 'react';
import {
  Command,
  LayoutGrid,
  FileText,
  LayoutDashboard,
  FileOutput,
  AlertTriangle,
  ListTodo,
  TestTube2,
  Pill,
  Minimize,
  Layout,
  Maximize,
  ChevronsUp,
  ChevronsDown,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { MenuDropdown, MenuItem, MenuDivider, MenuHeader } from './MenuComponents';
import { ThemeContext } from '../../contexts/ThemeContext';
import { UISettingsContext } from '../../contexts/UISettingsContext';

interface ViewMenuProps {
  onClose: () => void;
}

export function ViewMenu({ onClose }: ViewMenuProps) {
  const { isDarkMode } = useContext(ThemeContext);
  const {
    fontSize,
    setFontSize,
    viewMode,
    setViewMode,
    uiDensity,
    setUiDensity,
    onCollapseAll,
    onExpandAll,
    setIsCommandPaletteOpen,
  } = useContext(UISettingsContext);

  return (
    <MenuDropdown onClose={onClose}>
      <MenuItem
        icon={Command}
        label="Command Palette..."
        onClick={() => {
          setIsCommandPaletteOpen(true);
          onClose();
        }}
        shortcut="Ctrl+K"
      />
      <MenuDivider />

      <MenuHeader label="Display Mode" />
      <MenuItem
        icon={LayoutGrid}
        label="Card View"
        onClick={() => {
          setViewMode('cards');
          onClose();
        }}
        isActive={viewMode === 'cards'}
      />
      <MenuItem
        icon={FileText}
        label="Document View"
        onClick={() => {
          setViewMode('document');
          onClose();
        }}
        isActive={viewMode === 'document'}
      />
      <MenuItem
        icon={LayoutDashboard}
        label="Dashboard View"
        onClick={() => {
          setViewMode('dashboard');
          onClose();
        }}
        isActive={viewMode === 'dashboard'}
      />
      <MenuItem
        icon={FileOutput}
        label="Handoff View"
        onClick={() => {
          setViewMode('handoff');
          onClose();
        }}
        isActive={viewMode === 'handoff'}
      />

      <MenuDivider />
      <MenuHeader label="Focus Views" />
      <MenuItem
        icon={AlertTriangle}
        label="Critical Alerts"
        onClick={() => {
          setViewMode('critical');
          onClose();
        }}
        isActive={viewMode === 'critical'}
      />
      <MenuItem
        icon={ListTodo}
        label="Plan-Only"
        onClick={() => {
          setViewMode('plan');
          onClose();
        }}
        isActive={viewMode === 'plan'}
      />
      <MenuItem
        icon={TestTube2}
        label="Labs-Only"
        onClick={() => {
          setViewMode('labs');
          onClose();
        }}
        isActive={viewMode === 'labs'}
      />
      <MenuItem
        icon={Pill}
        label="Medication-Only"
        onClick={() => {
          setViewMode('meds');
          onClose();
        }}
        isActive={viewMode === 'meds'}
      />

      <MenuDivider />
      <MenuHeader label="UI Density" />
      <MenuItem
        icon={Minimize}
        label="Compact"
        onClick={() => {
          setUiDensity('compact');
          onClose();
        }}
        isActive={uiDensity === 'compact'}
      />
      <MenuItem
        icon={Layout}
        label="Normal"
        onClick={() => {
          setUiDensity('normal');
          onClose();
        }}
        isActive={uiDensity === 'normal'}
      />
      <MenuItem
        icon={Maximize}
        label="Spacious"
        onClick={() => {
          setUiDensity('spacious');
          onClose();
        }}
        isActive={uiDensity === 'spacious'}
      />

      <MenuDivider />
      <MenuHeader label="Sections" />
      <MenuItem
        icon={ChevronsUp}
        label="Expand All"
        onClick={() => {
          onExpandAll();
          onClose();
        }}
      />
      <MenuItem
        icon={ChevronsDown}
        label="Collapse All"
        onClick={() => {
          onCollapseAll();
          onClose();
        }}
      />

      <MenuDivider />
      <div className="flex items-center px-3 py-1 gap-2">
        <button
          onClick={() => setFontSize(Math.max(10, fontSize - 1))}
          className={`p-1 rounded hover:bg-gray-500/20 ${isDarkMode ? 'text-white' : 'text-black'}`}
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <span
          className={`text-xs font-mono w-8 text-center ${
            isDarkMode ? 'text-gray-400' : 'text-gray-600'
          }`}
        >
          {fontSize}px
        </span>
        <button
          onClick={() => setFontSize(Math.min(24, fontSize + 1))}
          className={`p-1 rounded hover:bg-gray-500/20 ${isDarkMode ? 'text-white' : 'text-black'}`}
        >
          <ZoomIn className="w-4 h-4" />
        </button>
      </div>
    </MenuDropdown>
  );
}
