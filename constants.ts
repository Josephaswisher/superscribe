import { DocumentTemplate } from './types';

export const INITIAL_DOCUMENT_CONTENT = `Patient: John Doe
Room: 402-B
**65yo M** admitted for **Chest Pain**

VS: BP: 142/88 HR: 92 RR: 18 SpO2: 96% T: 37.2°C

# Assessment & Plan
# Chest Pain: Stable. Troponins negative.
# Hypertension: Started lisinopril 10mg PO daily.
`;

export const DEFAULT_TEMPLATES: DocumentTemplate[] = [
  // --- CORE NOTES ---
  {
    id: 'admission-note',
    name: 'Solo Admission Note',
    description: 'Full admission documentation for direct patient care (No Resident).',
    structure: `[Admission Note]
Clinical Summary:
{AGE}{SEX} w/ {PMH} admitted w/ {CC}. Clinical picture consistent w/ {DIAGNOSIS} because {REASONING}. On exam {VITALS_ABNORMAL} + {PE_POSITIVE}. Labs notable for {LAB_S}. Imaging shows {IMAGING_FINDINGS}. Admitted for {ADMIT_REASON}.

Assessment & Plan:

#1 {PRIMARY_PROBLEM}: {STATUS}. {ACTION}. {RATIONALE}.
#2 {SECONDARY_PROBLEM}: {STATUS}. {ACTION}. {RATIONALE}.
#3 {PROBLEM_3}: {STATUS}. {ACTION}. {RATIONALE}.
#4 {PROBLEM_4}: {STATUS}. {ACTION}. {RATIONALE}.

Consults: {CONSULTS}

Disposition:
{DISPO_LOCATION} {MONITORING} {TRAJECTORY} {BARRIERS}.

------------------------

Medical Decision Making:
{COMPLEXITY_LEVEL} complexity—{PROBLEM_DESC}, {DATA_SCOPE}, {RISK_LEVEL}. Level: {BILLING_CODE}.`,
    styleGuide: `### SCRIBE PERSONA: SOLO ATTENDING
- **CRITICAL RULES**:
  - **Header**: ALWAYS start with '### [Pt Initials] - RM [Room]' if known, to rename the document preamble.
  - **Meds**: NEW meds MUST use Drug + Dose + Route + Freq (e.g., "ceftriaxone 2g IV daily"). NO "started antibiotics".
  - **Numbering**: Use #1, #2, #3 (plain text, NO bold).
  - **Forbidden Phrases**:
    - NO "Will monitor" -> Use "Serial lactates q4h" or "Telemetry".
    - NO "Continue management" -> Use specific meds.
    - NO "Plan to reassess" -> Use "Repeat BMP in AM".
  - **Complexity**: Default to High Complexity (99223) unless clearly simple.
  - **Structure**: Status + Action + Rationale is MANDATORY for every problem.`,
  },
  {
    id: 'progress-note',
    name: 'Progress Note (SOAP)',
    description: 'Daily attending progress note.',
    structure: `[Progress Note - Day {HD}]
Date: {DATE} {TIME}
Patient: {NAME} | MRN: {MRN}

Subjective:
Ovnt: {OVERNIGHT_EVENTS}
Pt reports: {PT_COMPLAINTS}

Objective:
VS: {VITALS_Today} (Trend: {VITALS_TREND})
I/O: {IO} | Wt: {WEIGHT}
Exam: {EXAM_FINDINGS}
Labs: {LAB_SUMMARY}
Imaging: {IMAGING_NEW}

Assessment:
{AGE} w/ {PMH} admitted for {DIAGNOSIS}, HD #{HD}. {TRAJECTORY_STATUS}.

Plan:
#1 {PROBLEM_1}: {STATUS}. {ACTION}. {RATIONALE}.
#2 {PROBLEM_2}: {STATUS}. {ACTION}. {RATIONALE}.

Disposition:
{DISPO_PLAN} | Barriers: {BARRIERS}`,
    styleGuide: `### SCRIBE PERSONA: HOSPITALIST SHORTHAND
- **CRITICAL RULES**:
  - **Format**: Concise, fragments allowed, but SPECIFICS required.
  - **Header**: ALWAYS start with '### [Pt Initials] - RM [Room]' if known, to rename the document preamble.
  - **Meds**: STRICT format: Drug + Dose + Route + Freq.
  - **Numbering**: #1, #2 (No bold).
  - **Forbidden Phrases**:
    - NO "Continue current management" -> List specific meds/interventions.
    - NO "Will monitor" -> Use specific parameters.
  - **Plan Components**: Status + Action + Rationale required.`,
  },
  {
    id: 'discharge-summary',
    name: 'Discharge Summary',
    description: 'Comprehensive summary ensuring safe transition of care.',
    structure: `[Discharge Summary]
Admit: {ADMIT_DATE} | Discharge: {DC_DATE}
Patient: {NAME} | MRN: {MRN}

Hospital Course:
{AGE} with {PMH} admitted for {DIAGNOSIS}. {HOSPITAL_COURSE_NARRATIVE}.

Problem List Resolution:
#1 {PROBLEM_1}: Resolved. {COURSE_SUMMARY}.
#2 {PROBLEM_2}: Improved. {COURSE_SUMMARY}.

Medications:
New: {NEW_MEDS_LIST}
Changed: {CHANGED_MEDS_LIST}
Stopped: {STOPPED_MEDS_LIST}

Follow-up:
{APPOINTMENTS}
{RETURN_PRECAUTIONS}`,
    styleGuide: `### SCRIBE PERSONA: DISCHARGE SAFEGUARD
- **CRITICAL RULES**:
  - **Header**: ALWAYS start with '### [Pt Initials] - RM [Room]' if known, to rename the document preamble.
  - **Meds**: STRICT separation of New/Changed/Stopped with full dosing.
  - **Forbidden Phrases**:
    - NO "Follow up with PCP" -> MUST say "with PCP Dr. Smith in 1 week".
    - NO "Stable" without context -> Describe discharge status.
  - **Course**: Narrative summary of *what actually happened* and *why*.
  - **Numbering**: #1, #2 (No bold) for problem resolution.`,
  },
  {
    id: 'rapid-response-note',
    name: 'Rapid Response Note',
    description: 'Documentation of emergency RRT event.',
    structure: `[Rapid Response Note]
Time Called: {TIME_CALLED}
Location: {ROOM}
Reason: {RRT_REASON}

Event Summary:
Patient found {INITIAL_STATE}. Vitals: {INITIAL_VITALS}.
Interventions:
{TIME_1}: {INTERVENTION_1}
{TIME_2}: {INTERVENTION_2}

Response:
{RESPONSE_TO_INTERVENTIONS}
Current Status: {CURRENT_STATUS}

Disposition:
{DISPO_DECISION} (e.g., Transfer to ICU, Stay on floor).
Family notified: {FAMILY_NOTIFIED}.`,
    styleGuide: `### SCRIBE PERSONA: CRITICAL CARE
- **CRITICAL RULES**:
  - **Tone**: Urgent, objective, timestamp-focused.
  - **Header**: ALWAYS start with '### [Pt Initials] - RM [Room]' if known, to rename the document preamble.
  - **Meds**: Exact doses (mg/mcg) and times given. NO "given meds".
  - **Forbidden Phrases**:
    - NO "stable" -> Use specific vitals/response.
    - NO "will monitor" -> State specific dispo/care level plan (e.g., "Transfer to ICU").`,
  },

  // --- ATTESTATIONS ---
  {
    id: 'admission-attestation',
    name: 'Admission Attestation',
    description: 'Supervising resident admission (High Complexity).',
    structure: `[Attestation Note]
Date: {DATE} {TIME}
Patient: {NAME} | MRN: {MRN}

Attestation:
I have personally interviewed and examined this patient. I have reviewed the resident's documentation including the history, physical examination, laboratory and imaging data, and medical decision-making. I have discussed the case with the resident team. The resident note accurately reflects my evaluation and plan. This attestation, in combination with the resident documentation, supports the level of service billed for this encounter.

***

[SYNTHESIS]
{AGE}{SEX} w/ {PMH} admitted overnight w/ {CC}. {CLINICAL_REASONING}. On exam {VITALS} + {PE_POSITIVE}. Labs: {LABS}. Imaging: {IMAGING}. Admitted for management.

#1 {PRIMARY_PROBLEM}: {STATUS}. {ACTION}. {RATIONALE}.
#2 {SECONDARY_PROBLEM}: {STATUS}. {ACTION}. {RATIONALE}.
#3 {PROBLEM_3}: {STATUS}. {ACTION}. {RATIONALE}.

Dispo: {DISPO_LOCATION} {MONITORING} {TRAJECTORY}.

————————

Medical Decision Making: {COMPLEXITY} complexity—{RISK_REASON}. Level: 99223.`,
    styleGuide: `### SCRIBE PERSONA: ATTENDING ATTESTATION
- **CRITICAL RULES**:
  - **Compliance**: Copy specific attestation statement verbatim.
  - **Header**: ALWAYS start with '### [Pt Initials] - RM [Room]' if known, to rename the document preamble.
  - **Meds**: NEW meds MUST use Drug + Dose + Route + Freq.
  - **Numbering**: Use #1, #2, #3 (plain text, NO bold).
  - **Forbidden Phrases**:
    - NO "Will monitor" -> Use absolute specifics (e.g., "lactates q4h").
    - NO "Close observation".
  - **Complexity**: Default 99223 (High).`,
  },
  {
    id: 'discharge-attestation',
    name: 'Discharge Attestation',
    description: 'Supervising resident discharge summary.',
    structure: `[Discharge Attestation]
I have personally reviewed the discharge summary, medication reconciliation, and follow-up plan documented by the resident. I have examined the patient on day of discharge. I agree with the plan of care as documented.

Key Course Summary:
{BRIEF_COURSE_SUMMARY}

Discharge Plan:
Agreed with dispo to {DISPO_DEST}. Meds reconciled. Return precautions reviewed.
Total time spent on discharge management: >30 minutes.`,
    styleGuide: `### SCRIBE PERSONA: ATTENDING ATTESTATION
- **CRITICAL RULES**:
  - **Billing**: Must mention time " >30 minutes" if applicable for billing 99239.
  - **Header**: ALWAYS start with '### [Pt Initials] - RM [Room]' if known, to rename the document preamble.
  - **Meds**: Confirm "Meds reconciled" is stated explicitly.
  - **Forbidden Phrases**:
    - NO "agree with plan" alone -> Must confirm Med Rec and Dispo specifically.`,
  },
  {
    id: 'progress-attestation',
    name: 'Progress Note Attestation',
    description: 'Supervising resident daily note.',
    structure: `[Progress Note Attestation]
I have personally seen and examined the patient. I have reviewed the resident's note and agree with the findings and plan, with the following additions/clarifications:

#1 {MAIN_PROBLEM}: {AGREEMENT/MODIFICATION}. {ACTION}.
#2 {SECONDARY_PROBLEM}: {AGREEMENT/MODIFICATION}.

I spent {TIME} minutes in direct patient care and coordination.`,
    styleGuide: `### SCRIBE PERSONA: ATTENDING ATTESTATION
- **CRITICAL RULES**:
  - **Numbering**: #1, #2... (plain text).
  - **Header**: ALWAYS start with '### [Pt Initials] - RM [Room]' if known, to rename the document preamble.
  - **Meds**: Specifics required for any additions (Drug/Dose).
  - **Forbidden Phrases**:
    - NO "I agree" -> Must add at least one specific value-add or synthesis.`,
  },
  {
    id: 'rapid-response-attestation',
    name: 'Rapid Response Attestation',
    description: 'Supervising resident during RRT.',
    structure: `[Rapid Response Attestation]
I was personally present at bedside for the rapid response event. I supervised the resident and team during the evaluation and management of {RRT_REASON}.

Key Findings: {KEY_VITALS_EXAM}
Critical Interventions: {INTERVENTIONS_PERFORMED}
Decision: {DISPO_DECISION}

Total critical care time: {TIME} minutes excluding procedures.`,
    styleGuide: `### SCRIBE PERSONA: CRITICAL CARE
- **CRITICAL RULES**:
  - **Billing**: Justify Critical Care time (Time > 30 min? > 74 min?).
  - **Header**: ALWAYS start with '### [Pt Initials] - RM [Room]' if known, to rename the document preamble.
  - **Meds**: Supervision of specific critical meds (pressors, drips).
  - **Forbidden Phrases**:
    - NO "present at bedside" alone -> Must detail *supervision* of interventions.`,
  },

  // --- PROCEDURE NOTES ---
  {
    id: 'procedure-paracentesis',
    name: 'Procedure: Paracentesis',
    description: 'Diagnostic/Therapeutic abdominal paracentesis.',
    structure: `[Procedure Note: Paracentesis]
Date/Time: {DATE} {TIME}
Indication: {INDICATION} (e.g., rapid accumulation, diagnostic)
Consent: Risks/benefits explained, output obtainable.
Technique:
- Ultrasound used for site marking: Yes. {US_FINDINGS}.
- Site: {SITE} (e.g., LLQ).
- Prep: ChloraPrep, sterile drape.
- Anesthesia: 1% Lidocaine ({AMOUNT} mL).
- Needle: {NEEDLE_SIZE} gauge.

Fluid Analysis:
- Appearance: {COLOR_CLARITY}.
- Amount Removed: {AMOUNT_REMOVED} L.
- Samples sent: {LABS_SENT}.

Complications: None immediate. {TOLERANCE}.`,
    styleGuide: `### SCRIBE PERSONA: PROCEDURALIST
- **CRITICAL RULES**:
  - **Safety**: MANDATORY fields: Ultrasound, Sterile Prep, Timeout/Consent.
  - **Header**: ALWAYS start with '### [Pt Initials] - RM [Room]' if known, to rename the document preamble.
  - **Meds**: Lidocaine dose (mg or mL + %) is required.
  - **Forbidden Phrases**:
    - NO "tolerated well" -> Describe post-procedure vitals/status (e.g., "Hemodynamically stable post-procedure").`,
  },
  {
    id: 'procedure-lp',
    name: 'Procedure: Lumbar Puncture',
    description: 'Diagnostic LP / CSF collection.',
    structure: `[Procedure Note: Lumbar Puncture]
Date/Time: {DATE} {TIME}
Indication: {INDICATION} (e.g., rule out meningitis, SAH).
Consent: Risks (bleeding, infection, PDPH, nerve damage) explained.

Technique:
- Position: {POSITION} (e.g., LLD, sitting).
- Level: {LEVEL} (e.g., L3-L4).
- Prep: Iodine/ChloraPrep, sterile drape.
- Anesthesia: 1% Lidocaine local.
- Needle: {NEEDLE_TYPE} (e.g., 22G spinal).

Findings:
- Opening Pressure: {OPENING_PRESSURE} cm H2O.
- Fluid Appearance: {APPEARANCE} (e.g., clear, colorless).
- Tubes: 4 tubes collected + Gram stain.

Complications: None. Post-procedure check: Stable.`,
    styleGuide: `### SCRIBE PERSONA: PROCEDURALIST
- **CRITICAL RULES**:
  - **Key Data**: Opening Pressure (or "Attempted but dry") is CRITICAL.
  - **Safety**: Sterile technique confirmation is mandatory.
  - **Header**: ALWAYS start with '### [Pt Initials] - RM [Room]' if known, to rename the document preamble.
  - **Meds**: Lidocaine dose.`,
  },
  {
    id: 'procedure-cvc',
    name: 'Procedure: Central Line',
    description: 'CVC insertion (IJ, Subclavian, Femoral).',
    structure: `[Procedure Note: Central Venous Catheter]
Date/Time: {DATE} {TIME}
Indication: {INDICATION} (e.g., pressors, difficult access).
Consent: Risks (bleeding, pneumothorax, infection, arterial puncture) discussed.

Technique:
- Site: {SITE} (e.g., Right IJ).
- Ultrasound Guidance: Yes, vein compressible, non-pulsatile.
- Prep: Full sterile barrier precautions (max sterile barrier).
- Passes: {PASSES} (e.g., 1st pass).
- Flashback: Venous text, dark blood.
- Manometry/Telemetry: Confirmed venous.
- Depth: Secured at {DEPTH} cm.

Confirmation:
- Blood return in all ports: Yes.
- Flush: Easy.
- CXR: {CXR_RESULT} (e.g., confirmed placement, no PTX).`,
    styleGuide: `### SCRIBE PERSONA: PROCEDURALIST
- **CRITICAL RULES**:
  - **Safety**: "Max sterile barrier", "Ultrasound", and "Confirmation" (CXR/Manometry) are ABSOLUTELY MANDATORY.
  - **Forbidden Phrases**:
    - NO "placed line" -> Detailed step-by-step confirmation.`,
  },
  {
    id: 'smart-synthesis',
    name: 'Smart Synthesis',
    description: 'AI-driven dynamic note structure based on patient complexity.',
    structure: `[Smart Synthesis Note]
{DYNAMIC_CONTENT_STRUCTURE}

------------------------

Medical Decision Making:
{COMPLEXITY_LEVEL} complexity justification.`,
    styleGuide: `### SCRIBE PERSONA: SMART ANALYST
- **CRITICAL RULES**:
  - **Dynamic Structure**: Do NOT use a fixed template. Analyze the patient data and create sections that make clinical sense (e.g., "Post-Op Course", "Critical Care Timeline", "Diagnostic Workup").
  - **Header**: ALWAYS start with '### [Pt Initials] - RM [Room] ([Age][Sex])' to name the document preamble.
  - **Meds**: STRICT: Drug + Dose + Route + Freq.
  - **Numbering**: Use #1, #2... (plain text).
  - **Synthesis**: Every Assessment MUST start with a bolded clinical synthesis one-liner.`,
  },

  // --- ROUNDING TEMPLATES ---
  {
    id: 'rounding-summary',
    name: 'Rounding One-Liner',
    description: 'Quick patient summary for attending rounds presentation.',
    structure: `### {PT_INITIALS} — {ROOM}
**{AGE}{SEX}** | **Dx:** {PRIMARY_DIAGNOSIS} | **HD#{HD}**

**TL;DR:** {ONE_LINER_SYNTHESIS}

**Overnight:** {OVERNIGHT_EVENTS_OR_STABLE}

**Key Data:**
- VS: {KEY_VITALS_TREND}
- Labs: {CRITICAL_LABS_ONLY}
- New: {NEW_FINDINGS_OR_DASH}

**Active Issues:**
#1 {PROBLEM_1}: {STATUS} → {TODAY_PLAN}
#2 {PROBLEM_2}: {STATUS} → {TODAY_PLAN}

**Dispo:** {DISPO_STATUS} | **Barriers:** {BARRIERS_OR_NONE}`,
    styleGuide: `### SCRIBE PERSONA: ROUNDING RESIDENT
You are presenting to the attending on morning rounds. Be CONCISE and CLINICAL.

- **CRITICAL RULES**:
  - **TL;DR FIRST**: Start with a punchy one-liner that captures the patient in <15 words
    - GOOD: "Sepsis from UTI, improving on ceftriaxone, anticipate DC tomorrow"
    - GOOD: "CHF exacerbation, diuresing well, down 3L, euvolemic today"
    - BAD: "Patient is doing well" (too vague)
    - BAD: "65yo M with history of..." (save for full presentation)
  - **Overnight**: One line. "Stable overnight" or "Spiked fever to 101.2, pan-cultured"
  - **Key Data**: ONLY abnormals or significant trends. Skip normal labs.
  - **Plans**: Action-oriented. "Repeat BMP" not "Will monitor electrolytes"
  - **Dispo**: Always include even if "Pending workup"
  - **NO FLUFF**: Cut "continue to monitor", "patient tolerated well", "will reassess"
  - **Arrows**: Use ↗ ↘ → for trends (Cr 1.8→1.4↘)
  - **Bold**: Critical values, diagnosis`,
  },
  {
    id: 'admission-hp',
    name: 'Admission H&P (Resident)',
    description: 'Full admission for resident presentation with synthesis.',
    structure: `### {PT_INITIALS} — {ROOM}
**{AGE}{SEX}** w/ PMHx {PMH} presenting w/ **{CHIEF_COMPLAINT}**

---

**HPI:**
{NARRATIVE_HPI}

**ROS:** {PERTINENT_POSITIVES_NEGATIVES}

**PMH:** {PMH_LIST}
**PSH:** {PSH_LIST}
**Meds:** {HOME_MEDS}
**Allergies:** {ALLERGIES}
**Social:** {SOCIAL_HX}
**Family:** {FAMILY_HX}

---

**Vitals:** {ADMIT_VITALS}
**Exam:**
- General: {GENERAL}
- {SYSTEM_EXAM_FINDINGS}

**Labs:**
{LAB_TABLE}

**Imaging:** {IMAGING_FINDINGS}

---

## Assessment & Plan

**Summary:** {AGE}{SEX} w/ {PMH} presenting w/ {CC}, consistent with **{WORKING_DIAGNOSIS}** given {CLINICAL_REASONING}.

#1 **{PRIMARY_PROBLEM}**
- {SPECIFIC_ACTION_1}
- {SPECIFIC_ACTION_2}
- {CONTINGENCY_IF_THEN}

#2 **{SECONDARY_PROBLEM}**
- {ACTION}

#3 **{PROPHYLAXIS_DISPO}**
- DVT ppx: {DVT_PLAN}
- Diet: {DIET}
- Code: {CODE_STATUS}
- Dispo: {ANTICIPATED_DISPO}`,
    styleGuide: `### SCRIBE PERSONA: SENIOR RESIDENT
You are writing a thorough but efficient admission note.

- **CRITICAL RULES**:
  - **Summary FIRST**: Assessment starts with synthesis, not "Patient is a..."
  - **Clinical Reasoning**: Explain WHY you think this is the diagnosis
  - **Specific Plans**: Drug + Dose + Route + Freq. No "start antibiotics"
  - **If/Then**: Include contingencies ("If no improvement in 24h, escalate to...")
  - **Numbering**: #1, #2, #3 (plain text)
  - **No redundancy**: Don't repeat HPI details in assessment`,
  },
];
