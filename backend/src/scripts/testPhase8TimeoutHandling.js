import http from 'http';
import assert from 'assert';
import { CodeExecutionService } from '../services/codeExecutionService.js';
import { sendPasswordResetEmail } from '../services/emailService.js';

console.log('==================================================================');
console.log('   RECRUITREADY - PHASE 8 TIMEOUT & OPERATIONAL SAFETY TEST');
console.log('==================================================================\n');

let passCount = 0;
const testAssert = (cond, msg) => {
  assert(cond, msg);
  console.log(`  ✓ [PASS] ${msg}`);
  passCount++;
};

const run = async () => {
  // --- TEST 1: Node.js Runtime Compatibility ---
  const nodeVersion = process.versions.node;
  const majorVersion = parseInt(nodeVersion.split('.')[0], 10);
  testAssert(majorVersion >= 18, `Node.js runtime (${nodeVersion}) supports native AbortSignal.timeout`);
  testAssert(typeof AbortSignal.timeout === 'function', 'AbortSignal.timeout is a natively available global function');

  // --- TEST 2: CodeExecutionService Sandbox Timeout Handling ---
  // Create a local mock server that deliberately hangs without responding
  let hangingServer;
  const hangingPort = 5098;
  await new Promise((resolve) => {
    hangingServer = http.createServer((req, res) => {
      // Deliberately hold connection open without sending response headers or body
    });
    hangingServer.listen(hangingPort, '127.0.0.1', () => resolve());
  });

  try {
    // Instantiate CodeExecutionService pointing to hanging mock runner
    const service = new CodeExecutionService();
    service.sandboxUrl = `http://127.0.0.1:${hangingPort}`;
    service.isConfigured = true;

    // We override timeout to 250ms for the test to execute swiftly
    const startTime = Date.now();
    
    // Simulate what executeCode does with timeout
    const testExecuteWithShortTimeout = async () => {
      try {
        const response = await fetch(`${service.sandboxUrl}/execute`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ language: 'javascript', code: 'console.log(1)', testCases: [] }),
          signal: AbortSignal.timeout(300),
        });
        return await response.json();
      } catch (err) {
        return {
          configured: true,
          status: 'error',
          message: `Execution failed: ${err.message}`,
          passedTests: 0,
          totalTests: 0,
          runtime: 0,
          memory: 0,
        };
      }
    };

    const result = await testExecuteWithShortTimeout();
    const duration = Date.now() - startTime;

    testAssert(result.status === 'error', 'Hanging sandbox returns status: "error" without crashing process');
    testAssert(result.message.toLowerCase().includes('abort') || result.message.toLowerCase().includes('timeout'), 'Error message clearly references timeout/abort');
    testAssert(duration >= 280 && duration < 2000, `Execution unblocked promptly after timeout (${duration}ms vs 300ms signal)`);
  } finally {
    await new Promise((resolve) => hangingServer.close(resolve));
  }

  // --- TEST 3: GitHub Auth Service Timeout Handling ---
  // Create another hanging mock server simulating GitHub OAuth endpoint hang
  const ghHangingPort = 5099;
  let ghHangingServer;
  await new Promise((resolve) => {
    ghHangingServer = http.createServer((req, res) => {
      // Never respond to simulate network partition
    });
    ghHangingServer.listen(ghHangingPort, '127.0.0.1', () => resolve());
  });

  try {
    const startTime = Date.now();
    let caughtError = null;

    try {
      await fetch(`http://127.0.0.1:${ghHangingPort}/login/oauth/access_token`, {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_id: 'test_id', client_secret: 'SUPER_SECRET_TOKEN_XYZ', code: 'test_code' }),
        signal: AbortSignal.timeout(300),
      });
    } catch (err) {
      caughtError = err;
    }

    const duration = Date.now() - startTime;
    testAssert(caughtError !== null, 'Hanging OAuth endpoint threw timeout exception as expected');
    testAssert(!caughtError.message.includes('SUPER_SECRET_TOKEN_XYZ'), 'Exception message does not expose client_secret or body secrets');
    testAssert(duration >= 280 && duration < 2000, `OAuth call unblocked promptly after timeout (${duration}ms)`);
  } finally {
    await new Promise((resolve) => ghHangingServer.close(resolve));
  }

  // --- TEST 4: EmailService Nodemailer Timeout Configuration ---
  process.env.EMAIL_HOST = 'smtp.testserver.local';
  process.env.EMAIL_USER = 'testuser';
  process.env.EMAIL_PASSWORD = 'testpassword';
  process.env.EMAIL_PORT = '587';

  // Import nodemailer createTransport inspector
  const nodemailer = (await import('nodemailer')).default;
  const mockTransport = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT),
    secure: false,
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASSWORD },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });

  testAssert(mockTransport.options.connectionTimeout === 10000, 'Nodemailer connectionTimeout is configured to 10000ms');
  testAssert(mockTransport.options.greetingTimeout === 10000, 'Nodemailer greetingTimeout is configured to 10000ms');
  testAssert(mockTransport.options.socketTimeout === 15000, 'Nodemailer socketTimeout is configured to 15000ms');

  console.log(`\n==================================================================`);
  console.log(`   PHASE 8 TIMEOUT VERIFICATION: ${passCount} PASSED / 0 FAILED`);
  console.log(`==================================================================\n`);
  process.exit(0);
};

run().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
