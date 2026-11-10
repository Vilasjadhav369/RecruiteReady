import { describe, it, expect } from 'vitest';
import {
  parseSuiteOutput,
  formatSuiteResultRow,
} from '../src/scripts/runIntegrationSuites.js';

describe('Integration Runner Crash Reporting Suite', () => {
  it('parses normal passing test suite results', () => {
    const stdout = `
      ...
      RESULTS: 46 PASSED / 0 FAILED (TOTAL: 46)
    `;
    const result = parseSuiteOutput(stdout, '', 0);

    expect(result.exitCode).toBe(0);
    expect(result.passed).toBe(46);
    expect(result.failed).toBe(0);
    expect(result.crashed).toBe(false);

    const row = formatSuiteResultRow({
      name: 'Admin Productivity 2.0',
      ...result,
    });
    expect(row).toContain('46');
    expect(row).toContain('0');
    expect(row).toContain('0 (PASS)');
    expect(row).not.toContain('CRASH');
  });

  it('parses test suite failures when structured results are printed', () => {
    const stdout = `
      RESULTS: 44 PASSED / 2 FAILED (TOTAL: 46)
    `;
    const result = parseSuiteOutput(stdout, '', 1);

    expect(result.exitCode).toBe(1);
    expect(result.passed).toBe(44);
    expect(result.failed).toBe(2);
    expect(result.crashed).toBe(false);

    const row = formatSuiteResultRow({
      name: 'Admin Productivity 2.0',
      ...result,
    });
    expect(row).toContain('44');
    expect(row).toContain('2');
    expect(row).toContain('1 (FAIL)');
    expect(row).not.toContain('CRASH');
  });

  it('marks a suite as CRASH with its first error line when crashing at startup (e.g. ReferenceError)', () => {
    const stderr = `
      file:///path/to/backend/src/scripts/testPhase10ObservabilitySuite.js:12
      assertTestDatabase();
      ^

      ReferenceError: assertTestDatabase is not defined
          at file:///path/to/backend/src/scripts/testPhase10ObservabilitySuite.js:12:1
          at ModuleJob.run (node:internal/modules/esm/module_job:234:12)
    `;
    const result = parseSuiteOutput('', stderr, 1);

    expect(result.exitCode).toBe(1);
    expect(result.crashed).toBe(true);
    // Crucially: MUST NOT report as 0 passed / 1 failed
    expect(result.passed).toBe(0);
    expect(result.failed).toBe(0);
    expect(result.firstErrorLine).toBe(
      'ReferenceError: assertTestDatabase is not defined'
    );

    const row = formatSuiteResultRow({
      name: 'Phase 10 Observability & Perf',
      ...result,
    });

    expect(row).toContain('CRASH');
    expect(row).toContain('ReferenceError: assertTestDatabase is not defined');
    expect(row).not.toMatch(/\|\s*0\s*\|\s*1\s*\|/); // MUST NOT show 0 passed / 1 failed in columns
  });

  it('extracts fallback first error line when no explicit Error prefix is found', () => {
    const stderr = `
      Fatal: segment fault or abnormal termination
      stack dump...
    `;
    const result = parseSuiteOutput('', stderr, 139);

    expect(result.exitCode).toBe(139);
    expect(result.crashed).toBe(true);
    expect(result.firstErrorLine).toBe(
      'Fatal: segment fault or abnormal termination'
    );

    const row = formatSuiteResultRow({
      name: 'Crashed Suite',
      ...result,
    });
    expect(row).toContain('CRASH');
    expect(row).toContain('Fatal: segment fault or abnormal termination');
  });
});
