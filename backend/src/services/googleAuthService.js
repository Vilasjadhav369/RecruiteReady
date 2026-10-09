import { OAuth2Client } from 'google-auth-library';

let clientInstance = null;

const getClient = () => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientInstance || clientInstance._clientId !== clientId) {
    clientInstance = new OAuth2Client(clientId);
    clientInstance._clientId = clientId;
  }
  return clientInstance;
};

/**
 * verifyGoogleIdToken — Cryptographically verifies a Google ID Token using Google's official OAuth2Client.
 *
 * Validates:
 * - Token cryptographic signature
 * - Issuer (accounts.google.com or https://accounts.google.com)
 * - Audience (matches GOOGLE_CLIENT_ID)
 * - Expiration timestamp
 * - Subject (Google unique identifier)
 *
 * @param {string} idToken - The JWT credential received from Google Identity Services
 * @returns {Promise<Object>} Verified Google identity payload
 */
export const verifyGoogleIdToken = async (idToken) => {
  if (!idToken || typeof idToken !== 'string') {
    const error = new Error('Google credential token is required.');
    error.statusCode = 400;
    throw error;
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId || clientId.trim() === '' || clientId === 'your_google_client_id_here') {
    const error = new Error('GOOGLE_CLIENT_ID is not configured on the server.');
    error.statusCode = 500;
    throw error;
  }

  try {
    const client = getClient();
    const ticket = await client.verifyIdToken({
      idToken,
      audience: clientId,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.sub) {
      const error = new Error('Invalid Google credential payload.');
      error.statusCode = 401;
      throw error;
    }

    if (!payload.email) {
      const error = new Error('Google account email is missing from credential.');
      error.statusCode = 400;
      throw error;
    }

    if (!payload.email_verified) {
      const error = new Error('Google account email is not verified.');
      error.statusCode = 400;
      throw error;
    }

    return {
      sub: String(payload.sub),
      email: String(payload.email).toLowerCase().trim(),
      emailVerified: Boolean(payload.email_verified),
      name: payload.name || '',
      givenName: payload.given_name || '',
      familyName: payload.family_name || '',
      picture: payload.picture || '',
    };
  } catch (err) {
    if (err.statusCode) {
      throw err;
    }
    const error = new Error('Failed to verify Google credential: ' + (err.message || 'Invalid or expired token'));
    error.statusCode = 401;
    throw error;
  }
};

export default {
  verifyGoogleIdToken,
};
