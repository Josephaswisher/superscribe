import React, { createContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  type AIProvider,
  type AIModelConfig,
  AI_MODELS,
  getAvailableModels,
  getDefaultModel,
} from '../services/aiService';

interface ModelContextType {
  selectedModel: AIProvider;
  setSelectedModel: (model: AIProvider) => void;
  availableModels: AIModelConfig[];
  currentModelConfig: AIModelConfig | undefined;
  isSettingsOpen: boolean;
  setIsSettingsOpen: (open: boolean) => void;
}

export const ModelContext = createContext<ModelContextType>(null!);

const STORAGE_KEY = 'superscribe_selectedModel';

export const ModelProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load persisted model preference or use default
  const [selectedModel, setSelectedModelState] = useState<AIProvider>(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as AIProvider | null;
    if (stored && AI_MODELS.some(m => m.id === stored)) {
      return stored;
    }
    return getDefaultModel();
  });

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Get available models (those with configured API keys)
  const availableModels = useMemo(() => getAvailableModels(), []);

  // Get current model config
  const currentModelConfig = useMemo(
    () => AI_MODELS.find(m => m.id === selectedModel),
    [selectedModel]
  );

  // Persist model selection
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, selectedModel);
  }, [selectedModel]);

  // Wrapper to validate model selection
  const setSelectedModel = useCallback((model: AIProvider) => {
    if (AI_MODELS.some(m => m.id === model)) {
      setSelectedModelState(model);
    } else {
      console.warn(`Invalid model selection: ${model}`);
    }
  }, []);

  const value = useMemo(
    () => ({
      selectedModel,
      setSelectedModel,
      availableModels,
      currentModelConfig,
      isSettingsOpen,
      setIsSettingsOpen,
    }),
    [selectedModel, setSelectedModel, availableModels, currentModelConfig, isSettingsOpen]
  );

  return <ModelContext.Provider value={value}>{children}</ModelContext.Provider>;
};

// Custom hook for easy access
export const useModel = () => {
  const context = React.useContext(ModelContext);
  if (!context) {
    throw new Error('useModel must be used within a ModelProvider');
  }
  return context;
};
