import React, { createContext, useState, useEffect, useCallback, useMemo } from 'react';
import { ViewMode, UIDensity } from '../types';

interface UISettingsContextType {
  fontSize: number;
  setFontSize: (s: number) => void;
  uiDensity: UIDensity;
  setUiDensity: (d: UIDensity) => void;
  isFluid: boolean;
  setIsFluid: (b: boolean) => void;
  allSectionsCollapsed: boolean | null;
  setAllSectionsCollapsed: (b: boolean | null) => void;
  showSearch: boolean;
  toggleSearch: (forceState?: boolean) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  viewMode: ViewMode;
  setViewMode: (v: ViewMode) => void;
  onCollapseAll: () => void;
  onExpandAll: () => void;
  isTemplateModalOpen: boolean;
  setIsTemplateModalOpen: (b: boolean) => void;
  isHandoffModalOpen: boolean;
  setIsHandoffModalOpen: (b: boolean) => void;
  isDocumentManagerOpen: boolean;
  setIsDocumentManagerOpen: (b: boolean) => void;
  isCommandPaletteOpen: boolean;
  setIsCommandPaletteOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isMacroManagerOpen: boolean;
  setIsMacroManagerOpen: (b: boolean) => void;
  isScratchpadOpen: boolean;
  setIsScratchpadOpen: (b: boolean) => void;
  isOriginalSignoutOpen: boolean;
  setIsOriginalSignoutOpen: (b: boolean) => void;
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  prefillChat: string;
  setPrefillChat: (s: string) => void;
  isZenMode: boolean;
  toggleZenMode: () => void;
}

export const UISettingsContext = createContext<UISettingsContextType>(null!);

export const UISettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Persisted State
  const [viewMode, setViewMode] = useState<ViewMode>(
    () => (localStorage.getItem('superscribe_viewMode') as ViewMode) || 'document'
  );
  const [uiDensity, setUiDensity] = useState<UIDensity>(
    () => (localStorage.getItem('superscribe_uiDensity') as UIDensity) || 'normal'
  );

  // Non-persisted UI states
  const [fontSize, setFontSize] = useState(14);
  const [isFluid, setIsFluid] = useState(false);
  const [allSectionsCollapsed, setAllSectionsCollapsed] = useState<boolean | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [isHandoffModalOpen, setIsHandoffModalOpen] = useState(false);
  const [isDocumentManagerOpen, setIsDocumentManagerOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isMacroManagerOpen, setIsMacroManagerOpen] = useState(false);
  const [isScratchpadOpen, setIsScratchpadOpen] = useState(false);
  const [isOriginalSignoutOpen, setIsOriginalSignoutOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [prefillChat, setPrefillChat] = useState('');
  const [isZenMode, setIsZenMode] = useState(false);

  // Persistence Effects
  useEffect(() => {
    localStorage.setItem('superscribe_viewMode', viewMode);
    localStorage.setItem('superscribe_uiDensity', uiDensity);
  }, [viewMode, uiDensity]);

  const toggleSearch = useCallback((forceState?: boolean) => {
    setShowSearch(prev => (forceState !== undefined ? forceState : !prev));
    if (forceState === false) setSearchQuery(''); // Clear query when closing search
  }, []);

  const onCollapseAll = useCallback(() => {
    setAllSectionsCollapsed(true);
  }, []);

  const onExpandAll = useCallback(() => {
    setAllSectionsCollapsed(false);
    // Reset to null after a short delay to allow the UI to update
    setTimeout(() => setAllSectionsCollapsed(null), 100);
  }, []);

  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen(prev => !prev);
  }, []);

  const toggleZenMode = useCallback(() => {
    setIsZenMode(prev => {
      // If entering Zen Mode, ensure sidebar is closed
      if (!prev) setIsSidebarOpen(false);
      // If exiting Zen Mode, restore sidebar
      else setIsSidebarOpen(true);
      return !prev;
    });
  }, []);

  const value = useMemo(
    () => ({
      fontSize,
      setFontSize,
      uiDensity,
      setUiDensity,
      isFluid,
      setIsFluid,
      allSectionsCollapsed,
      setAllSectionsCollapsed,
      showSearch,
      toggleSearch,
      searchQuery,
      setSearchQuery,
      viewMode,
      setViewMode,
      onCollapseAll,
      onExpandAll,
      isTemplateModalOpen,
      setIsTemplateModalOpen,
      isHandoffModalOpen,
      setIsHandoffModalOpen,
      isDocumentManagerOpen,
      setIsDocumentManagerOpen,
      isCommandPaletteOpen,
      setIsCommandPaletteOpen,
      isMacroManagerOpen,
      setIsMacroManagerOpen,
      isScratchpadOpen,
      setIsScratchpadOpen,
      isOriginalSignoutOpen,
      setIsOriginalSignoutOpen,
      isSidebarOpen,
      toggleSidebar,
      prefillChat,
      setPrefillChat,
      isZenMode,
      toggleZenMode,
    }),
    [
      fontSize,
      uiDensity,
      isFluid,
      allSectionsCollapsed,
      showSearch,
      searchQuery,
      viewMode,
      isTemplateModalOpen,
      isHandoffModalOpen,
      isDocumentManagerOpen,
      isCommandPaletteOpen,
      isMacroManagerOpen,
      isScratchpadOpen,
      isOriginalSignoutOpen,
      isSidebarOpen,
      toggleSearch,
      onCollapseAll,
      onExpandAll,
      toggleSidebar,
      prefillChat,
      isZenMode,
      toggleZenMode,
    ]
  );

  return <UISettingsContext.Provider value={value}>{children}</UISettingsContext.Provider>;
};
