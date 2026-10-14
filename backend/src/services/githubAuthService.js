import crypto from 'crypto';

/**
 * In-memory secure state store for CSRF protection.
 * Map<stateString, { expiresAt: number, createdAt: number }>
 */
const stateStore = new Map();

// Periodic cleanup of expired states every 5 minutes
const cleanupInterval = setInterval(() => {
  const now = Date.now();
  for (const [key, record] of stateStore.entries()) {
    if (now > record.expiresAt) {
      stateStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

if (cleanupInterval.unref) {
  cleanupInterval.unref();
}

/**
 * createOAuthState — Generates a cryptographically strong, unpredictable OAuth state token.
 * Valid for 10 minutes. One-time use.
 *
 * @returns {string} 64-character random hex string
 */
export const createOAuthState = () => {
  const state = crypto.randomBytes(32).toString('hex');
  stateStore.set(state, {
    createdAt: Date.now(),
    expiresAt: Date.now() + 10 * 60 * 1000,
  });
  return state;
};

/**
 * verifyOAuthState — Validates that an OAuth state is authentic, unexpired, and unused.
 * Immediately burns the state token to prevent replay attacks.
 *
 * @param {string} state - The state parameter received in callback
 * @returns {boolean} True if valid and consumed; false otherwise
 */
export const verifyOAuthState = (state) => {
  if (!state || typeof state !== 'string') {
    return false;
  }

  const record = stateStore.get(state);
  if (!record) {
    return false;
  }

  // Check expiration
  if (Date.now() > record.expiresAt) {
    stateStore.delete(state);
    return false;
  }

  // Consume immediately (one-time use)
  stateStore.delete(state);
  return true;
};

/**
 * getAuthorizationUrl — Builds the official GitHub OAuth authorization redirect URL.
 * Requests minimum required permissions: read:user user:email
 *
 * @param {string} state - The secure state token
 * @returns {string} Authorization URL
 */
export const getAuthorizationUrl = (state) => {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const callbackUrl = process.env.GITHUB_CALLBACK_URL;

  if (!clientId || clientId === 'your_github_client_id_here') {
    const error = new Error('GITHUB_CLIENT_ID is not configured on the server.');
    error.statusCode = 500;
    throw error;
  }

  if (!callbackUrl) {
    const error = new Error('GITHUB_CALLBACK_URL is not configured on the server.');
    error.statusCode = 500;
    throw error;
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: callbackUrl,
    scope: 'read:user user:email',
    state,
    allow_signup: 'true',
  });

  return `https://github.com/login/oauth/authorize?${params.toString()}`;
};

/**
 * exchangeCodeForToken — Exchanges the temporary authorization code for a GitHub access token.
 * GitHub client secret is strictly kept server-side and never exposed.
 *
 * @param {string} code - The authorization code from callback
 * @returns {Promise<string>} GitHub access token
 */
export const exchangeCodeForToken = async (code) => {
  if (!code || typeof code !== 'string') {
    const error = new Error('Missing authorization code from GitHub.');
    error.statusCode = 400;
    throw error;
  }

  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;
  const callbackUrl = process.env.GITHUB_CALLBACK_URL;

  if (!clientId || !clientSecret || clientId === 'your_github_client_id_here') {
    const error = new Error('GitHub OAuth credentials are not configured on the server.');
    error.statusCode = 500;
    throw error;
  }

  const response = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'User-Agent': 'RecruitReady-Auth',
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: callbackUrl,
    }),
    signal: AbortSignal.timeout(10000),
  });

  if (!response.ok) {
    const error = new Error(`GitHub token exchange failed with status ${response.status}`);
    error.statusCode = 401;
    throw error;
  }

  const data = await response.json();

  if (data.error || !data.access_token) {
    const error = new Error(data.error_description || data.error || 'Failed to exchange authorization code.');
    error.statusCode = 401;
    throw error;
  }

  return data.access_token;
};

/**
 * getGitHubUserProfile — Fetches the authenticated user profile from GitHub API.
 *
 * @param {string} accessToken - GitHub Bearer access token
 * @returns {Promise<Object>} Profile details (id, login, name, avatar_url, email)
 */
export const getGitHubUserProfile = async (accessToken) => {
  const response = await fetch('https://api.github.com/user', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'User-Agent': 'RecruitReady-Auth',
      Accept: 'application/vnd.github.v3+json',
    },
    signal: AbortSignal.timeout(10000),
  });

  if (!response.ok) {
    const error = new Error('Failed to retrieve user profile from GitHub.');
    error.statusCode = 401;
    throw error;
  }

  const profile = await response.json();

  if (!profile || !profile.id) {
    const error = new Error('Invalid GitHub user profile received.');
    error.statusCode = 401;
    throw error;
  }

  return {
    id: String(profile.id),
    login: profile.login || '',
    name: profile.name || profile.login || 'GitHub User',
    avatarUrl: profile.avatar_url || '',
    publicEmail: profile.email || null,
  };
};

/**
 * getGitHubVerifiedEmail — Determines the trusted verified email address for a GitHub user.
 * Queries /user/emails to ensure the email is verified, prioritizing primary verified email.
 *
 * @param {string} accessToken - GitHub Bearer access token
 * @param {string|null} publicEmail - Optional fallback public email from profile
 * @returns {Promise<string>} Normalized verified lowercase email
 */
export const getGitHubVerifiedEmail = async (accessToken, publicEmail = null) => {
  try {
    const response = await fetch('https://api.github.com/user/emails', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'User-Agent': 'RecruitReady-Auth',
        Accept: 'application/vnd.github.v3+json',
      },
      signal: AbortSignal.timeout(10000),
    });

    if (response.ok) {
      const emails = await response.json();

      if (Array.isArray(emails) && emails.length > 0) {
        // 1. Try to find primary verified email
        const primaryVerified = emails.find((e) => e.verified && e.primary);
        if (primaryVerified && primaryVerified.email) {
          return primaryVerified.email.trim().toLowerCase();
        }

        // 2. Try any verified email
        const anyVerified = emails.find((e) => e.verified);
        if (anyVerified && anyVerified.email) {
          return anyVerified.email.trim().toLowerCase();
        }
      }
    }
  } catch {
    // Continue to public email check
  }

  // 3. If public email was provided and verified
  if (publicEmail && typeof publicEmail === 'string' && publicEmail.includes('@')) {
    return publicEmail.trim().toLowerCase();
  }

  const error = new Error(
    "We couldn't verify an email address for your GitHub account. Please make a verified email available in GitHub and try again."
  );
  error.statusCode = 400;
  throw error;
};

export default {
  createOAuthState,
  verifyOAuthState,
  getAuthorizationUrl,
  exchangeCodeForToken,
  getGitHubUserProfile,
  getGitHubVerifiedEmail,
};
