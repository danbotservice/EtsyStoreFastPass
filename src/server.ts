import express, { Request, Response } from 'express';
import { randomBytes } from 'crypto';
import { getConfig, saveTokens, loadTokens, hasValidTokens } from './config.js';
import { EtsyClient } from './etsyClient.js';
import { ProductData } from './types.js';
import axios from 'axios';

const ETSY_AUTH_URL = 'https://www.etsy.com/oauth/connect';
const ETSY_TOKEN_URL = 'https://api.etsy.com/v3/public/oauth/token';

interface OAuthState {
  state: string;
  codeVerifier: string;
  timestamp: number;
}

// Store OAuth states temporarily (in production, use Redis or similar)
const oauthStates = new Map<string, OAuthState>();

// Clean up old states every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of oauthStates.entries()) {
    if (now - value.timestamp > 10 * 60 * 1000) {
      oauthStates.delete(key);
    }
  }
}, 10 * 60 * 1000);

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

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Root endpoint with instructions
app.get('/', (req: Request, res: Response) => {
  const isAuthenticated = hasValidTokens();
  const config = getConfig();

  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Etsy Store FastPass</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background: #f5f5f5;
          }
          .container {
            background: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          h1 {
            color: #333;
            margin-top: 0;
          }
          .status {
            padding: 15px;
            border-radius: 4px;
            margin: 20px 0;
          }
          .status.authenticated {
            background: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
          }
          .status.not-authenticated {
            background: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
          }
          .button {
            display: inline-block;
            padding: 12px 24px;
            background: #007bff;
            color: white;
            text-decoration: none;
            border-radius: 4px;
            margin: 10px 10px 10px 0;
            border: none;
            cursor: pointer;
            font-size: 16px;
          }
          .button:hover {
            background: #0056b3;
          }
          .button.secondary {
            background: #6c757d;
          }
          .button.secondary:hover {
            background: #545b62;
          }
          code {
            background: #f4f4f4;
            padding: 2px 6px;
            border-radius: 3px;
            font-family: 'Courier New', monospace;
          }
          pre {
            background: #f4f4f4;
            padding: 15px;
            border-radius: 4px;
            overflow-x: auto;
          }
          .endpoint {
            margin: 15px 0;
            padding: 10px;
            background: #f8f9fa;
            border-left: 4px solid #007bff;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>🎨 Etsy Store FastPass</h1>
          <p>Automation tool for quickly adding products to your Etsy shop</p>

          <div class="status ${isAuthenticated ? 'authenticated' : 'not-authenticated'}">
            ${isAuthenticated
              ? '✅ <strong>Authenticated</strong> - Your Etsy shop is connected!'
              : '❌ <strong>Not Authenticated</strong> - Please connect your Etsy shop'}
          </div>

          ${!isAuthenticated ? `
            <h2>Getting Started</h2>
            <p>Click the button below to connect your Etsy shop:</p>
            <a href="/auth/start" class="button">Connect to Etsy</a>
          ` : `
            <h2>API Endpoints</h2>

            <div class="endpoint">
              <strong>GET /api/status</strong>
              <p>Check authentication status</p>
            </div>

            <div class="endpoint">
              <strong>POST /api/products</strong>
              <p>Add a single product or bulk upload</p>
              <pre>
// Single product
{
  "title": "Product Name",
  "description": "Product description",
  "price": 29.99,
  "quantity": 10,
  "whoMade": "i_did",
  "whenMade": "2020_2024"
}

// Bulk upload (array)
[{ product1 }, { product2 }, ...]
              </pre>
            </div>

            <div class="endpoint">
              <strong>GET /api/shop</strong>
              <p>Get shop information</p>
            </div>

            <div class="endpoint">
              <strong>GET /auth/logout</strong>
              <p>Disconnect from Etsy</p>
            </div>

            <h2>Quick Test</h2>
            <form action="/api/products" method="POST" style="margin-top: 20px;">
              <input type="hidden" name="test" value="true">
              <button type="submit" class="button">Add Test Product</button>
            </form>
          `}

          <h2>Documentation</h2>
          <p>For more information, visit the <a href="https://github.com/danbotservice/EtsyStoreFastPass">GitHub repository</a>.</p>
        </div>
      </body>
    </html>
  `);
});

// Start OAuth flow
app.get('/auth/start', async (req: Request, res: Response) => {
  try {
    const config = getConfig();

    // Generate PKCE parameters
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = await generateCodeChallenge(codeVerifier);
    const state = base64URLEncode(randomBytes(16));

    // Store state
    oauthStates.set(state, {
      state,
      codeVerifier,
      timestamp: Date.now(),
    });

    // Determine redirect URI based on environment
    const redirectUri = process.env.RAILWAY_PUBLIC_DOMAIN
      ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}/oauth/callback`
      : config.redirectUri;

    // Build authorization URL
    const authUrl = new URL(ETSY_AUTH_URL);
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('client_id', config.apiKey);
    authUrl.searchParams.append('redirect_uri', redirectUri);
    authUrl.searchParams.append('scope', 'listings_w listings_r shops_r');
    authUrl.searchParams.append('state', state);
    authUrl.searchParams.append('code_challenge', codeChallenge);
    authUrl.searchParams.append('code_challenge_method', 'S256');

    // Redirect to Etsy
    res.redirect(authUrl.toString());
  } catch (error) {
    console.error('Error starting auth:', error);
    res.status(500).send('Error starting authentication');
  }
});

