import { describe, it, expect } from 'vitest';
import {
  cleanTextForEMR,
  parseRawContent,
  extractNameFromHeader,
  extractClinicalKeywords,
  extractPlansFromContent,
  extractCriticalPatients,
  CRITICAL_LAB_REGEX,
} from './documentUtils';

describe('cleanTextForEMR', () => {
  it('removes markdown header markers', () => {
    expect(cleanTextForEMR('### Patient Name')).toBe('Patient Name');
  });

  it('removes bold markers', () => {
    expect(cleanTextForEMR('**Critical** value')).toBe('Critical value');
  });

  it('converts checkbox bullets to standard format', () => {
    expect(cleanTextForEMR('- [ ] Task item')).toBe('[ ] Task item');
    expect(cleanTextForEMR('- [x] Done item')).toBe('[x] Done item');
  });

  it('converts bullets to hyphens', () => {
    expect(cleanTextForEMR('• List item')).toBe('- List item');
  });

  it('removes trend arrows', () => {
    expect(cleanTextForEMR('K: 4.5 ↗')).toBe('K: 4.5');
  });
});

describe('parseRawContent', () => {
  it('returns empty array for empty content', () => {
    expect(parseRawContent('')).toEqual([]);
  });

  it('parses single patient section', () => {
    const content = '### 1. John Doe - Room 101\nDiagnosis: Sepsis\nPlan: Antibiotics';
    const result = parseRawContent(content);
    expect(result).toHaveLength(1);
    expect(result[0]?.header).toBe('### 1. John Doe - Room 101');
    expect(result[0]?.lines).toContain('Diagnosis: Sepsis');
  });

  it('parses multiple patient sections', () => {
    const content = `### 1. Patient A - 101
Notes for A
### 2. Patient B - 102
Notes for B`;
    const result = parseRawContent(content);
    expect(result).toHaveLength(2);
  });

  it('handles preamble content', () => {
    const content = 'Some preamble text\n### 1. Patient';
    const result = parseRawContent(content);
    expect(result[0]?.header).toBe('### Preamble');
  });
});

describe('extractNameFromHeader', () => {
  it('extracts name and room from standard format', () => {
    const result = extractNameFromHeader('### 1. John Doe - Room 101');
    expect(result.name).toBe('John Doe');
    expect(result.room).toBe('Room 101');
  });

  it('handles missing room', () => {
    const result = extractNameFromHeader('### 1. John Doe');
    expect(result.name).toBe('John Doe');
    expect(result.room).toBe('');
  });

  it('handles en-dash separator', () => {
    const result = extractNameFromHeader('### 1. John Doe – 101');
    expect(result.name).toBe('John Doe');
    expect(result.room).toBe('101');
  });
});

describe('extractClinicalKeywords', () => {
  it('finds matching clinical keywords', () => {
    const text = 'Patient presenting with sepsis and AKI';
    const keywords = extractClinicalKeywords(text);
    expect(keywords).toContain('Sepsis');
    expect(keywords).toContain('AKI');
  });

  it('returns empty array when no keywords found', () => {
    const text = 'Standard checkup today';
    const keywords = extractClinicalKeywords(text);
    expect(keywords).toEqual([]);
  });

  it('is case insensitive', () => {
    const text = 'Patient has SEPSIS and hyperkalemia';
    const keywords = extractClinicalKeywords(text);
    expect(keywords).toContain('Sepsis');
    expect(keywords).toContain('Hyperkalemia');
  });
});

describe('extractPlansFromContent', () => {
  it('extracts problems from patient sections', () => {
    const content = `### 1. John Doe - 101
# Sepsis
Vancomycin 1g IV q12h
Blood cultures pending
# AKI
IVF bolus 1L`;
    const plans = extractPlansFromContent(content);
    expect(plans).toHaveLength(1);
    expect(plans[0]?.problems).toHaveLength(2);
    expect(plans[0]?.problems[0]?.title).toBe('Sepsis');
  });

  it('returns empty for content without problems', () => {
    const content = '### 1. John Doe\nJust notes without problems';
    const plans = extractPlansFromContent(content);
    expect(plans).toEqual([]);
  });
});

describe('CRITICAL_LAB_REGEX', () => {
  it('matches critical potassium values', () => {
    expect('K: 6.2'.match(CRITICAL_LAB_REGEX)).toBeTruthy();
    expect('Potassium: 2.8'.match(CRITICAL_LAB_REGEX)).toBeTruthy();
  });

  it('matches critical hemoglobin values', () => {
    expect('Hgb: 5.5'.match(CRITICAL_LAB_REGEX)).toBeTruthy();
  });

  it('matches critical lactate values', () => {
    expect('Lactate: 4.5'.match(CRITICAL_LAB_REGEX)).toBeTruthy();
  });

  it('does not match normal values', () => {
    expect('K: 4.0'.match(CRITICAL_LAB_REGEX)).toBeFalsy();
  });
});
