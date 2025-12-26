/**
 * Web Worker for document parsing - offloads heavy parsing from main thread
 */

interface ParsedSection {
  header: string;
  lines: string[];
}

function parseRawContent(raw: string): ParsedSection[] {
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

// Handle messages from main thread
self.onmessage = (event: MessageEvent) => {
  const { type, payload, id } = event.data;

  switch (type) {
    case 'PARSE_DOCUMENT': {
      const result = parseRawContent(payload.content);
      self.postMessage({ type: 'PARSE_RESULT', id, result });
      break;
    }

    case 'EXTRACT_KEYWORDS': {
      const keywords = extractKeywords(payload.content);
      self.postMessage({ type: 'KEYWORDS_RESULT', id, result: keywords });
      break;
    }

    default:
      console.warn('Unknown worker message type:', type);
  }
};

function extractKeywords(content: string): string[] {
  const keywords: string[] = [];
  const patterns = [
    /\b(sepsis|pneumonia|uti|chf|copd|aki|ckd|dm|htn|cad|afib|dvt|pe)\b/gi,
    /\b(critical|unstable|deteriorating|improving|stable)\b/gi,
  ];

  for (const pattern of patterns) {
    const matches = content.match(pattern);
    if (matches) {
      keywords.push(...matches.map(m => m.toLowerCase()));
    }
  }

  return [...new Set(keywords)];
}

export {};
