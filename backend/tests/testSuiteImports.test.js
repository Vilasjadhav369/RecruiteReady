import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SCRIPTS_DIR = path.resolve(__dirname, '../src/scripts');

const HELPERS = ['assertTestDatabase', 'createTestSession'];

export const verifySuiteHelperImports = (sourceCode) => {
  const issues = [];
  for (const helper of HELPERS) {
    const callRegex = new RegExp(`\\b${helper}\\s*\\(`, 'm');
    const importRegex = new RegExp(`import\\s+[^;]*\\b${helper}\\b[^;]*from\\s+['\"][^'\"]*testHelpers(?:\\.js)?['\"]`, 'm');

    const callsHelper = callRegex.test(sourceCode);
    const importsHelper = importRegex.test(sourceCode);

    if (callsHelper && !importsHelper) {
      issues.push(`calls ${helper}() but does not import it from testHelpers.js`);
    }
  }
  return issues;
};

describe('Test Suite Helper Imports Static Check', () => {
  it('detects missing imports in mock source code', () => {
    const badCode = `
      assertTestDatabase();
      const token = await createTestSession(user);
    `;
    const issues = verifySuiteHelperImports(badCode);
    expect(issues).toHaveLength(2);
    expect(issues[0]).toContain('assertTestDatabase');
    expect(issues[1]).toContain('createTestSession');

    const goodCode = `
      import { assertTestDatabase, createTestSession } from './testHelpers.js';
      assertTestDatabase();
      const token = await createTestSession(user);
    `;
    expect(verifySuiteHelperImports(goodCode)).toHaveLength(0);
  });

  it('ensures every script matching src/scripts/test*Suite.js imports every helper it calls', () => {
    const files = fs
      .readdirSync(SCRIPTS_DIR)
      .filter((file) => file.startsWith('test') && file.endsWith('Suite.js'));

    expect(files.length).toBeGreaterThan(0);

    const violations = [];

    for (const file of files) {
      const fullPath = path.join(SCRIPTS_DIR, file);
      const content = fs.readFileSync(fullPath, 'utf8');
      const issues = verifySuiteHelperImports(content);

      if (issues.length > 0) {
        violations.push({ file, issues });
      }
    }

    expect(
      violations,
      `Found test suite scripts with missing imports:\n${violations
        .map((v) => `  - ${v.file}: ${v.issues.join(', ')}`)
        .join('\n')}`
    ).toEqual([]);
  });
});
