import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as testHelpersModule from '../src/scripts/testHelpers.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SCRIPTS_DIR = path.resolve(__dirname, '../src/scripts');

// Dynamically discover all exported helper functions from testHelpers.js
const EXPORTED_HELPERS = Object.keys(testHelpersModule).filter(
  (key) => key !== 'default' && typeof testHelpersModule[key] === 'function'
);
export const HELPERS = EXPORTED_HELPERS.length > 0
  ? EXPORTED_HELPERS
  : ['assertTestDatabase', 'createTestSession'];

export const verifySuiteHelperImports = (sourceCode, helpers = HELPERS) => {
  const issues = [];

  // Check for default or namespace imports from testHelpers
  const defaultImportMatch = sourceCode.match(/import\s+(\w+)\s+from\s+['"][^'"]*testHelpers(?:\.js)?['"]/m);
  const namespaceImportMatch = sourceCode.match(/import\s+\*\s+as\s+(\w+)\s+from\s+['"][^'"]*testHelpers(?:\.js)?['"]/m);
  const defaultIdentifier = defaultImportMatch ? defaultImportMatch[1] : null;
  const namespaceIdentifier = namespaceImportMatch ? namespaceImportMatch[1] : null;

  for (const helper of helpers) {
    const directCallRegex = new RegExp(`\\b${helper}\\s*\\(`, 'm');
    const directImportRegex = new RegExp(`import\\s+[^;]*\\b${helper}\\b[^;]*from\\s+['"][^'"]*testHelpers(?:\\.js)?['"]`, 'm');

    const callsHelperDirectly = directCallRegex.test(sourceCode);
    const importsHelperDirectly = directImportRegex.test(sourceCode);

    // Check if called via default or namespace import (e.g. testHelpers.assertTestDatabase())
    const calledViaDefault = defaultIdentifier
      ? new RegExp(`\\b${defaultIdentifier}\\.${helper}\\s*\\(`, 'm').test(sourceCode)
      : false;
    const calledViaNamespace = namespaceIdentifier
      ? new RegExp(`\\b${namespaceIdentifier}\\.${helper}\\s*\\(`, 'm').test(sourceCode)
      : false;

    const callsHelper = callsHelperDirectly || calledViaDefault || calledViaNamespace;
    const importsHelper = importsHelperDirectly || (calledViaDefault && Boolean(defaultIdentifier)) || (calledViaNamespace && Boolean(namespaceIdentifier));

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

    const goodDefaultCode = `
      import testHelpers from './testHelpers.js';
      testHelpers.assertTestDatabase();
      const token = await testHelpers.createTestSession(user);
    `;
    expect(verifySuiteHelperImports(goodDefaultCode)).toHaveLength(0);
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

  it('ensures all test scripts in src/scripts/ import every helper they call', () => {
    const files = fs
      .readdirSync(SCRIPTS_DIR)
      .filter((file) => file.startsWith('test') && file.endsWith('.js') && file !== 'testHelpers.js');

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
      `Found test scripts with missing imports:\n${violations
        .map((v) => `  - ${v.file}: ${v.issues.join(', ')}`)
        .join('\n')}`
    ).toEqual([]);
  });
});
