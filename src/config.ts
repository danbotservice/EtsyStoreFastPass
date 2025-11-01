import dotenv from 'dotenv';
import { EtsyConfig, TokenStorage } from './types.js';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

export function getConfig(): EtsyConfig {
  const apiKey = process.env.ETSY_API_KEY;
  const apiSecret = process.env.ETSY_API_SECRET;
  const shopId = process.env.ETSY_SHOP_ID;
  const redirectUri = process.env.REDIRECT_URI || 'http://localhost:3000/oauth/callback';
  const port = parseInt(process.env.PORT || '3000', 10);

  if (!apiKey || !apiSecret) {
    throw new Error(
      'Missing required configuration. Please set ETSY_API_KEY and ETSY_API_SECRET in .env file'
    );
  }

  if (!shopId) {
    console.warn(
      '⚠️  ETSY_SHOP_ID not set. You will need to provide it when creating listings.'
    );
  }

  return {
    apiKey,
    apiSecret,
    redirectUri,
    shopId: shopId || '',
    port,
  };
}

const TOKEN_FILE = join(__dirname, '..', 'tokens.json');

export function loadTokens(): TokenStorage {
  try {
    if (existsSync(TOKEN_FILE)) {
      const data = readFileSync(TOKEN_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading tokens:', error);
  }
  return {};
}

export function saveTokens(tokens: TokenStorage): void {
  try {
    writeFileSync(TOKEN_FILE, JSON.stringify(tokens, null, 2));
    console.log('✅ Tokens saved successfully');
  } catch (error) {
    console.error('Error saving tokens:', error);
    throw error;
  }
}

export function hasValidTokens(): boolean {
  const tokens = loadTokens();
  if (!tokens.accessToken) {
    return false;
  }

  // Check if token is expired (with 5 minute buffer)
  if (tokens.expiresAt && tokens.expiresAt < Date.now() + 5 * 60 * 1000) {
    return false;
  }

  return true;
}
