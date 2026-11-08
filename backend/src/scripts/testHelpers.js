/**
 * testHelpers.js — Shared test utilities for integration suites.
 *
 * Exports:
 *  - assertTestDatabase(): throws unless MONGODB_URI contains "test" (case-insensitive)
 *  - createTestSession(user): creates a real Session + returns a valid JWT with sessionId
 */

import sessionService from '../services/sessionService.js';
import { generateToken } from '../utils/jwt.js';

/**
 * Asserts that the current MONGODB_URI points to a test database.
 * Throws a sanitized error (never prints the URI) unless ALLOW_NON_TEST_DB=1.
 * Call after dotenv.config() in every integration suite.
 */
export const assertTestDatabase = () => {
  if (process.env.ALLOW_NON_TEST_DB === '1') return;

  const uri = process.env.MONGODB_URI || '';
  let dbName = '';
  try {
    const withoutQuery = uri.split('?')[0].split('#')[0];
    const slashIdx = withoutQuery.lastIndexOf('/');
    if (slashIdx !== -1) {
      dbName = withoutQuery.substring(slashIdx + 1);
    }
  } catch {
    dbName = '';
  }

  if (!dbName || !dbName.toLowerCase().includes('test')) {
    throw new Error(
      '[SAFETY] Integration suites must run against a database whose name contains "test". ' +
        'Set MONGODB_URI to a test database URI (e.g. mongodb://127.0.0.1:27017/recruitready_test) ' +
        'or set ALLOW_NON_TEST_DB=1 to override. The URI has NOT been printed for security.'
    );
  }
};

/**
 * Creates a real Session document in the database through sessionService (the same service
 * the application uses) and returns a JWT token that includes sessionId
 * and whose SHA-256 hash is stored on the session — exactly as issueSessionAndToken does.
 *
 * @param {Object} user - Mongoose User document or plain object with _id and role
 * @param {Object} [fakeReq] - Optional fake request object for ip/user-agent
 * @returns {Promise<string>} Signed JWT token
 */
export const createTestSession = async (user, fakeReq = null) => {
  const req = fakeReq || {
    ip: '127.0.0.1',
    socket: { remoteAddress: '127.0.0.1' },
    headers: { 'user-agent': 'IntegrationTestAgent/1.0' },
  };

  const session = await sessionService.createSession({ user, req });
  const token = generateToken(user, session._id);
  await sessionService.attachTokenHashToSession(session._id, token);
  return token;
};

export default { assertTestDatabase, createTestSession };
