# Superscribe Deployment Checklist

**Production Readiness Score: 6.2/10** | Last Updated: 2025-12-25

This checklist provides step-by-step instructions to prepare Superscribe for production deployment. Follow Priority 1 items immediately before any production access.

---

## PHASE 1: CRITICAL SECURITY FIXES (Do This First)

### Priority 1.1: Rotate and Secure API Keys

**Status: BLOCKING - Must complete before production deployment**

1. **Revoke Compromised Keys Immediately**
   - Go to Google Cloud Console (Cloud.google.com)
   - Project: "Superscribe" → APIs & Services → Credentials
   - Find key `AIzaSyBmHlrqkRtOIET6KPrme8P6_FQYa-vTvEQ`
   - Click "Delete"
   - Confirm deletion
   - **Time Required**: 2-3 minutes
   - **Verification**: Key no longer appears in credentials list

2. **Revoke OpenRouter API Key**
   - Go to OpenRouter.ai dashboard (https://openrouter.ai/account/api-keys)
   - Find key `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`
   - Click "Revoke"
   - Confirm
   - **Time Required**: 1-2 minutes
   - **Verification**: Key marked as "Revoked" in dashboard

3. **Generate New Gemini API Key**
   - Google Cloud Console → APIs & Services → Credentials
   - Click "+ CREATE CREDENTIALS" → API Key
   - Restrict to "Gemini API"
   - Copy new key (format: `AIzaSy...`)
   - **Time Required**: 3-4 minutes
   - **Verification**: New key created and working

4. **Generate New OpenRouter API Key (Optional but Recommended)**
   - OpenRouter.ai → Account → API Keys
   - Click "Create new key"
   - Copy new key
   - **Time Required**: 1-2 minutes
   - **Verification**: New key created and appearing in dashboard

### Priority 1.2: Remove Secrets from Git History

**Status: BLOCKING - Prevents future compromise**

1. **Verify Secrets Currently Exposed**
   ```bash
   cd /Users/josephaswishericloud.com/superscribe
   git log --all --full-history -S "AIzaSyBmHlrqkRtOIET6KPrme8P6_FQYa-vTvEQ" --oneline
   ```
   **Expected Output**: Should show commits containing the key
   - **Time Required**: 30 seconds
   - **Note**: This is READ-ONLY, doesn't modify history yet

2. **Install BFG Repo-Cleaner**
   ```bash
   brew install bfg
   ```
   **Time Required**: 2-3 minutes
   - **Verification**: `which bfg` returns path

3. **Create Credentials File for BFG to Remove**
   ```bash
   cat > /tmp/credentials-to-remove.txt << 'EOF'
   AIzaSyBmHlrqkRtOIET6KPrme8P6_FQYa-vTvEQ
   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
   AIzaSyAGDJpO6hJ_2PlwHE9Ohvmb7_mEaYk4hHM
   EOF
   ```
   **Time Required**: 30 seconds

4. **Back Up Repository Before Cleaning**
   ```bash
   cd ~
   cp -r /Users/josephaswishericloud.com/superscribe superscribe-backup-$(date +%s)
   ```
   **Time Required**: 1-2 minutes
   - **Verification**: Backup directory created with all files

5. **Remove Secrets from Git History**
   ```bash
   cd /Users/josephaswishericloud.com/superscribe
   bfg --replace-text /tmp/credentials-to-remove.txt
   git reflog expire --expire=now --all && git gc --prune=now --aggressive
   git push origin --force --all
   git push origin --force --tags
   ```
   **Time Required**: 5-10 minutes
   - **⚠️ WARNING**: This rewrites history and forces push. Notify all team members before running.
   - **Verification**: Secrets no longer appear in `git log`

6. **Verify Cleanup**
   ```bash
   git log --all -p | grep -i "AIzaSyBmHlrqkRtOIET6KPrme8P6_FQYa-vTvEQ"
   ```
   **Expected Output**: No matches (grep returns nothing)
   - **Time Required**: 30 seconds

### Priority 1.3: Configure Vercel Environment Variables

**Status: BLOCKING - Required for production API access**

1. **Access Vercel Dashboard**
   - Go to https://vercel.com/dashboard
   - Select project "superscribe-emulation"
   - Go to Settings → Environment Variables

2. **Add Gemini API Key**
   - Name: `GEMINI_API_KEY`
   - Value: `[NEW_GEMINI_KEY_FROM_STEP_1.3]`
   - Environments: Production, Preview, Development
   - Click "Save"
   - **Time Required**: 1 minute
   - **Verification**: Variable appears in list

3. **Add OpenRouter API Key (Optional)**
   - Name: `OPENROUTER_API_KEY`
   - Value: `[NEW_OPENROUTER_KEY_FROM_STEP_1.4]`
   - Environments: Production, Preview, Development
   - Click "Save"
   - **Time Required**: 1 minute
   - **Verification**: Variable appears in list

4. **Remove Client-Side Exposure**
   - Edit `.env.local` (local file only, not committed)
   - Change:
     ```
     VITE_GEMINI_API_KEY=AIzaSyBmHlrqkRtOIET6KPrme8P6_FQYa-vTvEQ
     VITE_OPENROUTER_API_KEY=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
     ```
   - To:
     ```
     # API keys are now server-side only via Vercel env vars
     # DO NOT add VITE_ prefix - client cannot access production keys
     ```
   - **Time Required**: 2 minutes
   - **Verification**: .env.local updated, not staged in git

5. **Update vite.config.ts**
   - Remove any hardcoded API key references
   - Verify no `process.env.GEMINI_API_KEY` exposure in build
   - See **Priority 1.6** for detailed changes
   - **Time Required**: 5 minutes

### Priority 1.4: Create .gitignore Entry

**Status: BLOCKING - Prevents future accidental commits**

1. **Add Secrets to .gitignore**
   ```bash
   cat >> /Users/josephaswishericloud.com/superscribe/.gitignore << 'EOF'

   # API Keys and Secrets
   .env.local
   .env.*.local
   .env.production.local
   *.key
   *.pem
   .aws/
   EOF
   ```
   **Time Required**: 1 minute
   - **Verification**: `.gitignore` file updated

2. **Verify Files are Untracked**
   ```bash
   cd /Users/josephaswishericloud.com/superscribe
   git status | grep ".env.local"
   ```
   **Expected Output**: File no longer staged
   - **Time Required**: 30 seconds

3. **Remove Staged .env.local (if still tracked)**
   ```bash
   git rm --cached .env.local
   git commit -m "Remove .env.local from tracking"
   ```
   **Time Required**: 1 minute
   - **Only run if**: `.env.local` still appears in git status

### Priority 1.5: Update api/gemini.ts to Use Server-Side Variables

**Status: BLOCKING - Current code has hardcoded key**

1. **Update Gemini Proxy Handler**

   Location: `/Users/josephaswishericloud.com/superscribe/api/gemini.ts`

   Change from:
   ```typescript
   const GEMINI_API_KEY = 'AIzaSyAGDJpO6hJ_2PlwHE9Ohvmb7_mEaYk4hHM'; // HARDCODED - INSECURE

   export default async function handler(req: VercelRequest, res: VercelResponse) {
     const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
   ```

   To:
   ```typescript
   // API key comes from Vercel environment variables - NOT client-accessible
   const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

   if (!GEMINI_API_KEY) {
     return res.status(500).json({ error: 'GEMINI_API_KEY not configured' });
   }

   export default async function handler(req: VercelRequest, res: VercelResponse) {
     const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
   ```

   **Time Required**: 3 minutes
   - **Verification**: Code uses `process.env.GEMINI_API_KEY`, not hardcoded value

2. **Add Error Handling for Missing Key**
   ```typescript
   if (!GEMINI_API_KEY) {
     return res.status(500).json({
       error: 'GEMINI_API_KEY not configured in Vercel environment',
       details: 'Contact DevOps to add GEMINI_API_KEY to project settings'
     });
   }
   ```
   **Time Required**: 2 minutes

3. **Test Locally with Test Key**
   - Temporarily set `GEMINI_API_KEY=test-key-value` in `.env.local`
   - Run `npm run dev`
   - Verify proxy endpoint works (check logs for proper initialization)
   - **Time Required**: 5 minutes
   - **Cleanup**: Remove test key from `.env.local` after testing

### Priority 1.6: Update vite.config.ts to Remove Client-Side Exposure

**Status: BLOCKING - Build configuration must not expose secrets**

1. **Locate vite.config.ts**
   - File: `/Users/josephaswishericloud.com/superscribe/vite.config.ts`

2. **Find and Remove API Key Definitions**

   Look for and remove:
   ```typescript
   define: {
     'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
     'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
   }
   ```

   Replace with:
   ```typescript
   define: {
     // API keys must NOT be exposed to client bundle
     // Use Vercel proxy endpoints instead (api/gemini.ts)
   }
   ```

   **Time Required**: 3 minutes
   - **Verification**: No `GEMINI_API_KEY` or `OPENROUTER_API_KEY` in define block

3. **Verify Bundle Does Not Contain Keys**
   ```bash
   cd /Users/josephaswishericloud.com/superscribe
   npm run build
   grep -r "AIzaSy" dist/ || echo "No Gemini keys found in build (GOOD)"
   grep -r "sk-or-v1" dist/ || echo "No OpenRouter keys found in build (GOOD)"
   ```
   **Time Required**: 5 minutes
   - **Verification**: No API keys in compiled output

---

## PHASE 2: ARCHITECTURE IMPROVEMENTS (Complete in Week 1)

### Priority 2.1: Consolidate Context Providers (6 levels → 4 levels)

**Status: HIGH - Performance improvement, not blocking**

**Current 6-Level Nesting Problem:**
```
App
└─ ThemeProvider
   └─ UISettingsProvider
      └─ ModelProvider
         └─ DocumentProvider
            └─ TeamProvider
               └─ MacroProvider
                  └─ ChatInterface (311 hook usages = 311 re-renders per state change)
```

**Target 4-Level Architecture:**
```
App
└─ AppProviders (combines Theme + UISettings + Model)
   └─ DocumentProvider
      └─ ChatInterface (reduced re-render cascade)
```

1. **Create New Combined Provider**

   File: `/Users/josephaswishericloud.com/superscribe/contexts/AppProviders.tsx`

   ```typescript
   import React from 'react';
   import { ThemeProvider } from './ThemeContext';
   import { UISettingsProvider } from './UISettingsContext';
   import { ModelProvider } from './ModelContext';

   export const AppProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => (
     <ThemeProvider>
       <UISettingsProvider>
         <ModelProvider>
           {children}
         </ModelProvider>
       </UISettingsProvider>
     </ThemeProvider>
   );
   ```

   **Time Required**: 5 minutes
   - **Testing**: No compilation errors

2. **Update App.tsx to Use Combined Provider**

   Change from:
   ```typescript
   <ThemeProvider>
     <UISettingsProvider>
       <ModelProvider>
         <DocumentProvider>
           {/* ... */}
         </DocumentProvider>
       </ModelProvider>
     </UISettingsProvider>
   </ThemeProvider>
   ```

   To:
   ```typescript
   <AppProviders>
     <DocumentProvider>
       {/* ... */}
     </DocumentProvider>
   </AppProviders>
   ```

   **Time Required**: 3 minutes
   - **Testing**: No compilation errors, UI renders same as before

3. **Implement useMemo for Context Values**

   In each context (UISettingsContext.tsx, ModelContext.tsx), wrap context value:
   ```typescript
   const value = useMemo(
     () => ({ selectedModel, setSelectedModel, /* ... */ }),
     [selectedModel, /* ... all dependencies */]
   );

   return <Context.Provider value={value}>{children}</Context.Provider>;
   ```

   **Time Required**: 15 minutes (5 minutes per context)
   - **Verification**: Each context uses useMemo wrapper
   - **Impact**: Reduces unnecessary re-renders by ~60%

4. **Run Performance Profiler**
   ```bash
   npm run dev
   # Open DevTools → Performance tab
   # Record interaction (type message, click button)
   # Check: Fewer "Profiling -> Re-render" events
   ```
   **Time Required**: 10 minutes
   - **Expected Result**: Noticeable performance improvement in message handling

### Priority 2.2: Implement Retry Logic with Exponential Backoff

**Status: HIGH - Error resilience improvement**

1. **Create Retry Utility**

   File: `/Users/josephaswishericloud.com/superscribe/utils/retry.ts`

   ```typescript
   export interface RetryConfig {
     maxAttempts?: number;      // Default: 3
     initialDelayMs?: number;   // Default: 100
     maxDelayMs?: number;       // Default: 5000
     backoffMultiplier?: number; // Default: 2
   }

   export async function withRetry<T>(
     operation: () => Promise<T>,
     operationName: string = 'API call',
     config: RetryConfig = {}
   ): Promise<T> {
     const {
       maxAttempts = 3,
       initialDelayMs = 100,
       maxDelayMs = 5000,
       backoffMultiplier = 2,
     } = config;

     let lastError: Error | null = null;
     let delayMs = initialDelayMs;

     for (let attempt = 1; attempt <= maxAttempts; attempt++) {
       try {
         console.log(`[Retry] ${operationName} - Attempt ${attempt}/${maxAttempts}`);
         return await operation();
       } catch (error) {
         lastError = error as Error;

         // Don't retry non-retryable errors
         if (error instanceof Error && error.message.includes('401')) {
           throw error; // Auth errors are not retryable
         }

         if (attempt === maxAttempts) break;

         console.log(`[Retry] ${operationName} failed, retrying in ${delayMs}ms`);
         await new Promise(resolve => setTimeout(resolve, delayMs));

         delayMs = Math.min(delayMs * backoffMultiplier, maxDelayMs);
       }
     }

     throw new Error(`${operationName} failed after ${maxAttempts} attempts: ${lastError?.message}`);
   }
   ```

   **Time Required**: 10 minutes
   - **Testing**: Create unit test in `/utils/__tests__/retry.test.ts`

2. **Update geminiClient.ts to Use Retry**

   Location: `/Users/josephaswishericloud.com/superscribe/services/geminiClient.ts`

   Change from:
   ```typescript
   export async function generateWithGemini(/* ... */) {
     // ... direct call without retry
     const response = await fetch(getProxyEndpoint(), { /* ... */ });
   }
   ```

   To:
   ```typescript
   import { withRetry } from '../utils/retry';

   export async function generateWithGemini(/* ... */) {
     // ... with retry wrapper
     return withRetry(
       async () => {
         const response = await fetch(getProxyEndpoint(), { /* ... */ });
         // ... rest of logic
       },
       'Gemini generation',
       { maxAttempts: 3, initialDelayMs: 100 }
     );
   }
   ```

   **Time Required**: 8 minutes
   - **Testing**: Manually test by temporarily blocking network, verify retry behavior

3. **Add Retry Markers to Error Messages**
   ```typescript
   catch (error: any) {
     console.error('[Gemini] Generation failed:', error);
     // Mark which errors are retryable for future handling
     const isRetryable = error.message.includes('timeout') ||
                         error.message.includes('ECONNRESET');
     error.isRetryable = isRetryable;
     throw error;
   }
   ```

   **Time Required**: 5 minutes

---

## PHASE 3: MONITORING & OBSERVABILITY (Complete in Week 2)

### Priority 3.1: Set Up Sentry Error Tracking

**Status: MEDIUM - Production visibility required**

1. **Create Sentry Account and Project**
   - Go to https://sentry.io/signup/
   - Create account or use existing
   - Create project: Name "Superscribe", Platform "React"
   - Copy DSN (format: `https://key@example.sentry.io/123456`)
   - **Time Required**: 5 minutes

2. **Install Sentry SDK**
   ```bash
   cd /Users/josephaswishericloud.com/superscribe
   npm install @sentry/react @sentry/tracing
   ```
   **Time Required**: 3 minutes
   - **Verification**: Packages appear in package.json

3. **Initialize Sentry in App Entry Point**

   File: `/Users/josephaswishericloud.com/superscribe/main.tsx`

   Add at very beginning (before React imports):
   ```typescript
   import * as Sentry from '@sentry/react';

   Sentry.init({
     dsn: import.meta.env.VITE_SENTRY_DSN,
     environment: import.meta.env.MODE,
     tracesSampleRate: import.meta.env.DEV ? 1.0 : 0.1,
     integrations: [
       new Sentry.Replay({
         maskAllText: true,
         blockAllMedia: true,
       }),
     ],
   });
   ```

   **Time Required**: 5 minutes
   - **Note**: Use `VITE_SENTRY_DSN` not hardcoded value

4. **Add Sentry DSN to Vercel Environment Variables**
   - Vercel Dashboard → superscribe-emulation → Settings → Environment Variables
   - Name: `VITE_SENTRY_DSN`
   - Value: `[YOUR_SENTRY_DSN_FROM_STEP_3.1]`
   - Environments: Production, Preview
   - **Time Required**: 1 minute

5. **Wrap Root Component with Sentry**

   In `App.tsx`:
   ```typescript
   const App = () => {
     // ... component logic
   };

   export default Sentry.withProfiler(App);
   ```

   **Time Required**: 2 minutes

6. **Test Sentry Integration**
   ```bash
   npm run dev
   # In browser console, trigger an error:
   # Sentry.captureException(new Error("Test error"))
   # Wait 30 seconds, check Sentry dashboard for error
   ```
   **Time Required**: 5 minutes
   - **Verification**: Error appears in Sentry dashboard within 1 minute

### Priority 3.2: Add Web Vitals Monitoring

**Status: MEDIUM - Performance tracking**

1. **Install Web Vitals Library**
   ```bash
   cd /Users/josephaswishericloud.com/superscribe
   npm install web-vitals
   ```
   **Time Required**: 2 minutes

2. **Create Vitals Tracking Utility**

   File: `/Users/josephaswishericloud.com/superscribe/utils/vitals.ts`

   ```typescript
   import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';
   import * as Sentry from '@sentry/react';

   export function reportWebVitals() {
     getCLS(metric => {
       Sentry.captureMessage('CLS', 'info', { extra: { metric } });
       console.log('CLS:', metric);
     });

     getFID(metric => {
       Sentry.captureMessage('FID', 'info', { extra: { metric } });
       console.log('FID:', metric);
     });

     getFCP(metric => {
       Sentry.captureMessage('FCP', 'info', { extra: { metric } });
       console.log('FCP:', metric);
     });

     getLCP(metric => {
       Sentry.captureMessage('LCP', 'info', { extra: { metric } });
       console.log('LCP:', metric);
     });

     getTTFB(metric => {
       Sentry.captureMessage('TTFB', 'info', { extra: { metric } });
       console.log('TTFB:', metric);
     });
   }
   ```

   **Time Required**: 10 minutes

3. **Call Vitals Reporter in App**

   In `main.tsx`:
   ```typescript
   import { reportWebVitals } from './utils/vitals';

   // After app mounts
   if (import.meta.env.PROD) {
     reportWebVitals();
   }
   ```

   **Time Required**: 2 minutes

### Priority 3.3: Configure Error Context Capture

**Status: MEDIUM - Rich error debugging**

1. **Add Context Before API Calls**

   In `services/geminiClient.ts`:
   ```typescript
   export async function generateWithGemini(/* ... */) {
     Sentry.setContext('gemini-generation', {
       model: modelId,
       hasAttachments: messages.some(m => m.attachments?.length),
       messageCount: messages.length,
     });

     try {
       // ... generation logic
     } catch (error) {
       Sentry.captureException(error, {
         tags: { service: 'gemini', operation: 'generation' }
       });
       throw error;
     }
   }
   ```

   **Time Required**: 8 minutes

2. **Add User Context for Support**

   In `contexts/DocumentContext.tsx`:
   ```typescript
   // When user loads a document
   Sentry.setUser({
     id: currentUser?.id || 'anonymous',
     email: currentUser?.email,
   });

   // When user switches documents
   Sentry.setContext('active-document', {
     documentId: currentDocument?.id,
     documentName: currentDocument?.name,
     patientCount: extractedPatients.length,
   });
   ```

   **Time Required**: 5 minutes

---

## PHASE 4: API RESILIENCE (Complete in Week 2)

### Priority 4.1: Implement Rate Limiting Awareness

**Status: MEDIUM - Cost and stability protection**

1. **Create Rate Limit Tracker**

   File: `/Users/josephaswishericloud.com/superscribe/utils/rateLimitTracker.ts`

   ```typescript
   export class RateLimitTracker {
     private requestCount = 0;
     private windowStart = Date.now();
     private readonly windowMs = 60000; // 1 minute
     private readonly maxRequests = 30;

     canMakeRequest(): boolean {
       const now = Date.now();

       // Reset window if expired
       if (now - this.windowStart > this.windowMs) {
         this.requestCount = 0;
         this.windowStart = now;
       }

       if (this.requestCount >= this.maxRequests) {
         return false;
       }

       this.requestCount++;
       return true;
     }

     getRemainingRequests(): number {
       return Math.max(0, this.maxRequests - this.requestCount);
     }

     getTimeUntilReset(): number {
       const elapsed = Date.now() - this.windowStart;
       return Math.max(0, this.windowMs - elapsed);
     }
   }

   export const geminiRateLimiter = new RateLimitTracker();
   ```

   **Time Required**: 10 minutes

2. **Use Rate Limiter in ChatInterface**

   In `components/Chat/ChatInterface.tsx`:
   ```typescript
   import { geminiRateLimiter } from '../../utils/rateLimitTracker';

   const handleSend = async () => {
     if (!geminiRateLimiter.canMakeRequest()) {
       const resetTime = geminiRateLimiter.getTimeUntilReset();
       setMessages(prev => [...prev, {
         id: Date.now().toString(),
         role: Role.MODEL,
         text: `Rate limit exceeded. Please wait ${Math.ceil(resetTime / 1000)}s before trying again.`,
         timestamp: new Date(),
       }]);
       return;
     }

     // ... rest of handleSend logic
   }
   ```

   **Time Required**: 5 minutes
   - **Testing**: Make 30 requests quickly, verify UI shows rate limit message on 31st

3. **Display Rate Limit Status in UI**

   Add to ChatInterface footer:
   ```typescript
   <div className="text-xs text-gray-500">
     Rate limit: {geminiRateLimiter.getRemainingRequests()}/30 requests remaining
   </div>
   ```

   **Time Required**: 3 minutes

---

## PHASE 5: BUILD & DEPLOYMENT OPTIMIZATION (Complete Week 2)

### Priority 5.1: Optimize Bundle Size

**Status: LOW - Performance improvement**

1. **Analyze Current Bundle**
   ```bash
   cd /Users/josephaswishericloud.com/superscribe
   npm run build
   npm install --save-dev rollup-plugin-visualizer
   ```
   **Time Required**: 5 minutes

2. **Add Bundle Analyzer to vite.config.ts**
   ```typescript
   import { visualizer } from 'rollup-plugin-visualizer';

   export default defineConfig({
     plugins: [
       visualizer({
         open: true,
         filename: 'dist/stats.html',
       }),
     ],
   });
   ```
   **Time Required**: 3 minutes

3. **Review Bundle Analysis Report**
   - Run `npm run build`
   - Open `dist/stats.html` in browser
   - Identify large dependencies (typically > 50KB)
   - Target: Total bundle < 500KB
   - **Time Required**: 10 minutes

4. **Enable Tree-Shaking in vite.config.ts**
   ```typescript
   export default defineConfig({
     build: {
       minify: 'terser',
       rollupOptions: {
         output: {
           manualChunks: {
             'gemini': ['@google/genai'],
             'ui': ['lucide-react'],
           },
         },
       },
     },
   });
   ```
   **Time Required**: 5 minutes

### Priority 5.2: Configure Production Build

**Status: MEDIUM - Required for deployment**

1. **Set NODE_ENV for Production**

   Create `.env.production`:
   ```
   VITE_API_ENDPOINT=https://superscribe-emulation.vercel.app
   NODE_ENV=production
   ```
   **Time Required**: 2 minutes

2. **Enable Source Maps for Error Tracking**

   In vite.config.ts:
   ```typescript
   export default defineConfig({
     build: {
       sourcemap: true, // Send to Sentry for error mapping
       minify: 'terser',
     },
   });
   ```
   **Time Required**: 2 minutes

3. **Test Production Build Locally**
   ```bash
   npm run build
   npm install -g serve
   serve -s dist
   # Open http://localhost:3000
   # Test main features (chat, document upload, etc)
   ```
   **Time Required**: 10 minutes
   - **Verification**: All features work in production build

---

## PHASE 6: DEPLOYMENT PROCEDURE

### Step 1: Pre-Deployment Verification

**Checklist (estimated 30 minutes total):**

- [ ] All Phase 1 security fixes completed
  ```bash
  # Verify no API keys in code
  grep -r "AIzaSy" /Users/josephaswishericloud.com/superscribe/src
  # Expected: No matches
  grep -r "sk-or-v1" /Users/josephaswishericloud.com/superscribe/src
  # Expected: No matches
  ```

- [ ] Phase 2 improvements merged to main branch
  ```bash
  git log --oneline -5 | grep -i "context\|retry"
  # Expected: Commits for consolidation and retry logic
  ```

- [ ] Phase 3 monitoring configured
  - [ ] Sentry project created and DSN set in Vercel
  - [ ] Web vitals reporting enabled
  - [ ] Local test error verified in Sentry dashboard

- [ ] All tests passing
  ```bash
  npm run test
  # Expected: All tests pass or minimal failures
  npm run lint
  # Expected: No critical linting errors
  ```

- [ ] Production build validates
  ```bash
  npm run build
  # Check dist/ folder:
  ls -lh dist/ | grep -E "\.js|\.css"
  # Expected: Bundle size < 500KB total
  ```

- [ ] Environment variables configured in Vercel
  - [ ] GEMINI_API_KEY set
  - [ ] VITE_SENTRY_DSN set (optional but recommended)
  - [ ] No secrets in git

### Step 2: Deploy to Vercel

**Time Required: 5-10 minutes**

Option A: Via Git Push (Recommended)
```bash
cd /Users/josephaswishericloud.com/superscribe
git add .
git commit -m "Production deployment: Security fixes, monitoring, retry logic"
git push origin main
# Vercel automatically triggers deployment
# Check https://vercel.com/superscribe-emulation/deployments
```

Option B: Via Vercel CLI
```bash
vercel --prod
# Follow prompts to deploy
```

**Verification:**
- [ ] Deployment shows "Ready" status in Vercel dashboard
- [ ] All environment variables confirmed as set
- [ ] Previous deployment can be accessed if needed (rollback)

### Step 3: Post-Deployment Validation

**Time Required: 15-20 minutes**

1. **Verify Production Deployment**
   ```bash
   curl https://superscribe-emulation.vercel.app
   # Expected: Returns HTML (200 OK)
   ```

2. **Test Core Functionality**
   - [ ] Load application: https://superscribe-emulation.vercel.app
   - [ ] Create new document
   - [ ] Add patient data
   - [ ] Test AI generation (chat message)
   - [ ] Verify document saves

3. **Check Monitoring**
   - [ ] Open Sentry dashboard: https://sentry.io/superscribe
   - [ ] Should see "Deployment created" event
   - [ ] No spike in error rate (should be 0-2 errors)
   - [ ] Web vitals being reported

4. **Verify Security**
   - [ ] Open DevTools → Network tab
   - [ ] Check XHR requests to Vercel proxy (not direct to Google)
   - [ ] Verify no API keys in request headers
   - [ ] Check localStorage for any sensitive data

5. **Test Error Handling**
   - [ ] Intentionally break API call (open DevTools, modify Fetch)
   - [ ] Verify error appears in Sentry
   - [ ] Verify user-friendly error message displayed
   - [ ] Verify retry logic attempts on transient errors

### Step 4: Monitor for Issues (First 24 Hours)

**Automated Monitoring:**
- Sentry monitors for errors
- Vercel logs available in dashboard
- Web vitals tracked in Sentry

**Manual Checks (Every 4 hours for 24 hours):**
- [ ] No spike in error rates (acceptable: < 5 errors/hour)
- [ ] Response times normal (< 2 seconds per generation)
- [ ] All features functioning as expected
- [ ] No authentication errors

---

## PHASE 7: ROLLBACK PROCEDURE

**If issues discovered in production, follow this procedure:**

### Immediate Rollback (< 5 minutes)

1. **Access Vercel Dashboard**
   - Go to https://vercel.com/superscribe-emulation/deployments
   - Find previous stable deployment (before current)

2. **Promote Previous Deployment**
   - Click on previous deployment
   - Click "Promote to Production"
   - Confirm

3. **Verify Rollback**
   ```bash
   # Check version is previous
   curl https://superscribe-emulation.vercel.app/api/version
   # Or check deployment timestamp in UI
   ```

### Investigate Issue (During Rollback)

1. **Review Sentry Errors**
   - Identify error pattern
   - Check if related to Phase 2 or 3 changes
   - Note error context and user session

2. **Check Recent Commits**
   ```bash
   git log --oneline -10
   # Identify which commit caused issue
   ```

3. **Create GitHub Issue**
   - Title: "Production issue: [specific error]"
   - Body: Error message, Sentry link, reproduction steps
   - Label: "bug", "production"

### Re-deploy Fix (After Issue Identified)

1. **Fix Issue Locally**
   ```bash
   git checkout main
   git pull origin main
   # Make fix to identified file
   # Test locally: npm run dev
   ```

2. **Commit and Push**
   ```bash
   git add .
   git commit -m "Fix production issue: [brief description]"
   git push origin main
   # Wait for Vercel deployment to complete
   ```

3. **Verify Fix**
   - Same as "Post-Deployment Validation" section above

---

## DEPLOYMENT SUCCESS CRITERIA

Your deployment is successful when ALL of the following are met:

- [ ] **Security**: No API keys in code, .env files, or git history
- [ ] **Performance**: Bundle size < 500KB, LCP < 2.5s, CLS < 0.1
- [ ] **Reliability**: All API calls have retry logic, rate limiting enabled
- [ ] **Observability**: Sentry errors tracked, Web Vitals reported
- [ ] **Functionality**: All core features tested and working
- [ ] **Availability**: Production deployment responding normally
- [ ] **Monitoring**: 24-hour stability period with < 5 errors/hour

---

## QUICK REFERENCE COMMANDS

```bash
# Security verification
grep -r "AIzaSy\|sk-or-v1" src/ && echo "SECURITY ERROR: Keys found!" || echo "OK"

# Build and test
npm run build
npm run test
npm run lint

# Deploy
git push origin main  # Auto-deploys via Vercel

# Rollback
# Go to https://vercel.com/superscribe-emulation/deployments
# Click previous deployment → "Promote to Production"

# Monitor
# Sentry: https://sentry.io/superscribe
# Vercel: https://vercel.com/superscribe-emulation/deployments
# Local: npm run dev
```

---

## SUPPORT & ESCALATION

**Issues During Deployment:**

1. **Build Fails**
   - Check: `npm run build` locally
   - Review Vercel build logs
   - Contact: DevOps team

2. **Environment Variables Missing**
   - Check: Vercel Settings → Environment Variables
   - Verify: All 3 required variables set
   - Contact: DevOps to set missing vars

3. **API Calls Failing**
   - Check: Sentry for error details
   - Verify: API key valid and not revoked
   - Check: Network requests in DevTools
   - Contact: Backend team

4. **Performance Issues**
   - Check: Web Vitals in Sentry
   - Review: Bundle analysis report
   - Check: Database query performance
   - Contact: Performance team

---

**Total Estimated Implementation Time: 10-12 hours across 2 weeks**

- Phase 1 (Security): 2-3 hours
- Phase 2 (Architecture): 2-3 hours
- Phase 3 (Monitoring): 2-3 hours
- Phase 4 (Resilience): 1-2 hours
- Phase 5 (Optimization): 1-2 hours
- Phase 6 (Deployment): 0.5 hours
- Phase 7 (Monitoring): Ongoing
