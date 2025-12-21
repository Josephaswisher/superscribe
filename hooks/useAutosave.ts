import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook to autosave text content to localStorage.
 * Triggers on:
 * 1. Inactivity (debounce)
 * 2. Fixed interval (every 30s)
 */
export const useAutosave = (
  value: string, 
  key: string, 
  enabled: boolean = true, 
  debounceMs: number = 2000, 
  intervalMs: number = 30000
) => {
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  
  // Ref to track the last saved value to prevent unnecessary writes
  const lastSavedValue = useRef<string | null>(null);

  // Initialize lastSavedValue only once
  useEffect(() => {
      if (lastSavedValue.current === null) {
          lastSavedValue.current = localStorage.getItem(key) || value;
      }
  }, [key, value]);

  const save = useCallback(() => {
    if (lastSavedValue.current !== value) {
      setSaveStatus('saving');
      localStorage.setItem(key, value);
      lastSavedValue.current = value;
      
      // Artificial delay for "Saving..." UI flicker
      setTimeout(() => setSaveStatus('saved'), 800);
    }
  }, [value, key]);

  // Debounce Effect (Inactivity)
  useEffect(() => {
    if (!enabled || value === lastSavedValue.current) return;

    setSaveStatus('unsaved');
    const handler = setTimeout(save, debounceMs);

    return () => clearTimeout(handler);
  }, [value, save, enabled, debounceMs]);

  // Interval Effect (Periodic)
  useEffect(() => {
    if (!enabled) return;

    const handler = setInterval(() => {
        if (value !== lastSavedValue.current) {
            save();
        }
    }, intervalMs);

    return () => clearInterval(handler);
  }, [save, enabled, intervalMs, value]);

  return saveStatus;
};
