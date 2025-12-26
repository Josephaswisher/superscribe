# HIGH: Unencrypted PHI Stored in localStorage - HIPAA Violation

**Severity:** P1 - HIGH
**CVSS Score:** 7.5 (High)
**CWE:** CWE-311 (Missing Encryption of Sensitive Data)
**HIPAA:** 45 CFR § 164.312(a)(2)(iv) - Encryption and Decryption
**OWASP:** A02:2021 - Cryptographic Failures

## Location
- **File:** `components/Document/PatientCard.tsx`
- **Lines:** 144-158 (write), 126-141 (read)

## Current Code
```typescript
// VIOLATION: Unencrypted PHI in localStorage
useEffect(() => {
  try {
    if (assignedResident) {
      localStorage.setItem(`superscribe_assignment_res_${patientKey}`, assignedResident);
    }
  } catch (err) {
    console.error('Failed to save resident assignment:', err);
  }
}, [assignedResident, patientKey]);

const [assignedResident, setAssignedResident] = useState<string>(() => {
  try {
    const saved = localStorage.getItem(`superscribe_assignment_res_${patientKey}`);
    return saved || '';
  } catch {
    return '';
  }
});
```

## Impact
- **HIPAA Violation**: PHI stored without encryption at rest
- **Regulatory**: 45 CFR § 164.312(a)(2)(iv) requires encryption for PHI
- **Data Exposure**: Browser DevTools can read all localStorage data
- **Persistence**: Data remains after logout/session end
- **Audit Risk**: HIPAA audits will flag unencrypted PHI storage
- **Fines**: Up to $1.5M per year for willful neglect
- **Attack Vectors**:
  - XSS attacks can exfiltrate localStorage
  - Malicious browser extensions can read data
  - Shared/public computers expose PHI
  - Browser sync features may transmit unencrypted

## Data Classification
The following PHI elements may be stored:
- Patient identifiers (patientKey)
- Assignment relationships (resident assignments)
- Medical record associations

## Remediation Options

### Option 1: RECOMMENDED - Remove localStorage (30 minutes)
**Why**: Simplest, most secure, HIPAA-compliant solution

```typescript
// components/Document/PatientCard.tsx
// Simply remove the localStorage persistence

// Before:
const [assignedResident, setAssignedResident] = useState<string>(() => {
  try {
    const saved = localStorage.getItem(`superscribe_assignment_res_${patientKey}`);
    return saved || '';
  } catch {
    return '';
  }
});

useEffect(() => {
  try {
    if (assignedResident) {
      localStorage.setItem(`superscribe_assignment_res_${patientKey}`, assignedResident);
    }
  } catch (err) {
    console.error('Failed to save resident assignment:', err);
  }
}, [assignedResident, patientKey]);

// After:
const [assignedResident, setAssignedResident] = useState<string>('');

// No useEffect needed - data only lives in session memory
```

**Benefits**:
- ✅ Immediate HIPAA compliance
- ✅ No encryption complexity
- ✅ No key management
- ✅ Reduced attack surface
- ✅ Data cleared on tab close

**Drawbacks**:
- ❌ Assignments lost on page refresh (acceptable for most medical workflows)

### Option 2: Migrate to Supabase with RLS (2 hours)
**Why**: Secure, encrypted, auditable, HIPAA Business Associate Agreement (BAA) available

```typescript
// lib/supabase/assignments.ts
import { supabase } from './client';

interface PatientAssignment {
  id?: string;
  patient_key: string;
  resident_id: string;
  user_id: string;
  created_at?: string;
  updated_at?: string;
}

export async function saveAssignment(
  patientKey: string,
  residentId: string,
  userId: string
): Promise<void> {
  const { error } = await supabase
    .from('patient_assignments')
    .upsert({
      patient_key: patientKey,
      resident_id: residentId,
      user_id: userId,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'patient_key,user_id'
    });

  if (error) throw error;
}

export async function getAssignment(
  patientKey: string,
  userId: string
): Promise<string | null> {
  const { data, error } = await supabase
    .from('patient_assignments')
    .select('resident_id')
    .eq('patient_key', patientKey)
    .eq('user_id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // No rows
    throw error;
  }

  return data?.resident_id || null;
}

export async function deleteAssignment(
  patientKey: string,
  userId: string
): Promise<void> {
  const { error } = await supabase
    .from('patient_assignments')
    .delete()
    .eq('patient_key', patientKey)
    .eq('user_id', userId);

  if (error) throw error;
}
```

```sql
-- migrations/001_patient_assignments.sql
CREATE TABLE patient_assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_key TEXT NOT NULL,
  resident_id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(patient_key, user_id)
);

-- Row Level Security
ALTER TABLE patient_assignments ENABLE ROW LEVEL SECURITY;

-- Users can only access their own assignments
CREATE POLICY "Users can view own assignments"
  ON patient_assignments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own assignments"
  ON patient_assignments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own assignments"
  ON patient_assignments FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own assignments"
  ON patient_assignments FOR DELETE
  USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_assignments_user ON patient_assignments(user_id);
CREATE INDEX idx_assignments_patient ON patient_assignments(patient_key);

-- Updated timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_assignments_updated_at
  BEFORE UPDATE ON patient_assignments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
```

