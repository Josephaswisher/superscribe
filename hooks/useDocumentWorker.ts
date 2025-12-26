/**
 * Hook for using the document parser web worker
 */
import { useEffect, useRef, useCallback, useState } from 'react';

interface ParsedSection {
  header: string;
  lines: string[];
}

type WorkerCallback = (result: ParsedSection[]) => void;

let workerInstance: Worker | null = null;
let pendingCallbacks: Map<string, WorkerCallback> = new Map();
let messageId = 0;

function getWorker(): Worker | null {
  if (typeof Worker === 'undefined') return null;
  
  if (!workerInstance) {
    try {
      workerInstance = new Worker(
        new URL('../workers/documentParser.worker.ts', import.meta.url),
        { type: 'module' }
      );
      
      workerInstance.onmessage = (event) => {
        const { type, id, result } = event.data;
        if (type === 'PARSE_RESULT') {
          const callback = pendingCallbacks.get(id);
          if (callback) {
            callback(result);
            pendingCallbacks.delete(id);
          }
        }
      };
      
      workerInstance.onerror = (error) => {
        console.error('Document worker error:', error);
      };
    } catch (e) {
      console.warn('Web Worker not supported, falling back to main thread');
      return null;
    }
  }
  
  return workerInstance;
}

export function useDocumentWorker() {
  const [isWorkerReady, setIsWorkerReady] = useState(false);
  
  useEffect(() => {
    const worker = getWorker();
    setIsWorkerReady(!!worker);
  }, []);

  const parseAsync = useCallback((content: string): Promise<ParsedSection[]> => {
    return new Promise((resolve) => {
      const worker = getWorker();
      
      if (!worker) {
        // Fallback to sync parsing on main thread
        const sections = parseRawContentSync(content);
        resolve(sections);
        return;
      }
      
      const id = `parse-${++messageId}`;
      pendingCallbacks.set(id, resolve);
      worker.postMessage({ type: 'PARSE_DOCUMENT', payload: { content }, id });
    });
  }, []);

  return { parseAsync, isWorkerReady };
}

// Sync fallback
function parseRawContentSync(raw: string): ParsedSection[] {
  const sections: ParsedSection[] = [];
  const lines = raw.split('\n');
  let currentHeader = '### Preamble';
  let currentLines: string[] = [];

  for (const line of lines) {
    if (line.startsWith('### ')) {
      if (currentLines.length > 0 || currentHeader !== '### Preamble') {
        sections.push({ header: currentHeader, lines: currentLines });
      }
      currentHeader = line;
      currentLines = [];
    } else {
      currentLines.push(line);
    }
  }

  if (currentLines.length > 0 || currentHeader !== '### Preamble') {
    sections.push({ header: currentHeader, lines: currentLines });
  }

  return sections;
}
