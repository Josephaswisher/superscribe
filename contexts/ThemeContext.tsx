import React, { createContext, useState, useEffect, useCallback, useMemo } from 'react';

interface ThemeContextType {
  isDarkMode: boolean;
  toggleTheme: () => void;
}

export const ThemeContext = createContext<ThemeContextType>(null!);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    // Initialize from localStorage or default to true (dark)
    const savedTheme = localStorage.getItem('superscribe_darkMode');
    return savedTheme ? JSON.parse(savedTheme) : true;
  });

  useEffect(() => {
    localStorage.setItem('superscribe_darkMode', JSON.stringify(isDarkMode));
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      document.body.classList.add('bg-gray-900', 'text-gray-100');
      document.body.classList.remove('bg-gray-100', 'text-gray-900');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('bg-gray-900', 'text-gray-100');
      document.body.classList.add('bg-gray-100', 'text-gray-900');
    }
  }, [isDarkMode]);

  const toggleTheme = useCallback(() => {
    setIsDarkMode(prevMode => !prevMode);
  }, []);

  const value = useMemo(() => ({
    isDarkMode,
    toggleTheme,
  }), [isDarkMode, toggleTheme]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};