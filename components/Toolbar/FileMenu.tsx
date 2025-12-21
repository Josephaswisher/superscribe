import { useContext } from 'react';
import { UserPlus, FileOutput, ClipboardType, ClipboardCopy, Printer } from 'lucide-react';
import { MenuDropdown, MenuItem, MenuDivider } from './MenuComponents';
import { UISettingsContext } from '../../contexts/UISettingsContext';
import { DocumentContext } from '../../contexts/DocumentContext';
import { cleanTextForEMR } from '../../utils/documentUtils';

interface FileMenuProps {
  onClose: () => void;
}

export function FileMenu({ onClose }: FileMenuProps) {
  const { setIsHandoffModalOpen } = useContext(UISettingsContext);
  const { currentContent, onAddPatient, onCopyAll } = useContext(DocumentContext);

  const handleEmrCopy = () => {
    const cleanText = cleanTextForEMR(currentContent);
    navigator.clipboard.writeText(cleanText);
    onClose();
  };

  const handlePrint = () => {
    window.print();
    onClose();
  };

  return (
    <MenuDropdown onClose={onClose}>
      <MenuItem
        icon={UserPlus}
        label="New Patient Entry"
        onClick={() => {
          onAddPatient();
          onClose();
        }}
      />
      <MenuDivider />
      <MenuItem
        icon={FileOutput}
        label="Generate Handoff"
        onClick={() => {
          setIsHandoffModalOpen(true);
          onClose();
        }}
      />
      <MenuDivider />
      <MenuItem
        icon={ClipboardType}
        label="Copy Plain Text (EMR)"
        onClick={handleEmrCopy}
        shortcut="Safe"
      />
      <MenuItem
        icon={ClipboardCopy}
        label="Copy All Markdown"
        onClick={() => {
          onCopyAll();
          onClose();
        }}
        shortcut="Raw"
      />
      <MenuDivider />
      <MenuItem icon={Printer} label="Print" onClick={handlePrint} shortcut="Ctrl+P" />
    </MenuDropdown>
  );
}
