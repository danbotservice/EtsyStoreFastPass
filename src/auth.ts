import express from 'express';
import { randomBytes } from 'crypto';
import { getConfig, saveTokens } from './config.js';
import axios from 'axios';
import open from 'open';

const ETSY_AUTH_URL = 'https://www.etsy.com/oauth/connect';
const ETSY_TOKEN_URL = 'https://api.etsy.com/v3/public/oauth/token';

interface OAuthState {
  state: string;
  codeVerifier: string;
}

let authState: OAuthState | null = null;

function base64URLEncode(str: Buffer): string {
  return str
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

function generateCodeVerifier(): string {
  return base64URLEncode(randomBytes(32));
}

async function generateCodeChallenge(verifier: string): Promise<string> {
  const crypto = await import('crypto');
  const hash = crypto.createHash('sha256').update(verifier).digest();
  return base64URLEncode(hash);
}

export async function startAuthFlow(): Promise<void> {
  const config = getConfig();
  const app = express();

  // Generate PKCE parameters
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = await generateCodeChallenge(codeVerifier);
  const state = base64URLEncode(randomBytes(16));

  authState = { state, codeVerifier };

  // Build authorization URL
  const authUrl = new URL(ETSY_AUTH_URL);
  authUrl.searchParams.append('response_type', 'code');
  authUrl.searchParams.append('client_id', config.apiKey);
  authUrl.searchParams.append('redirect_uri', config.redirectUri);
  authUrl.searchParams.append('scope', 'listings_w listings_r shops_r');
  authUrl.searchParams.append('state', state);
  authUrl.searchParams.append('code_challenge', codeChallenge);
  authUrl.searchParams.append('code_challenge_method', 'S256');

  // Setup callback route
  app.get('/oauth/callback', async (req, res) => {
    try {
      const { code, state: returnedState } = req.query;

      if (!code || typeof code !== 'string') {
        throw new Error('No authorization code received');
      }

      if (!authState || returnedState !== authState.state) {
        throw new Error('State mismatch - possible CSRF attack');
      }

      console.log('✅ Authorization code received, exchanging for access token...');

      // Exchange code for access token
      const tokenResponse = await axios.post(
        ETSY_TOKEN_URL,
        new URLSearchParams({
          grant_type: 'authorization_code',
          client_id: config.apiKey,
          redirect_uri: config.redirectUri,
          code,
          code_verifier: authState.codeVerifier,
        }).toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      const { access_token, refresh_token, expires_in } = tokenResponse.data;

      // Save tokens
      saveTokens({
        accessToken: access_token,
        refreshToken: refresh_token,
        expiresAt: Date.now() + expires_in * 1000,
      });

      res.send(`
        <html>
          <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
            <h1 style="color: #4CAF50;">✅ Authentication Successful!</h1>
            <p>You can close this window and return to the terminal.</p>
            <p>Your Etsy shop is now connected.</p>
          </body>
        </html>
      `);

      console.log('✅ Authentication successful! Tokens saved.');
      console.log('You can now use the automation to add products.');

      // Shutdown server after success
      setTimeout(() => process.exit(0), 1000);
    } catch (error) {
      console.error('❌ Authentication error:', error);
      res.send(`
        <html>
          <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
            <h1 style="color: #f44336;">❌ Authentication Failed</h1>
            <p>Error: ${error instanceof Error ? error.message : 'Unknown error'}</p>
            <p>Please check the terminal for details and try again.</p>
          </body>
        </html>
      `);
      setTimeout(() => process.exit(1), 1000);
    }
  });

  // Start server
  const server = app.listen(config.port, () => {
    console.log(`🚀 OAuth server started on port ${config.port}`);
    console.log(`📱 Opening browser for Etsy authentication...`);
    console.log(`\nIf the browser doesn't open, visit this URL:`);
    console.log(authUrl.toString());
    console.log('\n⏳ Waiting for authentication...\n');
  });

  // Open browser
  try {
    await open(authUrl.toString());
  } catch (error) {
    console.error('Could not open browser automatically. Please open the URL manually.');
  }

  // Handle server errors
  server.on('error', (error) => {
    console.error('❌ Server error:', error);
    process.exit(1);
  });
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  startAuthFlow().catch(console.error);
}
