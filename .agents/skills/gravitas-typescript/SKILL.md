---
name: gravitas-typescript
description: Gravitas extension for TypeScript and JavaScript projects. Enforces strict type verification, tsconfig inspection, Vitest/Jest integration, and TypeScript-specific failure mode mitigations.
license: MIT
---

# Gravitas TypeScript & JavaScript Extension

This extension specializes the Gravitas reliability kernel for TypeScript and JavaScript projects (React, Node.js, Express, Vitest, etc.).

## 1. Grounding in TypeScript Projects
Before editing any TypeScript/JavaScript file:
- Check `tsconfig.json` or `package.json` for module resolution (`"type": "module"`, `target`, `moduleResolution`, `paths`).
- For TypeScript, run `tsc --noEmit` to verify type safety.
- For modern Node.js ES modules, run `node --check <file>` to syntax-check newly created or modified files.

## 2. Type-Driven Reconnaissance
- Check function signatures and imported types directly rather than guessing shapes.
- Pay attention to `null | undefined` checks, optional chaining, and async Promise return types.
- Avoid loose `any` casts that hide runtime boundary defects.

## 3. Test Runner Invariants (Vitest / Jest)
- When tests fail, run only the targeted test file during diagnosis: `npx vitest run path/to/test.test.js`.
- Run the full test suite (`npm test`) before claiming completion.
- Never weaken assertions, delete tests, or comment out failing checks to achieve green status.
