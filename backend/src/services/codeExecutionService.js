/**
 * Safe Code Execution Service Abstraction
 * 
 * SECURITY RULE:
 * Arbitrary student code is NEVER executed directly inside the Node.js server process
 * using child_process, exec, eval, or Function constructor.
 * 
 * In standard local development without an external isolated sandboxed runner
 * (e.g. Judge0, Piston, or a dedicated gVisor/Docker runner container),
 * this service safely evaluates whether a sandbox is reachable.
 * If not configured, it honestly reports the execution service status.
 */

export class CodeExecutionService {
  constructor() {
    this.sandboxUrl = process.env.CODE_EXECUTION_URL || null;
    this.isConfigured = Boolean(this.sandboxUrl);
  }

  /**
   * Evaluates code safely against test cases.
   * @param {Object} params
   * @param {string} params.language
   * @param {string} params.code
   * @param {Array} params.testCases
   * @returns {Promise<Object>}
   */
  async executeCode({ language, code, testCases = [] }) {
    if (!this.isConfigured) {
      return {
        configured: false,
        status: 'execution_unavailable',
        message: 'Code execution service is not configured. Submission saved securely.',
        passedTests: 0,
        totalTests: testCases.length,
        runtime: 0,
        memory: 0,
      };
    }

    try {
      // If an external sandbox URL is configured via environment variable
      const response = await fetch(`${this.sandboxUrl}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language, code, testCases }),
      });

      if (!response.ok) {
        throw new Error(`Sandbox returned status ${response.status}`);
      }

      return await response.json();
    } catch (err) {
      return {
        configured: true,
        status: 'error',
        message: `Execution failed: ${err.message}`,
        passedTests: 0,
        totalTests: testCases.length,
        runtime: 0,
        memory: 0,
      };
    }
  }
}

export default new CodeExecutionService();
