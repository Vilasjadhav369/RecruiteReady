/**
 * runIntegrationSuites.js — One-command safe runner for all RecruitReady integration suites.
 *
 * Safety & Execution Contract:
 * 1. Refuses to run unless the target database name contains "test" (case-insensitive).
 *    If MONGODB_URI is not set to a test DB, defaults to mongodb://127.0.0.1:27017/recruitready_test.
 *    Always explicitly passes MONGODB_URI in the environment of every child process so
 *    the real .env database can never be used.
 * 2. Seeds admin and dev content into the test database via child processes.
 * 3. Starts the API server (src/server.js) as a child process and polls /api/health.
 * 4. Runs the six integration suites sequentially (continues even if a suite fails).
 * 5. Shuts down the API server gracefully.
 * 6. Displays a summary table: suite | passed | failed | exit code, and overall totals.
 * 7. Exits non-zero if any suite fails.
 * 8. Does NOT drop the database automatically; prints the exact mongosh command to drop it.
 */

import { spawn } from 'child_process';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BACKEND_ROOT = path.resolve(__dirname, '../..');

// ── 1. Resolve & Validate Safe Test Database URI ─────────────────────────────

const resolveSafeMongoUri = () => {
  const DEFAULT_TEST_URI = 'mongodb://127.0.0.1:27017/recruitready_test';
  const rawUri = process.env.MONGODB_URI;

  if (!rawUri || !rawUri.trim()) {
    console.log(`[runner] MONGODB_URI not set. Using safe default: ${DEFAULT_TEST_URI}`);
    return DEFAULT_TEST_URI;
  }

  // Extract DB name from URI
  let dbName = '';
  try {
    const withoutQuery = rawUri.split('?')[0].split('#')[0];
    const slashIdx = withoutQuery.lastIndexOf('/');
    if (slashIdx !== -1) {
      dbName = withoutQuery.substring(slashIdx + 1);
    }
  } catch {
    dbName = '';
  }

  if (!dbName.toLowerCase().includes('test')) {
    if (process.env.ALLOW_NON_TEST_DB === '1') {
      console.warn('[runner] WARNING: ALLOW_NON_TEST_DB=1 is set. Proceeding against non-test DB.');
      return rawUri;
    }
    console.error(
      '\n[runner ERROR] Refusing to run integration suites: database name does NOT contain "test".\n' +
        'Set MONGODB_URI to a test database (e.g. mongodb://127.0.0.1:27017/recruitready_test)\n' +
        'or set ALLOW_NON_TEST_DB=1 to override.\n'
    );
    process.exit(1);
  }

  return rawUri;
};

const MONGODB_URI = resolveSafeMongoUri();
const TEST_API_URL = process.env.TEST_API_URL || 'http://localhost:5000';
const parsedApiUrl = new URL(TEST_API_URL);
const API_PORT = parsedApiUrl.port || '5000';

const childEnv = {
  ...process.env,
  NODE_ENV: 'test',
  MONGODB_URI,
  TEST_API_URL,
  ADMIN_EMAIL: process.env.ADMIN_EMAIL || 'admin@recruiteready.local',
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || 'AdminPassword2026!',
};

// ── Parsing & Formatting Helpers ──────────────────────────────────────────

export const parseSuiteOutput = (stdoutBuffer = '', stderrBuffer = '', exitCode = 0) => {
  let passed = 0;
  let failed = 0;
  let crashed = false;
  let firstErrorLine = '';

  const combined = stdoutBuffer + '\n' + stderrBuffer;

  // Pattern 1: RESULTS: X PASSED / Y FAILED
  const match1 = combined.match(/RESULTS:\s*(\d+)\s*PASSED\s*\/\s*(\d+)\s*FAILED/i);
  // Pattern 2: PASSED: X | FAILED: Y
  const match2 = combined.match(/PASSED:\s*(\d+)\s*\|\s*FAILED:\s*(\d+)/i);

  if (match1) {
    passed = parseInt(match1[1], 10);
    failed = parseInt(match1[2], 10);
  } else if (match2) {
    passed = parseInt(match2[1], 10);
    failed = parseInt(match2[2], 10);
  } else {
    // Structured output wasn't printed
    if (exitCode === 0) {
      passed = 1;
      failed = 0;
    } else {
      crashed = true;
      passed = 0;
      failed = 0;

      const lines = (stderrBuffer + '\n' + stdoutBuffer)
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean);

      const explicitError = lines.find((l) =>
        /\b(?:[A-Z]\w*Error|Exception)\b/i.test(l)
      );

      firstErrorLine = explicitError || lines[0] || 'Unknown crash before results';
    }
  }

  return { exitCode, passed, failed, crashed, firstErrorLine };
};