// OAuth callback
app.get('/oauth/callback', async (req: Request, res: Response) => {
  try {
    const { code, state } = req.query;

    if (!code || typeof code !== 'string') {
      throw new Error('No authorization code received');
    }

    if (!state || typeof state !== 'string') {
      throw new Error('No state received');
    }

    const authState = oauthStates.get(state);
    if (!authState) {
      throw new Error('Invalid state - please try authenticating again');
    }

    // Clean up used state
    oauthStates.delete(state);

    const config = getConfig();
    const redirectUri = process.env.RAILWAY_PUBLIC_DOMAIN
      ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}/oauth/callback`
      : config.redirectUri;

    // Exchange code for access token
    const tokenResponse = await axios.post(
      ETSY_TOKEN_URL,
      new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: config.apiKey,
        redirect_uri: redirectUri,
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
        <head>
          <title>Authentication Successful</title>
          <meta http-equiv="refresh" content="3;url=/">
          <style>
            body {
              font-family: Arial, sans-serif;
              text-align: center;
              padding: 50px;
              background: #f5f5f5;
            }
            .container {
              background: white;
              padding: 40px;
              border-radius: 8px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
              max-width: 500px;
              margin: 0 auto;
            }
            h1 { color: #4CAF50; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>✅ Authentication Successful!</h1>
            <p>Your Etsy shop is now connected.</p>
            <p>Redirecting to dashboard...</p>
          </div>
        </body>
      </html>
    `);
  } catch (error) {
    console.error('OAuth callback error:', error);
    res.status(500).send(`
      <html>
        <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
          <h1 style="color: #f44336;">❌ Authentication Failed</h1>
          <p>Error: ${error instanceof Error ? error.message : 'Unknown error'}</p>
          <p><a href="/">Go back</a></p>
        </body>
      </html>
    `);
  }
});

// Logout
app.get('/auth/logout', (req: Request, res: Response) => {
  saveTokens({});
  res.redirect('/?logged_out=true');
});

// Check status
app.get('/api/status', (req: Request, res: Response) => {
  const isAuthenticated = hasValidTokens();
  res.json({
    authenticated: isAuthenticated,
    timestamp: new Date().toISOString(),
  });
});

// Get shop info
app.get('/api/shop', async (req: Request, res: Response) => {
  try {
    if (!hasValidTokens()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const client = new EtsyClient();
    const shopInfo = await client.getShopInfo();
    res.json(shopInfo);
  } catch (error) {
    console.error('Error getting shop info:', error);
    res.status(500).json({ error: 'Failed to get shop info' });
  }
});

// Add products
app.post('/api/products', async (req: Request, res: Response) => {
  try {
    if (!hasValidTokens()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const client = new EtsyClient();

    // Check if it's a test request
    if (req.body.test === 'true' || req.body.test === true) {
      const testProduct: ProductData = {
        title: 'Test Product - ' + new Date().toISOString(),
        description: 'This is a test product created via the Etsy Store FastPass API.',
        price: 9.99,
        quantity: 1,
        whoMade: 'i_did',
        whenMade: 'made_to_order',
        tags: ['test', 'demo'],
      };

      const listing = await client.createListing(testProduct);
      return res.json({
        success: true,
        listing,
        message: 'Test product created successfully',
      });
    }

    // Handle single product or array
    const products = Array.isArray(req.body) ? req.body : [req.body];

    const results = [];
    const errors = [];

    for (const product of products) {
      try {
        const listing = await client.createListing(product as ProductData);
        results.push(listing);

        // Rate limiting
        if (products.length > 1) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      } catch (error) {
        errors.push({
          product: product.title,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    res.json({
      success: true,
      created: results.length,
      failed: errors.length,
      listings: results,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('Error adding products:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Start server
const config = getConfig();
const PORT = process.env.PORT || config.port || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Etsy Store FastPass server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);

  if (process.env.RAILWAY_PUBLIC_DOMAIN) {
    console.log(`🌐 Public URL: https://${process.env.RAILWAY_PUBLIC_DOMAIN}`);
  } else {
    console.log(`🌐 Local URL: http://localhost:${PORT}`);
  }

  console.log(`✅ Server ready!`);
});
