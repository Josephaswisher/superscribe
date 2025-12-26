export enum Role {
  USER = 'user',
  MODEL = 'model',
}

export interface Message {
  id: string;
  role: Role;
  text: string;
  isInternal?: boolean; // For system status messages
  timestamp: Date;
  attachments?: Attachment[];
}

export interface Attachment {
  name: string;
  type: 'image' | 'audio' | 'pdf';
  mimeType: string;
  data: string; // Base64 string
}

export interface PatientData {
  id: string;
  name: string;
  age: number;
  gender: string;
  room?: string;
  pmhx: string;
  admittedFor: string;
  summary: string;
  plan: string[];
  dispo?: string;

  // Team assignments
  attendingMD?: string;
  residentMD?: string; // Senior resident or intern assigned
  studentMD?: string; // Medical student following patient

  // IDR-specific fields for interdisciplinary rounds
  socialBarriers?: string[]; // Housing, transportation, insurance, etc.
  ptNeeds?: string; // Physical therapy status/needs
  otNeeds?: string; // Occupational therapy status/needs
  cmNotes?: string; // Case management notes
  swNotes?: string; // Social work notes
  dietaryNeeds?: string;
  dischargeBarriers?: string[];
  customFields?: Record<string, string>;
}

export interface GeminiResponse {
  text: string;
  explanation?: string;
  updatedDocument?: string | null;
}

export interface DocumentVersion {
  id: string;
  content: string;
  timestamp: Date;
  label: string;
}

// New Interface for Multi-Document Persistence
export interface SavedDocument {
  id: string;
  name: string;
  content: string;
  lastModified: number;
  originalSignout?: string; // Stores the original pasted content for reference
}

export interface DocumentTemplate {
  id: string;
  name: string;
  description: string;
  structure: string; // The prompt instruction describing the format
  styleGuide?: string; // Specific instructions on voice, abbreviations, and syntax
  attestation?: string; // Optional attestation block
}

export interface DashboardPatient {
  id: number;
  name: string;
  room: string;
  vitals: string;
  criticalLabs: string[];
  activeProblems: string[];
  acuity: 'Low' | 'Medium' | 'High';
}

export type ViewMode =
  | 'global'
  | 'cards'
  | 'document'
  | 'plan'
  | 'dashboard'
  | 'labs'
  | 'meds'
  | 'critical'
  | 'handoff'
  | 'pages'
  | 'idr'
  | 'table';
export type UIDensity = 'compact' | 'normal' | 'spacious';

export interface ExtractedPlan {
  patientHeader: string;
  patientIndex: number;
  problems: {
    title: string;
    details: string[];
  }[];
}