```typescript
// components/Document/PatientCard.tsx
import { saveAssignment, getAssignment } from '@/lib/supabase/assignments';
import { useAuth } from '@/hooks/useAuth';

// Inside component:
const { user } = useAuth();
const [assignedResident, setAssignedResident] = useState<string>('');
const [loading, setLoading] = useState(true);

// Load assignment on mount
useEffect(() => {
  async function loadAssignment() {
    if (!user?.id) return;

    try {
      const assignment = await getAssignment(patientKey, user.id);
      if (assignment) setAssignedResident(assignment);
    } catch (error) {
      console.error('Failed to load assignment:', error);
    } finally {
      setLoading(false);
    }
  }

  loadAssignment();
}, [patientKey, user?.id]);

// Save assignment on change
useEffect(() => {
  async function save() {
    if (!user?.id || !assignedResident) return;

    try {
      await saveAssignment(patientKey, assignedResident, user.id);
    } catch (error) {
      console.error('Failed to save assignment:', error);
    }
  }

  save();
}, [assignedResident, patientKey, user?.id]);
```

**Benefits**:
- ✅ HIPAA compliant (encryption at rest + transit)
- ✅ BAA available from Supabase
- ✅ Row Level Security enforcement
- ✅ Audit trails via Supabase logs
- ✅ Cross-device synchronization
- ✅ Backup and recovery

**Drawbacks**:
- ❌ More complex implementation
- ❌ Requires Supabase setup
- ❌ Network latency for reads/writes

### Option 3: Client-Side Encryption (NOT RECOMMENDED - 3 hours)
**Why Not**: Complex, error-prone, key management risks

<details>
<summary>Click to see implementation (not recommended)</summary>

```typescript
// lib/crypto.ts
const ENCRYPTION_KEY = 'encryption_key';

async function getEncryptionKey(): Promise<CryptoKey> {
  // Derive key from user session token
  const sessionToken = await getUserSessionToken();
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(sessionToken),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode('superscribe-salt'),
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function encryptData(data: string): Promise<string> {
  const key = await getEncryptionKey();
  const encoder = new TextEncoder();
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(data)
  );

  // Combine IV and encrypted data
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(encrypted), iv.length);

  return btoa(String.fromCharCode(...combined));
}

export async function decryptData(encrypted: string): Promise<string> {
  const key = await getEncryptionKey();
  const combined = Uint8Array.from(atob(encrypted), c => c.charCodeAt(0));

  const iv = combined.slice(0, 12);
  const data = combined.slice(12);

  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    data
  );

  return new TextDecoder().decode(decrypted);
}
```

**Issues**:
- ❌ Key management complexity
- ❌ Key rotation challenges
- ❌ Still vulnerable to XSS
- ❌ No audit trail
- ❌ Browser compatibility issues
- ❌ HIPAA compliance questionable

</details>

## Implementation Plan

### Phase 1: Immediate Risk Mitigation (30 minutes)
```typescript
// TEMPORARY: Clear existing localStorage (one-time cleanup)
// Add to App.tsx or main entry point
useEffect(() => {
  // Clear PHI from localStorage on app load
  const keys = Object.keys(localStorage);
  keys.forEach(key => {
    if (key.startsWith('superscribe_assignment_')) {
      localStorage.removeItem(key);
    }
  });
}, []);
```

### Phase 2: Choose Solution
- **For MVP/Quick Fix**: Option 1 (Remove localStorage)
- **For Production/Enterprise**: Option 2 (Supabase with RLS)

### Phase 3: Cleanup and Verification (15 minutes)
```bash
# Search for other localStorage usage with PHI
grep -r "localStorage" components/ --include="*.tsx" --include="*.ts"

# Verify no PHI in sessionStorage
grep -r "sessionStorage" components/ --include="*.tsx" --include="*.ts"

# Check for IndexedDB usage
grep -r "indexedDB" components/ --include="*.tsx" --include="*.ts"
```

## Verification Checklist
- [ ] No PHI in localStorage (check DevTools)
- [ ] No PHI in sessionStorage
- [ ] No PHI in IndexedDB
- [ ] Data cleared on logout
- [ ] Assignment functionality still works
- [ ] Tests updated and passing
- [ ] HIPAA compliance documented
- [ ] Security review completed

## Testing
```typescript
// Test that no PHI persists
describe('PatientCard PHI Storage', () => {
  it('should not persist PHI to localStorage', () => {
    render(<PatientCard patient={testPatient} />);

    // Interact with component
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'Dr. Smith' } });

    // Verify localStorage is clean
    const keys = Object.keys(localStorage);
    const phiKeys = keys.filter(k => k.includes('assignment'));
    expect(phiKeys).toHaveLength(0);
  });

  it('should clear data on unmount', () => {
    const { unmount } = render(<PatientCard patient={testPatient} />);
    unmount();

    // Verify no data persists
    expect(localStorage.getItem('superscribe_assignment_res_123')).toBeNull();
  });
});
```

## Documentation Updates Required
```markdown
# docs/HIPAA-COMPLIANCE.md

## Data Storage Policy

### Prohibited Storage Locations
- ❌ localStorage (unencrypted)
- ❌ sessionStorage (unencrypted)
- ❌ IndexedDB (without encryption)
- ❌ Cookies (except encrypted session tokens)
- ❌ URL parameters
- ❌ Browser cache

### Approved Storage Locations
- ✅ Supabase database (encrypted at rest)
- ✅ Memory-only (React state) for transient data
- ✅ Encrypted cookies for session tokens only

### PHI Handling Rules
1. Never persist PHI to client-side storage
2. Use server-side storage with RLS
3. Clear all PHI on logout
4. Implement session timeouts (15 minutes idle)
5. Audit all data access
```

## Estimated Fix Time
- **Option 1 (Remove localStorage)**: 45 minutes
  - Code changes: 15 minutes
  - Testing: 15 minutes
  - Cleanup: 15 minutes

- **Option 2 (Supabase + RLS)**: 2.5 hours
  - Database schema: 30 minutes
  - API functions: 45 minutes
  - Component updates: 45 minutes
  - Testing: 30 minutes

## Labels
`security`, `HIPAA`, `P1`, `PHI`, `encryption`, `compliance`