export const formatSuiteResultRow = (s) => {
  if (s.crashed) {
    const statusMark = `${s.exitCode} (CRASH)`;
    const row = `${s.name.padEnd(36)} | ${'CRASH'.padStart(8)} | ${'—'.padStart(8)} | ${statusMark.padStart(10)}`;
    const errorDetail = s.firstErrorLine ? `\n  CRASH: ${s.firstErrorLine}` : '';
    return `${row}${errorDetail}`;
  }

  const statusMark = s.exitCode === 0 ? '0 (PASS)' : `${s.exitCode} (FAIL)`;
  return `${s.name.padEnd(36)} | ${String(s.passed).padStart(8)} | ${String(s.failed).padStart(8)} | ${statusMark.padStart(10)}`;
};

// ── Helper: Run a Node Script as Child Process ───────────────────────────────

const runNodeScript = (scriptRelativePath, captureResults = false) => {
  return new Promise((resolve) => {
    const fullPath = path.resolve(BACKEND_ROOT, scriptRelativePath);
    const child = spawn(process.execPath, [fullPath], {
      cwd: BACKEND_ROOT,
      env: childEnv,
      stdio: captureResults ? ['inherit', 'pipe', 'pipe'] : 'inherit',
    });

    let stdoutBuffer = '';
    let stderrBuffer = '';

    if (captureResults) {
      child.stdout.on('data', (data) => {
        const text = data.toString();
        stdoutBuffer += text;
        process.stdout.write(text);
      });

      child.stderr.on('data', (data) => {
        const text = data.toString();
        stderrBuffer += text;
        process.stderr.write(text);
      });
    }

    child.on('error', (err) => {
      console.error(`[runner] Failed to spawn ${scriptRelativePath}:`, err.message);
      resolve({
        exitCode: 1,
        passed: 0,
        failed: 0,
        crashed: true,
        firstErrorLine: err.message,
      });
    });

    child.on('close', (code) => {
      const exitCode = code ?? 1;
      if (captureResults) {
        resolve(parseSuiteOutput(stdoutBuffer, stderrBuffer, exitCode));
      } else {
        resolve({
          exitCode,
          passed: exitCode === 0 ? 1 : 0,
          failed: exitCode === 0 ? 0 : 1,
          crashed: false,
          firstErrorLine: '',
        });
      }
    });
  });
};

// ── Helper: Wait for Server Health Check ─────────────────────────────────────

const waitForHealth = (maxWaitMs = 30000) => {
  const startTime = Date.now();
  const host = parsedApiUrl.hostname || 'localhost';
  const port = parseInt(API_PORT, 10);

  return new Promise((resolve, reject) => {
    const check = () => {
      const req = http.get(
        {
          host,
          port,
          path: '/api/health',
          timeout: 2000,
        },
        (res) => {
          if (res.statusCode === 200) {
            resolve();
          } else {
            retry();
          }
        }
      );

      req.on('error', () => {
        retry();
      });

      req.on('timeout', () => {
        req.destroy();
        retry();
      });
    };

    const retry = () => {
      if (Date.now() - startTime >= maxWaitMs) {
        reject(new Error(`API server did not respond on /api/health within ${maxWaitMs / 1000}s`));
      } else {
        setTimeout(check, 500);
      }
    };

    check();
  });
};

// ── Helper: Stop Child Server ────────────────────────────────────────────────

const stopServer = (serverProcess) => {
  return new Promise((resolve) => {
    if (!serverProcess || serverProcess.killed) {
      return resolve();
    }

    serverProcess.on('close', () => resolve());

    if (process.platform === 'win32') {
      try {
        spawn('taskkill', ['/pid', serverProcess.pid.toString(), '/f', '/t']);
      } catch {
        serverProcess.kill('SIGKILL');
      }
    } else {
      serverProcess.kill('SIGTERM');
    }

    setTimeout(() => {
      try {
        serverProcess.kill('SIGKILL');
      } catch {}
      resolve();
    }, 3000);
  });
};

// ── Main Execution Flow ──────────────────────────────────────────────────────

