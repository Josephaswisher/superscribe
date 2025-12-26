# CRITICAL: Insecure CORS Configuration Allows Any Origin

**Severity:** P0 - CRITICAL
**CVSS Score:** 7.5 (High)
**CWE:** CWE-942 (Overly Permissive Cross-domain Whitelist)
**OWASP:** A05:2021 - Security Misconfiguration

## Location
- **File:** `api/gemini.ts`
- **Line:** 7

## Current Code
```typescript
res.setHeader('Access-Control-Allow-Origin', '*');
```

## Impact
- **Cross-Site Request Forgery (CSRF)**: Any website can make requests to your API
- **Data Exfiltration**: Malicious sites can trigger AI queries with PHI
- **Session Hijacking**: Credentials could be stolen if used with cookies
- **HIPAA Violation**: Inadequate access controls for PHI (45 CFR § 164.312(a)(1))
- **Attack Scenario**:
  - Attacker hosts malicious site at evil.com
  - Victim visits evil.com while logged into Superscribe
  - evil.com makes API calls to your Gemini endpoint
  - PHI is exfiltrated to attacker's server

## Remediation Steps

### 1. IMMEDIATE - Restrict CORS Origins (10 minutes)
```typescript
// api/gemini.ts
const ALLOWED_ORIGINS = [
  'https://superscribe-emulation.vercel.app',  // Production
  'https://superscribe-emulation-*.vercel.app', // Preview deployments
  process.env.NODE_ENV === 'development' ? 'http://localhost:5173' : null,
  process.env.NODE_ENV === 'development' ? 'http://localhost:4173' : null, // Preview
].filter(Boolean);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const origin = req.headers.origin;

  // Validate origin
  const isAllowed = ALLOWED_ORIGINS.some(allowed => {
    if (allowed.includes('*')) {
      const pattern = new RegExp('^' + allowed.replace('*', '.*') + '$');
      return pattern.test(origin || '');
    }
    return allowed === origin;
  });

  if (!isAllowed) {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Origin not allowed'
    });
  }

  // Set restrictive CORS headers
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Max-Age', '3600');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // ... rest of handler
}
```

### 2. Add Environment-Based Configuration (5 minutes)
```typescript
// lib/config.ts
export const CORS_CONFIG = {
  production: [
    'https://superscribe-emulation.vercel.app',
    'https://superscribe-emulation-*.vercel.app',
  ],
  development: [
    'http://localhost:5173',
    'http://localhost:4173',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:4173',
  ],
};

export function getAllowedOrigins(): string[] {
  const env = process.env.NODE_ENV || 'development';
  return CORS_CONFIG[env as keyof typeof CORS_CONFIG] || CORS_CONFIG.development;
}
```

### 3. Add Security Headers (5 minutes)
```typescript
// api/gemini.ts - Add after CORS headers
res.setHeader('X-Content-Type-Options', 'nosniff');
res.setHeader('X-Frame-Options', 'DENY');
res.setHeader('X-XSS-Protection', '1; mode=block');
res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
res.setHeader(
  'Content-Security-Policy',
  "default-src 'self'; script-src 'self'; object-src 'none'"
);
```

### 4. Add Request Validation (10 minutes)
```typescript
// Validate request method
if (req.method !== 'POST') {
  return res.status(405).json({ error: 'Method not allowed' });
}

// Validate content type
const contentType = req.headers['content-type'];
if (!contentType?.includes('application/json')) {
  return res.status(415).json({ error: 'Unsupported media type' });
}

// Add rate limiting (using Vercel rate limiting or custom implementation)
const rateLimitResult = await rateLimit(req);
if (!rateLimitResult.success) {
  return res.status(429).json({
    error: 'Too many requests',
    retryAfter: rateLimitResult.retryAfter
  });
}
```

## Testing
```bash
# Test from allowed origin
curl -X POST https://superscribe-emulation.vercel.app/api/gemini \
  -H "Origin: https://superscribe-emulation.vercel.app" \
  -H "Content-Type: application/json" \
  -d '{"prompt":"test"}' \
  -v

# Test from disallowed origin (should fail)
curl -X POST https://superscribe-emulation.vercel.app/api/gemini \
  -H "Origin: https://evil.com" \
  -H "Content-Type: application/json" \
  -d '{"prompt":"test"}' \
  -v
# Expected: 403 Forbidden
```

## Verification Checklist
- [ ] CORS only allows specific origins
- [ ] Credentials flag is set correctly
- [ ] Preflight requests handled properly
- [ ] Security headers present in response
- [ ] Request method validation works
- [ ] Tested in production environment
- [ ] Tested with preview deployments
- [ ] Local development still works

## Estimated Fix Time
- CORS restriction: 10 minutes
- Environment config: 5 minutes
- Security headers: 5 minutes
- Request validation: 10 minutes
- Testing: 10 minutes
- **Total: 40 minutes**

## References
- [OWASP CORS Security](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Origin_Resource_Sharing_Cheat_Sheet.html)
- [MDN CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
- [Vercel Security Headers](https://vercel.com/docs/concepts/edge-network/headers#security-headers)

## Labels
`security`, `critical`, `P0`, `CORS`, `HIPAA`, `api-security`
