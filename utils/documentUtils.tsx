import { DashboardPatient, ExtractedPlan } from '../types';

export const CRITICAL_LAB_REGEX =
  /\b(K|Potassium)\s*[:-]?\s*(?:[0-2]\.\d|[0-2]|(?:5\.[6-9]|[6-9]\d*\.?\d*)|(?:[6-9]\.?\d*))\b|\b(Na|Sodium)\s*[:-]?\s*(?:(?:1[0-1]\d|[0-9]\d)\.\d*|1[0-9]\d\.\d*|(?:15[1-9]|1[6-9]\d|[2-9]\d{2,})\.\d*)\b|\b(Hgb|Hemoglobin)\s*[:-]?\s*(?:[0-6]\.\d|[0-6])\b|\b(Lactate)\s*[:-]?\s*(?:[4-9]\.\d|[4-9]|\d{2,}\.?\d*)\b|\b(INR)\s*[:-]?\s*(?:[5-9]\.\d|[5-9]|\d{2,}\.?\d*)\b|\b(pH)\s*[:-]?\s*(?:[0-6]\.\d|7\.[0-2]\d)\b/gi;
export const VITALS_REGEX =
  /\b(T: ?\d{2,3}(\.\d)?°?C?|BP: ?\d{2,3}\/\d{2,3}|HR: ?\d{2,3}|RR: ?\d{1,2}|SpO2: ?\d{2,3}%?)/gi;
export const MEDS_REGEX =
  /\b\d+(\.\d+)?\s*(mg|mcg|g|units|L|ml)\b|\b(PO|IV|IM|SC|BID|TID|Q\d+H|PRN)\b/gi;
export const LABS_REGEX =
  /\b(WBC|Hgb|Hct|Plt|Na|K|Cl|HCO3|BUN|Cr|Glu|Ca|Mg|Phos|AST|ALT|Alk Phos|T Bili|Albumin|Troponin|BNP|Lactate|INR|PTT|ABG|pH)\b/gi;
export const STATUS_KEYWORDS = ['Discharge', 'DNR', 'DNI', 'Full Code', 'Comfort Care', 'Hospice'];
export const TREND_INDICATOR_REGEX = /[↗↘↔]/g;
export const RISK_CALCULATOR_REGEX = /\b(HEART|TIMI|CHA2DS2-VASc|HAS-BLED)\s*Score:\s*\d+\b/gi;

export const CLINICAL_PROBLEM_KEYWORDS = [
  'Sepsis',
  'AKI',
  'CHF exacerbation',
  'Pneumonia',
  'UTI',
  'Diverticulitis',
  'ACS',
  'STEMI',
  'NSTEMI',
  'PE',
  'DVT',
  'GI Bleed',
  'CVA',
  'TIA',
  'Hyperkalemia',
  'Hyponatremia',
  'Anemia',
  'ARDS',
  'COPD exacerbation',
  'Asthma exacerbation',
  'Delirium',
  'Alcohol Withdrawal',
  'Diabetic Ketoacidosis',
  'Hyperglycemia',
  'Hypoglycemia',
  'Hypertension',
  'Hypotension',
  'Atrial Fibrillation',
  'CKD',
  'Cirrhosis',
  'Pancreatitis',
  'Cholecystitis',
  'Appendicitis',
  'SBO',
  'Ileus',
];