async function main() {
  console.log('\n===============================================================');
  console.log(' RECRUITREADY — INTEGRATION TEST SUITES SAFE RUNNER');
  console.log('===============================================================');
  console.log(` Target DB     : (confirmed test database)`);
  console.log(` Target API    : ${TEST_API_URL}`);
  console.log('===============================================================\n');

  // Step 1: Seed Admin
  console.log('--- Step 1/3: Seeding Admin Account ---');
  const seedAdminResult = await runNodeScript('src/scripts/seedAdmin.js');
  if (seedAdminResult.exitCode !== 0) {
    console.error('[runner] WARNING: Admin seed exited with code', seedAdminResult.exitCode);
  }

  // Step 2: Seed Dev Content
  console.log('\n--- Step 2/3: Seeding Dev Content ---');
  const seedContentResult = await runNodeScript('src/scripts/seedDevContent.js');
  if (seedContentResult.exitCode !== 0) {
    console.error('[runner] WARNING: Dev content seed exited with code', seedContentResult.exitCode);
  }

  // Step 3: Start Server
  console.log('\n--- Step 3/3: Starting Background API Server ---');
  const serverProcess = spawn(process.execPath, [path.resolve(BACKEND_ROOT, 'src/server.js')], {
    cwd: BACKEND_ROOT,
    env: { ...childEnv, PORT: API_PORT },
    stdio: 'pipe',
  });

  serverProcess.stdout.on('data', (d) => {
    const line = d.toString();
    if (line.includes('running') || line.includes('connected') || line.includes('Error')) {
      process.stdout.write(`  [server] ${line}`);
    }
  });

  serverProcess.stderr.on('data', (d) => {
    process.stderr.write(`  [server err] ${d.toString()}`);
  });

  let serverStarted = false;
  try {
    process.stdout.write('[runner] Waiting for API server /api/health to become ready...');
    await waitForHealth(30000);
    serverStarted = true;
    console.log(' Ready!\n');
  } catch (err) {
    console.error(`\n[runner ERROR] ${err.message}`);
    await stopServer(serverProcess);
    process.exit(1);
  }

  // Define the Six Suites
  const SUITES = [
    { name: 'Phase P0 Assessment Security', file: 'src/scripts/testPhaseP0AssessmentSecuritySuite.js' },
    { name: 'Login & Registration', file: 'src/scripts/testLoginRegistrationSuite.js' },
    { name: 'Phase 10 Observability & Perf', file: 'src/scripts/testPhase10ObservabilitySuite.js' },
    { name: 'Authentication & Session Hardening', file: 'src/scripts/testAuthSuite.js' },
    { name: 'Admin Productivity 2.0', file: 'src/scripts/testAdminProductivitySuite.js' },
    { name: 'Company Preparation 2.0', file: 'src/scripts/testCompanyPreparationSuite.js' },
    { name: 'Preparation Goal Tracking', file: 'src/scripts/testPreparationGoalTrackingSuite.js' },
  ];

  const suiteResults = [];

  try {
    for (const [index, suite] of SUITES.entries()) {
      console.log(`\n===============================================================`);
      console.log(` SUITE ${index + 1}/${SUITES.length}: ${suite.name}`);
      console.log(` File: ${suite.file}`);
      console.log(`===============================================================\n`);

      const result = await runNodeScript(suite.file, true);
      suiteResults.push({
        name: suite.name,
        file: suite.file,
        passed: result.passed,
        failed: result.failed,
        exitCode: result.exitCode,
        crashed: result.crashed || false,
        firstErrorLine: result.firstErrorLine || '',
      });
    }
  } finally {
    if (serverStarted) {
      console.log('\n[runner] Stopping background API server...');
      await stopServer(serverProcess);
      console.log('[runner] Server stopped.');
    }
  }

  // ── Print Summary Table ────────────────────────────────────────────────────
  console.log('\n========================================================================================');
  console.log('                               INTEGRATION TEST SUMMARY');
  console.log('========================================================================================');
  console.log(
    '%-36s | %8s | %8s | %10s'.replace('%-36s', 'Suite'.padEnd(36))
      .replace('%8s', 'Passed'.padStart(8))
      .replace('%8s', 'Failed'.padStart(8))
      .replace('%10s', 'Exit Code'.padStart(10))
  );
  console.log('----------------------------------------------------------------------------------------');

  let totalPassed = 0;
  let totalFailed = 0;
  let hasFailure = false;

  for (const s of suiteResults) {
    if (s.crashed) {
      hasFailure = true;
    } else {
      totalPassed += s.passed;
      totalFailed += s.failed;
      if (s.exitCode !== 0 || s.failed > 0) {
        hasFailure = true;
      }
    }
    console.log(formatSuiteResultRow(s));
  }

  console.log('----------------------------------------------------------------------------------------');
  console.log(
    `${'TOTAL'.padEnd(36)} | ${String(totalPassed).padStart(8)} | ${String(totalFailed).padStart(8)} | ${(hasFailure ? 'FAIL' : 'PASS').padStart(10)}`
  );
  console.log('========================================================================================\n');

  console.log('[runner] Notice: The test database was NOT dropped automatically.');
  console.log('To manually drop the test database when finished, run:');
  console.log(`  mongosh "${MONGODB_URI}" --eval "db.dropDatabase()"\n`);

  if (hasFailure) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

const isMainModule = () => {
  if (!process.argv[1]) return false;
  try {
    const executedPath = path.resolve(process.argv[1]);
    const modulePath = path.resolve(fileURLToPath(import.meta.url));
    return executedPath === modulePath;
  } catch {
    return false;
  }
};

if (isMainModule()) {
  main().catch((err) => {
    console.error('[runner Fatal Exception]:', err);
    process.exit(1);
  });
}
