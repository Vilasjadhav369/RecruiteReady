# Gravitas Verification Engine

The Verification Engine enforces proof-based completion. No task is complete without an observed `VERDICT: PASS`.

## Evidence Quality Gates

1. **Freshness Invariant:**
   Verification must execute *after* the most recent code edit. Any file modification invalidates prior verification.

2. **Completeness Invariant:**
   - Unit tests pass.
   - Lint and type checks succeed with zero errors.
   - No regressions introduced in untouched modules.

3. **Deterministic Verdicts:**
   Every verification output must end with:
   ```text
   VERDICT: PASS
   ```
   or
   ```text
   VERDICT: FAIL - [specific failure description]
   ```

## Failure Diagnosis Protocol
When verification fails:
1. Do not repeat the exact same command.
2. Isolate the exact failing assertion, error message, and stack trace.
3. Formulate a single testable hypothesis.
4. Verify the hypothesis against the codebase before editing.
5. Apply the fix and rerun verification.
