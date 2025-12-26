# CRITICAL: Multiple API Keys Exposed in Git History

**Severity:** P0 - CRITICAL
**CVSS Score:** 8.9 (High)
**CWE:** CWE-798 (Use of Hard-coded Credentials)
**OWASP:** A07:2021 - Identification and Authentication Failures

## Location
- **Commits:** 0c46e45, 4988114, and potentially others
- **File:** `api/gemini.ts` (historical versions)

## Impact
- **PERSISTENT EXPOSURE**: Even after removing keys from current code, they remain in git history
- **Public Repository**: If repository is or becomes public, all historical keys are exposed
- **Compliance**: HIPAA audit trail shows insecure credential management
- **Attack Vector**: Attackers routinely scan git history for exposed credentials

## Evidence
```bash
# Recent commits show key handling
0c46e45 Hardcode new Gemini API key
4988114 Remove leaked API key, require env var
```

## Remediation Steps

### 1. IMMEDIATE - Revoke ALL Historical Keys (10 minutes)
```bash
# Go to: https://makersuite.google.com/app/apikey
# Review and revoke ALL keys created before today
# Generate ONE new key for current use
```

### 2. Clean Git History (30 minutes) - HIGH PRIORITY
```bash
# Install BFG Repo-Cleaner
brew install bfg  # macOS
# or download from: https://rtyley.github.io/bfg-repo-cleaner/

# Backup repository first
cd /Users/josephaswishericloud.com
cp -r superscribe superscribe-backup

# Remove all instances of API keys from history
cd superscribe
echo "AIzaSyAGDJpO6hJ_2PlwHE9Ohvmb7_mEaYk4hHM" > api-keys.txt
echo "AIzaSy*" >> api-keys.txt  # Pattern to match any Gemini keys

bfg --replace-text api-keys.txt .git

# Clean up
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# Force push (CAUTION: coordinate with team)
git push origin --force --all
git push origin --force --tags

# Delete backup file
rm api-keys.txt
```

### 3. Prevent Future Leaks - Pre-commit Hooks (15 minutes)
```bash
# Install git-secrets
brew install git-secrets  # macOS

# Configure for repository
cd /Users/josephaswishericloud.com/superscribe
git secrets --install
git secrets --register-aws

# Add custom pattern for Gemini keys
git secrets --add 'AIzaSy[0-9A-Za-z_-]{33}'

# Scan existing files
git secrets --scan
```

### 4. Add to CI/CD Pipeline
```yaml
# .github/workflows/security-scan.yml
name: Security Scan
on: [push, pull_request]
jobs:
  secret-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 0  # Full history
      - name: TruffleHog Secret Scan
        uses: trufflesecurity/trufflehog@main
        with:
          path: ./
          base: main
          head: HEAD
```

## Verification
```bash
# Verify no keys in current history
git log -p | grep -i "AIzaSy"

# Verify pre-commit hook is active
git secrets --list

# Test hook
echo "AIzaSyTEST_KEY_123456789" > test.txt
git add test.txt
git commit -m "test"  # Should be blocked
rm test.txt
```

## Estimated Fix Time
- Revoke keys: 10 minutes
- Clean git history: 30 minutes
- Configure pre-commit hooks: 15 minutes
- CI/CD setup: 20 minutes
- **Total: 75 minutes**

## WARNING
Force pushing rewrites history and affects all collaborators. Coordinate with team before executing `git push --force`.

## Labels
`security`, `critical`, `P0`, `git-security`, `credentials`, `HIPAA`
