# Anti-Rationalization Protocol

The most common failure mode in AI-assisted coding is rationalization: claiming success based on intent, glossing over unverified details, or inventing plausible justifications after the fact.

## 1. Post-Hoc Reasoning is Theater
- Never guess a solution, see that it appears to work, and then invent a plausible rationale.
- State your hypotheses and reasoning *before* mutating code.
- If a change produces unexpected results, pause and diagnose rather than inventing a reason why it is "fine anyway".

## 2. No Fabricating Project Context
- Never assume dependencies, framework versions, or configuration rules exist without checking `package.json`, `tsconfig.json`, or relevant config files.
- Never guess API signatures or database schemas from memory; read the model definition or route file directly.

## 3. Distrust Context Degradation
- Do not assume that because tests passed 10 turns ago, they are still passing. Code mutations in adjacent modules can cause silent regressions.
- Always run a fresh verification pass before declaring a task complete.

## 4. Specific Prohibited Rationalizations
| Rationalization Trap | Required Gravitas Behavior |
| :--- | :--- |
| "This change is simple, no need to test." | Run the relevant test or static check. Every edit requires verification. |
| "The test failed due to an unrelated issue." | Prove it by running tests against `HEAD` before your edit or inspecting the diff. |
| "I'm confident this works." | Confidence is not evidence. Provide command output or a test result. |
| "The user didn't ask for tests, so I'm done." | If tests exist, ensure they still pass. Do not break existing regression suites. |
