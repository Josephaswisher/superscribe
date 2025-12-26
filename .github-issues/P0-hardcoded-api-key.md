# CRITICAL: Hardcoded Gemini API Key in Production Code

**Severity:** P0 - CRITICAL
**CVSS Score:** 9.8 (Critical)
**CWE:** CWE-798 (Use of Hard-coded Credentials)
**OWASP:** A07:2021 - Identification and Authentication Failures

## Location
- **File:** `api/gemini.ts`
- **Line:** 3

## Current Code
```typescript
const GEMINI_API_KEY = 'AIzaSyAGDJpO6hJ_2PlwHE9Ohvmb7_mEaYk4hHM';
```

## Impact
- **IMMEDIATE RISK**: Active API key is exposed in public repository
- **Compliance**: HIPAA violation - inadequate access controls (45 CFR § 164.312(a)(1))
- **Financial**: Potential unauthorized API usage and charges
- **Data Security**: Attackers can access AI model to potentially extract training data or abuse service
- **Reputation**: Security breach disclosure requirements

## Remediation Steps

### 1. IMMEDIATE (Do this NOW - 5 minutes)
```bash
# Revoke the exposed API key immediately
# Go to: https://makersuite.google.com/app/apikey
# Delete key: AIzaSyAGDJpO6hJ_2PlwHE9Ohvmb7_mEaYk4hHM

# Generate new API key and set as environment variable
export GEMINI_API_KEY="your-new-key-here"
```

### 2. Code Fix (15 minutes)
```typescript
// api/gemini.ts
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  return res.status(500).json({
    error: 'API key not configured',
    details: 'GEMINI_API_KEY environment variable is required'
  });
}
```

### 3. Vercel Configuration
```bash
# Add to Vercel project settings
vercel env add GEMINI_API_KEY production
vercel env add GEMINI_API_KEY preview
vercel env add GEMINI_API_KEY development
```

### 4. Local Development
```bash
# Create .env.local (this file is gitignored)
echo "GEMINI_API_KEY=your-new-key" > .env.local

# Verify .gitignore includes
echo ".env.local" >> .gitignore
```

## Verification
```bash
# Ensure key is not in code
grep -r "AIzaSy" . --exclude-dir=node_modules

# Verify environment variable is loaded
npm run dev
# Check that API calls work without hardcoded key
```

## Estimated Fix Time
- Immediate revocation: 5 minutes
- Code fix + testing: 15 minutes
- **Total: 20 minutes**

## Labels
`security`, `critical`, `P0`, `HIPAA`, `api-keys`
