# Failure Recovery Protocol

When an operation or command fails, follow this structured recovery procedure:

## Step 1: Halt and Prevent Degradation
- Stop any command loop immediately.
- Never re-execute the identical failing command without a diagnostic change.
- Check `git status` and `git diff` to ensure you know what files are currently modified.

## Step 2: Diagnostic Triangulation
- Read the entire error message and stack trace.
- Identify the exact line number, symbol, or condition that failed.
- Check whether the issue is environmental (network, permissions, sandbox) or programmatic (syntax, logic, types).

## Step 3: Minimal Remediation
- Make the smallest possible change that addresses the verified root cause.
- Do not make sweeping refactors while fixing a localized bug.
- Verify that your fix resolves the failure without breaking related tests.
