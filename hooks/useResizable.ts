import { useState, useRef, useEffect, useCallback } from 'react';

export const useResizable = (initialWidthPercent: number = 45, minWidth: number = 20, maxWidth: number = 80) => {
  const [width, setWidth] = useState(initialWidthPercent);
  const isResizing = useRef(false);

  const startResizing = useCallback(() => {
    isResizing.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, []);

  const stopResizing = useCallback(() => {
    isResizing.current = false;
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }, []);

  const resize = useCallback((e: MouseEvent) => {
    if (isResizing.current) {
      const newWidth = (e.clientX / window.innerWidth) * 100;
      if (newWidth > minWidth && newWidth < maxWidth) {
        setWidth(newWidth);
      }
    }
  }, [minWidth, maxWidth]);

  useEffect(() => {
    window.addEventListener('mousemove', resize);
    window.addEventListener('mouseup', stopResizing);
    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    };
  }, [resize, stopResizing]);

  return { width, startResizing };
};
