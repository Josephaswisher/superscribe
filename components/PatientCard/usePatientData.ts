import { useMemo } from 'react';
import { CRITICAL_LAB_REGEX, extractClinicalKeywords, STATUS_KEYWORDS } from '../../utils/documentUtils';

export interface PatientVitals {
  text: string;
  bp?: string;
  hr?: string;
  temp?: string;
  o2?: string;
}

export interface PatientData {
  patientName: string;
  patientRoom: string;
  age: string;
  admitReason: string;
  statusBadges: string[];
  clinicalKeywords: string[];
  problems: string[];
  summarySnippet: string;
  dispo: string;
  vitals: PatientVitals | null;
  criticalLabs: string[];
  tasks: {
    total: number;
    completed: number;
    progress: number;
  };
}

export function usePatientData(header: string, lines: string[]): PatientData {
  // Extract name and room from header
  const { patientName, patientRoom } = useMemo(() => {
    const rawHeader = header.replace(/^###\s*(\d+\.\s*)?/, '');
    const separatorMatch = rawHeader.match(/\s[–-]\s/);
    let name = rawHeader;
    let room = '';

    if (separatorMatch?.index) {
      const potentialRoom = rawHeader.substring(separatorMatch.index + 3).trim();
      if (potentialRoom.length < 15) {
        name = rawHeader.substring(0, separatorMatch.index).trim();
        room = potentialRoom;
      }
    }
    return { patientName: name, patientRoom: room };
  }, [header]);

  // Extract age
  const age = useMemo(() => {
    const ageLine = lines.find(l => l.match(/\*\*Age:\*\*/i));
    return ageLine ? ageLine.replace(/\*\*Age:\*\*\s*/i, '').trim() : '';
  }, [lines]);

  // Extract admission reason
  const admitReason = useMemo(() => {
    const admitLine = lines.find(l => l.match(/\*\*Admitted( for)?:\*\*/i));
    return admitLine ? admitLine.replace(/\*\*Admitted( for)?:\*\*\s*/i, '').trim() : '';
  }, [lines]);

  // Extract status badges and clinical keywords
  const { statusBadges, clinicalKeywords } = useMemo(() => {
    const badges = STATUS_KEYWORDS.filter(kw =>
      lines.some(l => l.toLowerCase().includes(kw.toLowerCase()))
    );
    const assessmentPlanText = lines
      .filter(l => l.match(/\*\*Assessment:\*\*/i) || l.startsWith('#'))
      .join('\n');
    const keywords = extractClinicalKeywords(assessmentPlanText);
    return { statusBadges: badges, clinicalKeywords: keywords };
  }, [lines]);

  // Extract problems
  const problems = useMemo(() => {
    return lines
      .filter(l => l.trim().startsWith('#'))
      .map(l => {
        let text = l.trim().replace(/^#+/, '');
        if (text.includes(':')) {
          text = text.split(':')[0] ?? text;
        }
        return text.trim();
      })
      .filter(p => p.length > 0 && p.length < 60);
  }, [lines]);

  // Extract summary snippet
  const summarySnippet = useMemo(() => {
    const idx = lines.findIndex(l =>
      l.match(/^(#+ |\*\*)?(Summary|Assessment|TL;DR|Impression)(:)?(\*\*)?/i)
    );
    if (idx === -1) return '';
    let text = lines[idx]
      ?.replace(/^(#+ |\*\*)?(Summary|Assessment|TL;DR|Impression)(:)?(\*\*)?/i, '')
      .trim() ?? '';
    if (!text && lines[idx + 1]) {
      text = lines[idx + 1]?.trim() ?? '';
    }
    return text;
  }, [lines]);

  // Extract disposition
  const dispo = useMemo(() => {
    const idx = lines.findIndex(l => l.match(/^(#+ |\*\*)?Dispo(sition)?(:)?(\*\*)?/i));
    if (idx === -1) return '';
    let text = lines[idx]
      ?.replace(/^(#+ |\*\*)?Dispo(sition)?(:)?(\*\*)?/i, '')
      .trim() ?? '';
    if (!text && lines[idx + 1]) {
      text = lines[idx + 1]?.trim() ?? '';
    }
    return text;
  }, [lines]);

  // Extract vitals
  const vitals = useMemo((): PatientVitals | null => {
    const line = lines.find(
      l =>
        l.match(/^VS:|^\*\*VS:\*\*/i) ||
        l.match(/\bBP:\s*\d+\/\d+/) ||
        l.match(/^T:\s*\d+/)
    );
    if (!line) return null;
    const text = line.replace(/^(\*\*VS:\*\*|VS:)\s*/i, '');
    return {
      text,
      bp: text.match(/BP:?\s*(\d{2,3}\/\d{2,3})/i)?.[1],
      hr: text.match(/HR:?\s*(\d{2,3})/i)?.[1],
      temp: text.match(/[T|Temp]:?\s*(\d{2,3}(\.\d)?)/i)?.[1],
      o2: text.match(/SpO2:?\s*(\d{2,3}%?)/i)?.[1] || text.match(/O2:?\s*(\d{2,3}%?)/i)?.[1],
    };
  }, [lines]);

  // Extract critical labs
  const criticalLabs = useMemo(() => {
    return lines
      .filter(l => l.match(CRITICAL_LAB_REGEX))
      .map(l => {
        const match = l.match(CRITICAL_LAB_REGEX);
        return match ? match[0] : l.slice(0, 20);
      });
  }, [lines]);

  // Calculate task progress
  const tasks = useMemo(() => {
    const taskLines = lines.filter(l => l.includes('- [ ]') || l.includes('- [x]'));
    const total = taskLines.length;
    const completed = taskLines.filter(l => l.includes('- [x]')).length;
    const progress = total > 0 ? (completed / total) * 100 : 0;
    return { total, completed, progress };
  }, [lines]);

  return {
    patientName,
    patientRoom,
    age,
    admitReason,
    statusBadges,
    clinicalKeywords,
    problems,
    summarySnippet,
    dispo,
    vitals,
    criticalLabs,
    tasks,
  };
}
