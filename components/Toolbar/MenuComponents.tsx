import { useRef, useEffect, useContext } from 'react';
import { ChevronRight, Check, Loader2 } from 'lucide-react';
import { ThemeContext } from '../../contexts/ThemeContext';

// Menu Button
interface MenuButtonProps {
  label: string;
  isOpen: boolean;
  onClick: () => void;
  onMouseEnter: () => void;
}

export function MenuButton({ label, isOpen, onClick, onMouseEnter }: MenuButtonProps) {
  const { isDarkMode } = useContext(ThemeContext);

  return (
    <button
      onMouseDown={e => e.stopPropagation()}
      onClick={e => {
        e.stopPropagation();
        onClick();
      }}
      onMouseEnter={onMouseEnter}
      className={`
        px-3 py-1.5 text-sm select-none rounded-md transition-colors
        ${
          isOpen
            ? isDarkMode
              ? 'bg-white/10 text-white'
              : 'bg-gray-200 text-gray-900'
            : isDarkMode
              ? 'text-gray-300 hover:bg-white/5 hover:text-white'
              : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
        }
      `}
    >
      {label}
    </button>
  );
}

// Menu Dropdown
interface MenuDropdownProps {
  children: React.ReactNode;
  onClose: () => void;
}

export function MenuDropdown({ children, onClose }: MenuDropdownProps) {
  const { isDarkMode } = useContext(ThemeContext);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className={`
        absolute top-full left-0 mt-1 min-w-[240px] py-1.5 rounded-lg shadow-xl border z-50
        animate-in fade-in slide-in-from-top-1 duration-100
        ${
          isDarkMode
            ? 'bg-[#1e1e1e] border-gray-700 shadow-black/50'
            : 'bg-white border-gray-200 shadow-xl'
        }
      `}
      onClick={e => e.stopPropagation()}
    >
      {children}
    </div>
  );
}

// Menu Item
interface MenuItemProps {
  icon?: React.ElementType;
  label: string;
  shortcut?: string;
  onClick: () => void;
  isActive?: boolean;
  isDestructive?: boolean;
  hasSubmenu?: boolean;
  isLoading?: boolean;
  isDisabled?: boolean;
}

export function MenuItem({
  icon: Icon,
  label,
  shortcut,
  onClick,
  isActive,
  isDestructive,
  hasSubmenu,
  isLoading,
  isDisabled,
}: MenuItemProps) {
  const { isDarkMode } = useContext(ThemeContext);
  const FinalIcon = isLoading ? Loader2 : Icon;

  return (
    <button
      onClick={() => !isDisabled && !isLoading && onClick()}
      disabled={isDisabled || isLoading}
      className={`
        w-full px-3 py-1.5 text-left flex items-center gap-3 text-xs group
        ${
          isActive
            ? isDarkMode
              ? 'bg-[#d97757]/20 text-[#d97757]'
              : 'bg-orange-50 text-[#d97757]'
            : isDarkMode
              ? 'hover:bg-white/10 text-gray-200'
              : 'hover:bg-blue-50 text-gray-800'
        }
        ${isDestructive ? 'text-red-500 hover:text-red-600' : ''}
        ${isDisabled || isLoading ? 'opacity-50 cursor-not-allowed' : ''}
      `}
    >
      <div
        className={`w-4 h-4 flex items-center justify-center ${
          isActive ? 'opacity-100' : 'opacity-50 group-hover:opacity-100'
        }`}
      >
        {FinalIcon && <FinalIcon className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />}
      </div>
      <span className="flex-1 font-medium">{label}</span>
      {shortcut && <span className="text-[10px] opacity-40">{shortcut}</span>}
      {hasSubmenu && <ChevronRight className="w-3 h-3 opacity-40" />}
      {isActive && <Check className="w-3 h-3 ml-2" />}
    </button>
  );
}

// Menu Divider
export function MenuDivider() {
  const { isDarkMode } = useContext(ThemeContext);
  return <div className={`h-px my-1.5 mx-3 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />;
}

// Menu Header
interface MenuHeaderProps {
  label: string;
}

export function MenuHeader({ label }: MenuHeaderProps) {
  const { isDarkMode } = useContext(ThemeContext);
  return (
    <div
      className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider opacity-50 ${
        isDarkMode ? 'text-gray-400' : 'text-gray-600'
      }`}
    >
      {label}
    </div>
  );
}