export const cleanTextForEMR = (text: string): string => {
  return text
    .replace(/^###\s*/gm, '') // Remove Header Markers
    .replace(/\*\*/g, '') // Remove all Bold markers
    .replace(/__/g, '') // Remove Italic markers
    .replace(/^- \[ \]/gm, '[ ]') // Convert to standard text Checkboxes (no bullet)
    .replace(/^- \[x\]/gm, '[x]') // Convert to standard text Checkboxes (no bullet)
    .replace(/^\s*[*•]\s+/gm, '- ') // Convert bullets to standard hyphens
    .replace(/[•]/g, '-') // Replace inline Unicode bullets with hyphens
    .replace(/[↗↘↔]/g, '') // Remove trend arrows if they cause encoding issues
    .trim();
};

export const getDynamicPreambleHeader = (lines: string[], index?: number): string => {
  let name = '';
  let room = '';
  let age = '';
  let gender = '';

  // Check first 15 lines for identity info
  for (const line of lines.slice(0, 15)) {
    const lower = line.toLowerCase();

    // Skip common section headers that shouldn't be patient names
    if (
      lower.match(
        /^(handoff|census|summary|assessment|plan|history|exam|vitals|labs|imaging|meds|disposition|###)/
      )
    )
      continue;

    // Pattern 1: **Name:** John Doe
    const nameLabelMatch = line.match(
      /(?:Name|Pt|Patient|PT NAME|Patient Name):\s*\*?\*?\s*([^*#\n-]+)/i
    );
    if (nameLabelMatch?.[1] && !name) {
      name = nameLabelMatch[1].trim();
    }

    // Pattern 2: **Room:** 402
    const roomLabelMatch = line.match(/(?:Room|RM|Rm|Bed|Location|Unit):\s*\*?\*?\s*([^*#\n]+)/i);
    if (roomLabelMatch?.[1] && !room) {
      room = roomLabelMatch[1].trim();
    }

    // Pattern 3: Age & Gender (e.g. "65yo M", "65 year old male", "Age: 65, Gender: M")
    const ageMatch = line.match(/(\d{1,3})\s*(?:yo|y\/o|year old|y\.o\.)?\s*(M|F|Male|Female)/i);
    if (ageMatch && !age) {
      age = ageMatch[1] as string;
      gender = (ageMatch[2] as string).substring(0, 1).toUpperCase();
    } else {
      // Try separate age/gender if not together
      const soloAgeMatch = line.match(/(?:Age|AGE):\s*(\d{1,3})/);
      if (soloAgeMatch?.[1] && !age) age = soloAgeMatch[1] as string;
      const soloGenderMatch = line.match(/(?:Sex|Gender|GENDER):\s*(M|F|Male|Female)/i);
      if (soloGenderMatch?.[1] && !gender)
        gender = (soloGenderMatch[1] as string).substring(0, 1).toUpperCase();
    }

    // Pattern 4: Line starts with a name format (e.g. "J. Doe" or "John Doe")
    // and doesn't look like a clinical label
    if (!name && line === lines[0]) {
      const nameFormatMatch = line.match(/^([A-Z]\.?\s[A-Z][a-z]+|[A-Z][a-z]+\s[A-Z][a-z]+)/);
      if (nameFormatMatch?.[0] && !line.includes(':')) {
        name = nameFormatMatch[0];
        // Check if room is on same line: "John Doe - 402"
        const roomOnSameLine = line.match(/[–-]\s*([A-Z0-9]+)$/i);
        if (roomOnSameLine?.[1] && !room) room = roomOnSameLine[1].trim();
      }
    }
  }

  const patientId = index !== undefined ? `${index + 1}. ` : '';

  if (name) {
    // Limit name length for header
    const displayName = name.length > 20 ? name.substring(0, 17) + '...' : name;
    const demographics = age || gender ? ` (${age}${gender})` : '';
    return `### ${patientId}${displayName}${room ? ` — ${room}` : ''}${demographics}`;
  }

  return `### ${patientId}New Patient`;
};

export const parseRawContent = (content: string) => {
  if (!content) return [];
  const sections = content.split(/^### /gm);
  return sections
    .map((section, index) => {
      if (!section.trim()) return null;
      const lines = section.trim().split('\n');

      const isInitialPreamble = index === 0 && !content.startsWith('### ');
      const header = isInitialPreamble ? getDynamicPreambleHeader(lines) : `### ${lines[0]}`;

      const bodyLines = isInitialPreamble ? lines : lines.slice(1);
      return { header, lines: bodyLines };
    })
    .filter(Boolean) as { header: string; lines: string[] }[];
};

export const extractNameFromHeader = (header: string) => {
  const raw = header.replace(/^###\s*(\d+\.\s*)?/, '');

  // Split by room separator first: "Name — Room (AgeSex)"
  const roomParts = raw.split(/[–—-]/);
  const name = (roomParts[0] as string).trim();

  let room = '';
  let age = '';
  let gender = '';

  if (roomParts.length > 1) {
    const rest = (roomParts[1] as string).trim();
    // Pattern: "402-B (65M)"
    const roomDematch = rest.match(/^([^\s(]+)(?:\s*\(([^)]+)\))?/);
    if (roomDematch && roomDematch[1]) {
      room = roomDematch[1].trim();
      const demo = roomDematch[2];
      if (demo) {
        const demoMatch = demo.match(/(\d+)?([MF])?/i);
        if (demoMatch) {
          age = demoMatch[1] || '';
          gender = demoMatch[2]?.toUpperCase() || '';
        }
      }
    } else {
      room = rest;
    }
  }

  return { name, room, age, gender };
};

export const extractAdmissionDate = (lines: string[]): number => {
  // Look for patterns like "Date: 10/12/2024" or "Admitted: 10/12/24"
  const dateRegex = /\b(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})\b/;
  const dateLine = lines.find(l => l.match(/\b(Date|Admitted|Admit)\b/i) && dateRegex.test(l));

  if (dateLine) {
    const match = dateLine.match(dateRegex);
    if (match) {
      const date = new Date(match[0]);
      // Ensure valid date parsing
      if (!isNaN(date.getTime())) return date.getTime();
    }
  }
  return 0; // Return 0 if no date found, putting these items at the end/start depending on sort direction
};

export const extractPlansFromContent = (content: string): ExtractedPlan[] => {
  const groups = parseRawContent(content);
  return groups
    .map((g, idx) => {
      if (g.header === '### Preamble') return null;
      const problems: { title: string; details: string[] }[] = [];
      let currentProb: { title: string; details: string[] } | null = null;
      g.lines.forEach(line => {
        if (line.startsWith('#')) {
          if (currentProb) problems.push(currentProb);
          currentProb = { title: line.replace('#', '').trim(), details: [] };
        } else if (currentProb) {
          if (line.trim()) currentProb.details.push(line.trim());
        }
      });
      if (currentProb) problems.push(currentProb);
      if (problems.length === 0) return null;
      return { patientHeader: g.header, patientIndex: idx, problems };
    })
    .filter(Boolean) as ExtractedPlan[];
};

export const extractCriticalPatients = (content: string) => {
  const groups = parseRawContent(content);
  return groups
    .filter(g => g.lines.some(l => l.match(CRITICAL_LAB_REGEX)))
    .map(g => ({
      header: g.header,
      lines: g.lines.filter(l => l.match(CRITICAL_LAB_REGEX)),
    }));
};

export const extractMedsFromContent = (content: string) => {
  const groups = parseRawContent(content);
  return groups
    .map(g => {
      const meds = g.lines.filter(
        l => l.match(MEDS_REGEX) && !l.startsWith('#') && !l.startsWith('VS:')
      );
      if (meds.length === 0) return null;
      return { patientHeader: g.header, meds };
    })
    .filter(Boolean) as { patientHeader: string; meds: string[] }[];
};

export const extractLabsFromContent = (content: string) => {
  const groups = parseRawContent(content);
  return groups
    .map(g => {
      const labs = g.lines.filter(l => l.match(LABS_REGEX) || l.match(CRITICAL_LAB_REGEX));
      if (labs.length === 0) return null;
      return { patientHeader: g.header, labs };
    })
    .filter(Boolean) as { patientHeader: string; labs: string[] }[];
};

export const parseForDashboard = (content: string): DashboardPatient[] => {
  const groups = parseRawContent(content);
  return groups
    .map((g, idx) => {
      if (g.header === '### Preamble') return null;
      const { name, room } = extractNameFromHeader(g.header);
      const criticalLabs = g.lines.filter(l => l.match(CRITICAL_LAB_REGEX));
      const activeProblems = g.lines
        .filter(l => l.startsWith('#'))
        .map(l => l.replace('#', '').trim());
      const vitals = g.lines.find(l => l.match(/VS:/)) || '';

      let acuity: 'Low' | 'Medium' | 'High' = 'Low';
      if (
        criticalLabs.length > 0 ||
        activeProblems.some(
          p => p.toLowerCase().includes('sepsis') || p.toLowerCase().includes('failure')
        )
      )
        acuity = 'High';
      else if (activeProblems.length > 3) acuity = 'Medium';

      return {
        id: idx,
        name,
        room,
        vitals,
        criticalLabs,
        activeProblems,
        acuity,
      };
    })
    .filter(Boolean) as DashboardPatient[];
};

export const extractClinicalKeywords = (text: string) => {
  return CLINICAL_PROBLEM_KEYWORDS.filter(kw => text.toLowerCase().includes(kw.toLowerCase()));
};

export const highlightText = (text: string, query: string, _isDarkMode?: boolean) => {
  if (!query) return text;
  const parts = text.split(new RegExp(`(${query})`, 'gi'));
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <span key={i} className="superscribe-highlight bg-yellow-200 text-black rounded px-0.5">
            {part}
          </span>
        ) : (
          part
        )
      )}
    </>
  );
};
