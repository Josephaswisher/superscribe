import { useContext } from 'react';
import { Edit3, Sparkles, Search, ArrowDownAZ, Calendar, Command, Settings } from 'lucide-react';
import { MenuDropdown, MenuItem, MenuDivider, MenuHeader } from './MenuComponents';
import { UISettingsContext } from '../../contexts/UISettingsContext';
import { DocumentContext } from '../../contexts/DocumentContext';

interface EditMenuProps {
  onClose: () => void;
}

export function EditMenu({ onClose }: EditMenuProps) {
  const { toggleSearch, setIsTemplateModalOpen, setIsMacroManagerOpen } = useContext(UISettingsContext);
  const { isEditing, toggleEdit, isProofreading, handleProofread, onSort } = useContext(DocumentContext);

  return (
    <MenuDropdown onClose={onClose}>
      <MenuItem
        icon={Edit3}
        label={isEditing ? 'Finish Editing' : 'Enable Edit Mode'}
        onClick={() => {
          toggleEdit();
          onClose();
        }}
        isActive={isEditing}
      />
      <MenuItem
        icon={Sparkles}
        label={isProofreading ? 'Proofreading...' : 'Proofread with Pro'}
        onClick={() => {
          handleProofread();
          onClose();
        }}
        isLoading={isProofreading}
      />
      <MenuItem
        icon={Search}
        label="Find..."
        onClick={() => {
          toggleSearch(true);
          onClose();
        }}
        shortcut="Ctrl+F"
      />
      <MenuDivider />
      <MenuHeader label="Sort" />
      <MenuItem
        icon={ArrowDownAZ}
        label="Sort by Name (A-Z)"
        onClick={() => {
          onSort('name');
          onClose();
        }}
      />
      <MenuItem
        icon={Calendar}
        label="Sort by Admission Date"
        onClick={() => {
          onSort('date');
          onClose();
        }}
      />
      <MenuDivider />
      <MenuItem
        icon={Command}
        label="Custom Macros..."
        onClick={() => {
          setIsMacroManagerOpen(true);
          onClose();
        }}
      />
      <MenuItem
        icon={Settings}
        label="Template Settings"
        onClick={() => {
          setIsTemplateModalOpen(true);
          onClose();
        }}
      />
    </MenuDropdown>
  );
}
