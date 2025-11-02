# Testing the Etsy Store FastPass Application

This guide walks you through testing the application both locally and on Railway.

## Prerequisites

Before you begin, make sure you have:

1. ✅ Etsy API credentials (from https://www.etsy.com/developers/your-apps)
2. ✅ Node.js 18+ installed
3. ✅ Git configured
4. ✅ Railway account (sign up at https://railway.app)

## Part 1: Local Testing

### 1. Set Up Environment

```bash
# Copy the example .env file
cp .env.example .env
```

Edit `.env` and add your actual Etsy credentials:

```env
ETSY_API_KEY=your_keystring_from_etsy
ETSY_API_SECRET=your_shared_secret_from_etsy
ETSY_SHOP_ID=your_shop_id
REDIRECT_URI=http://localhost:3000/oauth/callback
PORT=3000
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Build the Application

```bash
npm run build
```

Expected output: TypeScript compiles without errors.

### 4. Start the Server

```bash
npm run server
```

Expected output:
```
🚀 Etsy Store FastPass server running on port 3000
📍 Environment: development
🌐 Local URL: http://localhost:3000
✅ Server ready!
```

### 5. Test the Web Interface

Open your browser to `http://localhost:3000`

You should see:
- ✅ The Etsy Store FastPass dashboard
- ❌ "Not Authenticated" status (this is expected initially)
- "Connect to Etsy" button

### 6. Test OAuth Authentication (Optional - requires real Etsy credentials)

⚠️ **Important:** Before testing OAuth locally, you need to add `http://localhost:3000/oauth/callback` to your Etsy app's allowed callback URLs.

1. Go to https://www.etsy.com/developers/your-apps
2. Select your app
3. Add `http://localhost:3000/oauth/callback` to OAuth Redirect URIs
4. Click "Connect to Etsy" in the dashboard
5. Authorize the app on Etsy
6. You should be redirected back with "Authentication Successful"

### 7. Test API Endpoints

Once authenticated, test the API:

```bash
# Check authentication status
curl http://localhost:3000/api/status

# Get shop information
curl http://localhost:3000/api/shop

# Add a test product
curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
```

### 8. Test Product Upload

Create a test product file `test-product.json`:

```json
{
  "title": "Test Product - Do Not Buy",
  "description": "This is a test product for API testing.",
  "price": 1.00,
  "quantity": 1,
  "whoMade": "i_did",
  "whenMade": "made_to_order",
  "tags": ["test"]
}
```

Upload it:

```bash
curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -d @test-product.json
```

**Remember to delete the test listing from your Etsy shop afterward!**

## Part 2: Railway Deployment

### Method 1: Deploy via Railway Dashboard (Easiest)

#### Step 1: Push Code to GitHub

```bash
# Push the branch to GitHub
git push origin claude/etsy-api-product-automation-011CUi45X4L2WDcWZduqvTia
```

#### Step 2: Create Railway Project

1. Go to [railway.app](https://railway.app) and login
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Authorize Railway to access your GitHub account
5. Select the `EtsyStoreFastPass` repository
6. Select the branch `claude/etsy-api-product-automation-011CUi45X4L2WDcWZduqvTia`

#### Step 3: Configure Environment Variables

In the Railway dashboard:

1. Click on your service
2. Go to "Variables" tab
3. Click "New Variable" and add:

```
ETSY_API_KEY = your_keystring_from_etsy
ETSY_API_SECRET = your_shared_secret_from_etsy
ETSY_SHOP_ID = your_shop_id
NODE_ENV = production
```

**Important:** Do NOT set `REDIRECT_URI` or `PORT` - Railway handles these automatically!

#### Step 4: Deploy

Railway will automatically:
- Detect the configuration (via railway.json and nixpacks.toml)
- Install dependencies
- Build TypeScript
- Start the server

Wait for deployment to complete (usually 2-3 minutes).

#### Step 5: Get Your Public URL

1. In Railway dashboard, click "Settings"
2. Under "Environment", click "Generate Domain"
3. You'll get a URL like: `https://etsystorefastpass-production.up.railway.app`

#### Step 6: Update Etsy OAuth Settings

**Critical Step:** Add the Railway callback URL to your Etsy app:

1. Go to https://www.etsy.com/developers/your-apps
2. Select your app
3. Add your Railway URL + `/oauth/callback` to OAuth Redirect URIs
   - Example: `https://etsystorefastpass-production.up.railway.app/oauth/callback`
4. Save changes

### Method 2: Deploy via Railway CLI

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Initialize project
railway init

# Link to your Railway project (or create new)
railway link

# Set environment variables
railway variables set ETSY_API_KEY=your_key
railway variables set ETSY_API_SECRET=your_secret
railway variables set ETSY_SHOP_ID=your_shop_id
railway variables set NODE_ENV=production

# Deploy
railway up

# Get the URL
railway open
```

## Part 3: Testing the Railway Deployment

### 1. Test Health Endpoint

```bash
curl https://your-app.up.railway.app/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2025-11-02T..."
}
```

### 2. Visit the Dashboard

Open `https://your-app.up.railway.app` in your browser.

You should see the Etsy Store FastPass dashboard.

### 3. Authenticate with Etsy

1. Click "Connect to Etsy"
2. Authorize the app on Etsy
3. You should be redirected back with "Authentication Successful"
4. The dashboard should now show "Authenticated" status

### 4. Test Product Creation

Using the web interface:
1. Scroll down to "Quick Test"
2. Click "Add Test Product"
3. Check your Etsy shop - you should see a new test listing

Using the API:
```bash
# Add a test product
curl -X POST https://your-app.up.railway.app/api/products \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Product from API",
    "description": "Testing Railway deployment",
    "price": 1.00,
    "quantity": 1,
    "whoMade": "i_did",
    "whenMade": "made_to_order"
  }'
```

### 5. Test Bulk Upload

Create a file with multiple products:

```json
[
  {
    "title": "Test Product 1",
    "description": "First test product",
    "price": 10.00,
    "quantity": 5,
    "whoMade": "i_did",
    "whenMade": "2020_2024",
    "tags": ["test", "bulk"]
  },
  {
    "title": "Test Product 2",
    "description": "Second test product",
    "price": 15.00,
    "quantity": 3,
    "whoMade": "i_did",
    "whenMade": "2020_2024",
    "tags": ["test", "bulk"]
  }
]
```

Upload:
```bash
curl -X POST https://your-app.up.railway.app/api/products \
  -H "Content-Type: application/json" \
  -d @bulk-products.json
```

### 6. Verify in Etsy Shop

Check your Etsy shop to confirm the listings were created:
- Go to https://www.etsy.com/your/shops/me/tools/listings
- You should see your test products listed

**Important:** Delete test listings after testing!

## Part 4: Monitoring and Logs

### View Railway Logs

**Via Dashboard:**
1. Go to Railway dashboard
2. Click your service
3. Click "Deployments"
4. Click the latest deployment
5. View real-time logs

**Via CLI:**
```bash
railway logs
```

### Monitor API Usage

Check your Etsy API usage:
1. Go to https://www.etsy.com/developers/your-apps
2. Select your app
3. View "API Usage" dashboard

Etsy has rate limits, so monitor your usage if doing bulk uploads.

## Troubleshooting

### Issue: "OAuth redirect_uri_mismatch"

**Solution:**
- Make sure your Railway URL + `/oauth/callback` is added to Etsy app's OAuth Redirect URIs
- URLs must match exactly (including https://)

### Issue: "Not authenticated" after Railway restart

**Cause:** Railway's filesystem is ephemeral, so tokens stored in `tokens.json` are lost on restart.

**Solution:**
- Re-authenticate via the web dashboard
- For production, implement persistent storage (PostgreSQL, Redis, etc.)

### Issue: Build fails on Railway

**Solution:**
1. Check build logs in Railway dashboard
2. Verify all dependencies are in `package.json`
3. Ensure TypeScript compiles locally first

### Issue: Server won't start

**Solution:**
1. Check Railway logs for errors
2. Verify environment variables are set correctly
3. Make sure `NODE_ENV=production` is set

## Performance Testing

### Load Test (Optional)

Test how many products you can upload per minute:

```bash
# Simple load test - upload 10 products
for i in {1..10}; do
  curl -X POST https://your-app.up.railway.app/api/products \
    -H "Content-Type: application/json" \
    -d "{
      \"title\": \"Load Test Product $i\",
      \"description\": \"Testing performance\",
      \"price\": 10.00,
      \"quantity\": 1,
      \"whoMade\": \"i_did\",
      \"whenMade\": \"made_to_order\"
    }"
  sleep 1  # 1 second delay to respect rate limits
done
```

**Note:** The app includes a built-in 1-second delay between bulk uploads to respect Etsy's rate limits.

## Clean Up

After testing, don't forget to:

1. ✅ Delete test listings from your Etsy shop
2. ✅ Review Railway usage and costs
3. ✅ Revoke OAuth access if no longer needed (in Etsy settings)

## Next Steps

Once testing is complete:

1. **Production Use:**
   - Keep the Railway deployment running
   - Use it as your permanent automation tool
   - Set up monitoring and alerts

2. **Integration:**
   - Integrate with your existing product management system
   - Build a frontend for easier product uploads
   - Add more features (image upload, product updates, etc.)

3. **Scaling:**
   - Upgrade Railway plan if needed
   - Implement persistent token storage
   - Add a queue system for bulk uploads

## Security Checklist

Before going to production:

- ✅ Environment variables are set (not in code)
- ✅ `.env` file is in `.gitignore`
- ✅ OAuth tokens are stored securely
- ✅ HTTPS is enabled (automatic on Railway)
- ✅ Rate limiting is in place
- ✅ Error handling is comprehensive
- ✅ Logs don't expose sensitive data

## Support

If you encounter issues:

1. Check the logs first (Railway dashboard or CLI)
2. Review [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment info
3. Check [README.md](README.md) for API documentation
4. Review Etsy API docs: https://developers.etsy.com/documentation
5. Check Railway docs: https://docs.railway.app

Happy testing! 🚀
