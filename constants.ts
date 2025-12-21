import { DocumentTemplate } from './types';

export const INITIAL_DOCUMENT_CONTENT = ``;


export const DEFAULT_TEMPLATES: DocumentTemplate[] = [
  {
    id: 'admission-hp',
    name: 'Admission H&P',
    description: 'Comprehensive History & Physical for new admissions.',
    structure: `[Admission H&P]
Date: {DATE} {TIME}
Patient: {NAME} ({AGE} {SEX}) | MRN: {MRN}

Chief Complaint
{CC}

HPI
{HPI_NARRATIVE}

PMH/PSH
Medical: {PMH}
Surgical: {PSH}
Medications: {HOME_MEDS}
Allergies: {ALLERGIES}

Social/Family
{SOCIAL}
Baseline function: {BASELINE}

Exam
VS: {VITALS}
{EXAM}

Labs/Imaging
{LABS}
{IMAGING}

Assessment
{AGE} with {PMH} presenting with {DIAGNOSIS}.

Problem List and Plan
# {PRIMARY_PROBLEM}
Initial: {INITIAL_PLAN}
Monitor: {MONITORING}
Consider: {CONTINGENCY}

# {SECONDARY_PROBLEMS}
{PLANS}

Safety
Code: {CODE_STATUS}
VTE: {VTE_PLAN}
Fall risk: {FALL_RISK}

Disposition
Admit: {LEVEL}
Expected LOS: {LOS}`,
    styleGuide: `### SCRIBE PERSONA: H&P FORMAL
- **HPI**: Write in a formal, narrative paragraph style. Use OLD CARTS (Onset, Location, Duration, Character, Aggravating/Alleviating, Radiation, Timing, Severity).
- **Assessment**: Start with a 1-sentence summary: "{AGE} with {PMH} presenting with {DIAGNOSIS}."
- **Plan**: Use problem-based hashtags (#Problem). Be explicit about diagnostic workup, therapeutic interventions, and consultations.`,
    attestation: `---- Attestation ----
Saw/examined pt with team, independently reviewed labs/imaging, made substantive edits.
{NAME} is a {AGE} {SEX} with {PMH}, admitted for {DIAGNOSIS}.
Assessment/Plan: # {PROBLEM}: {STATUS}. {PLAN in 1-2 sentences}.
Dispo: {DC_PLAN}
MDM: {LEVEL} complexity—{RATIONALE}. Level {CODE}.`
  },
  {
    id: 'progress-note',
    name: 'Progress Note',
    description: 'Daily progress note in a concise format.',
    structure: `[Progress Note - Day {HD}]
Date: {DATE} {TIME}
Patient: {NAME} | MRN: {MRN} | Room: {ROOM}

Subjective
Overnight: {OVERNIGHT_EVENTS}
Patient: {PATIENT_REPORT}

Objective
VS: {VITALS} (24h trend: {TREND})
I/O: {IO} | Weight: {WEIGHT}
Exam: {EXAM_FINDINGS}
Labs: {LAB_SUMMARY}
Studies: {IMAGING_SUMMARY}

Assessment
{AGE} with {PMH} admitted for {DIAGNOSIS}, HD #{HD}. {TRAJECTORY}.

Problem List and Plan
# {PROBLEM_1}, {STATUS}
{ACTION_1}
Trend {METRIC}

# {PROBLEM_2}, {STATUS}
Continue {INTERVENTION}

Disposition
Barriers: {BARRIERS}
Anticipated: {DC_TIMELINE}`,
    styleGuide: `### SCRIBE PERSONA: HOSPITALIST SHORTHAND
You must strictly adhere to this writing style. Do not use full conversational sentences.
- **Plans**: 2-3 lines max per problem. Use "consider", "reassess", "trend".
- **Lab values**: Only cite critical values with numbers. Otherwise use "improving", "stable", "worsening".
- **Abbreviations**: Use "w/" for with, "c/w" for consistent with, "s/p" for status post.
- **PLAN FORMAT**: Use HASHTAGS for problem headers followed by the plan on the next line.`
  },
  {
    id: 'discharge-summary',
    name: 'Discharge Summary',
    description: 'Summarizes hospital course for discharge.',
    structure: `[Discharge Summary]
Admit: {ADMIT_DATE} | Discharge: {DC_DATE}
Patient: {NAME} | MRN: {MRN}

Hospital Course
{AGE} with {PMH} admitted for {DIAGNOSIS}. {COURSE_SUMMARY}.

Problem List
# {PROBLEM_1}, resolved
Course: {COURSE}
DC plan: {DC_PLAN}

# {PROBLEM_2}, improved
Course: {COURSE}
DC plan: {DC_PLAN}

Discharge Diagnoses
Primary: {PRIMARY}
Secondary: {SECONDARY}

Medications
New: {NEW_MEDS}
Changed: {CHANGED_MEDS}
Stopped: {STOPPED_MEDS}

Follow-up
Appointments: {APPTS}
Instructions: {INSTRUCTIONS}
Return if: {PRECAUTIONS}

Disposition
{DC_DESTINATION}`,
    styleGuide: `### DISCHARGE SUMMARY STYLE GUIDE
- **Hospital Course**: A brief, 1-3 paragraph summary of the entire hospital stay.
- **Problem List**: Detail the course and resolution status for each major problem addressed during the stay.
- **Medications**: Clearly delineate new, changed, and stopped medications to avoid confusion.
- **Follow-up**: Be specific with appointment times and instructions.`
  },
  {
    id: 'sign-out',
    name: 'Sign-out',
    description: 'Concise handoff document for night coverage.',
    structure: `[Sign-out]
{NAME} ({AGE} {SEX}) | Room {ROOM} | Day #{HD}
Code: {CODE} | Acuity: {ACUITY}

One-liner
{DIAGNOSIS} with {COMPLICATIONS}. {TRAJECTORY}.

Active Issues
# {PROBLEM_1}
Today: {TODAY_STATUS}
Overnight: {OVERNIGHT_PLAN}
If-then: {CONTINGENCY}

# {PROBLEM_2}
Status: {STATUS}
Watch: {MONITORING}

To-Do
- [ ] {TASK_1}
- [ ] {TASK_2}

Dispo
{DC_PLAN} | Barriers: {BARRIERS}`,
    styleGuide: `### SIGN-OUT STYLE GUIDE
- **Brevity is Key**: Use bullet points and fragments. This is for a colleague, not for billing.
- **Action-Oriented**: Focus on what the covering clinician needs to DO.
- **If-Then Statements**: The "Overnight" and "If-then" sections are critical. Provide clear, actionable triggers (e.g., "If temp > 38.5, give Tylenol, draw blood cultures").
- **To-Do**: List only critical, time-sensitive tasks that must be done overnight.`
  }
];