import { useState, useContext } from 'react';
import {
  Sun,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronRight,
  History,
  FolderOpen,
} from 'lucide-react';
import { ThemeContext } from '../../contexts/ThemeContext';
import { UISettingsContext } from '../../contexts/UISettingsContext';
import { DocumentContext } from '../../contexts/DocumentContext';
import { MenuButton } from './MenuComponents';
import { FileMenu } from './FileMenu';
import { EditMenu } from './EditMenu';
import { ViewMenu } from './ViewMenu';

type MenuType = 'file' | 'edit' | 'view' | null;

export function DocumentToolbar() {
  const { isDarkMode, toggleTheme } = useContext(ThemeContext);
  const { isSidebarOpen, toggleSidebar, setIsDocumentManagerOpen } = useContext(UISettingsContext);
  const { activeTemplate, showHistory, onToggleHistory, documents, activeDocumentId } =
    useContext(DocumentContext);

  const [activeMenu, setActiveMenu] = useState<MenuType>(null);

  const activeDocName = documents.find(d => d.id === activeDocumentId)?.name || 'Patient List';

  const closeMenu = () => setActiveMenu(null);

  const toggleMenu = (menu: MenuType) => {
    setActiveMenu(activeMenu === menu ? null : menu);
  };

  const handleMenuHover = (menu: MenuType) => {
    if (activeMenu) {
      setActiveMenu(menu);
    }
  };

  return (
    <div
      className={`h-10 border-b flex items-center justify-between px-4 shrink-0 relative z-20 select-none transition-colors duration-300
        ${isDarkMode ? 'bg-[#151515] border-white/5' : 'bg-[#f3f3f3] border-gray-200'}
      `}
    >
      {/* Left: Menu Bar */}
      <div className="flex items-center gap-1">
        <button
          onClick={toggleSidebar}
          className={`mr-3 p-1.5 rounded-md transition-colors ${
            isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-black'
          }`}
          title="Toggle Sidebar"
        >
          {isSidebarOpen ? (
            <PanelLeftClose className="w-4 h-4" />
          ) : (
            <PanelLeftOpen className="w-4 h-4" />
          )}
        </button>

        <button
          onClick={() => setIsDocumentManagerOpen(true)}
          className={`flex items-center gap-2 mr-3 px-2 py-1.5 rounded-md transition-colors ${
            isDarkMode
              ? 'text-gray-300 hover:bg-white/10'
              : 'text-gray-700 hover:bg-gray-200'
          }`}
          title="Manage Lists"
        >
          <FolderOpen className="w-4 h-4 text-[#d97757]" />
          <span className="text-sm font-semibold max-w-[150px] truncate">{activeDocName}</span>
          <ChevronRight className="w-3 h-3 opacity-50 rotate-90" />
        </button>

        <div className={`h-4 w-px mx-1 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-300'}`} />

        {/* File Menu */}
        <div className="relative">
          <MenuButton
            label="File"
            isOpen={activeMenu === 'file'}
            onClick={() => toggleMenu('file')}
            onMouseEnter={() => handleMenuHover('file')}
          />
          {activeMenu === 'file' && <FileMenu onClose={closeMenu} />}
        </div>

        {/* Edit Menu */}
        <div className="relative">
          <MenuButton
            label="Edit"
            isOpen={activeMenu === 'edit'}
            onClick={() => toggleMenu('edit')}
            onMouseEnter={() => handleMenuHover('edit')}
          />
          {activeMenu === 'edit' && <EditMenu onClose={closeMenu} />}
        </div>

        {/* View Menu */}
        <div className="relative">
          <MenuButton
            label="View"
            isOpen={activeMenu === 'view'}
            onClick={() => toggleMenu('view')}
            onMouseEnter={() => handleMenuHover('view')}
          />
          {activeMenu === 'view' && <ViewMenu onClose={closeMenu} />}
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => onToggleHistory()}
          className={`p-1.5 rounded-md transition-colors ${
            showHistory
              ? isDarkMode
                ? 'bg-[#d97757]/20 text-[#d97757]'
                : 'bg-orange-100 text-[#d97757]'
              : isDarkMode
                ? 'hover:bg-blue-500/20 text-gray-400 hover:text-blue-400'
                : 'hover:bg-blue-500/20 text-gray-400 hover:text-blue-600'
          }`}
          title="Version History"
        >
          <History className="w-4 h-4" />
        </button>

        <div
          className={`flex items-center gap-2 px-2 py-1 rounded text-xs ${
            isDarkMode ? 'text-gray-500' : 'text-gray-400'
          }`}
        >
          <span className="hidden xl:inline">Template:</span>
          <span className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            {activeTemplate?.name}
          </span>
        </div>

        <button
          onClick={toggleTheme}
          className={`p-1.5 rounded-md transition-colors ${
            isDarkMode
              ? 'hover:bg-yellow-500/20 text-gray-400 hover:text-yellow-400'
              : 'hover:bg-indigo-500/20 text-gray-400 hover:text-indigo-600'
          }`}
          title="Toggle Theme"
        >
          {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

// Re-export for backward compatibility
export { DocumentToolbar as default };
