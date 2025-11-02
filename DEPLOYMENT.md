# Deploying to Railway

This guide will help you deploy the Etsy Store FastPass application to Railway.

## Prerequisites

- GitHub account
- Railway account (sign up at https://railway.app)
- Etsy API credentials

## Deployment Steps

### Option 1: Deploy via Railway Dashboard (Recommended)

1. **Push your code to GitHub**
   ```bash
   git push origin claude/etsy-api-product-automation-011CUi45X4L2WDcWZduqvTia
   ```

2. **Connect to Railway**
   - Go to [railway.app](https://railway.app)
   - Click "Start a New Project"
   - Select "Deploy from GitHub repo"
   - Authorize Railway to access your GitHub
   - Select the `EtsyStoreFastPass` repository

3. **Configure Environment Variables**

   In the Railway dashboard, go to your project's Variables tab and add:

   ```
   ETSY_API_KEY=your_keystring_here
   ETSY_API_SECRET=your_shared_secret_here
   ETSY_SHOP_ID=your_shop_id_here
   NODE_ENV=production
   ```

   **Important:** Do NOT set `REDIRECT_URI` or `PORT` - Railway will handle these automatically.

4. **Update Etsy App Settings**

   - Go to [Etsy Developers](https://www.etsy.com/developers/your-apps)
   - Select your app
   - Add your Railway URL to the OAuth redirect URIs:
     - Once deployed, Railway will give you a URL like `https://your-app.up.railway.app`
     - Add `https://your-app.up.railway.app/oauth/callback` to the allowed callback URLs

5. **Deploy**
   - Railway will automatically detect the configuration and deploy
   - Wait for the deployment to complete (usually 2-3 minutes)
   - You'll get a public URL like `https://your-app.up.railway.app`

### Option 2: Deploy via Railway CLI

1. **Install Railway CLI**
   ```bash
   npm install -g @railway/cli
   # or
   curl -fsSL https://railway.app/install.sh | sh
   ```

2. **Login to Railway**
   ```bash
   railway login
   ```

3. **Initialize Railway Project**
   ```bash
   railway init
   ```

4. **Set Environment Variables**
   ```bash
   railway variables set ETSY_API_KEY=your_keystring_here
   railway variables set ETSY_API_SECRET=your_shared_secret_here
   railway variables set ETSY_SHOP_ID=your_shop_id_here
   railway variables set NODE_ENV=production
   ```

5. **Deploy**
   ```bash
   railway up
   ```

6. **Get Your URL**
   ```bash
   railway open
   ```

7. **Update Etsy OAuth Settings**
   - Add your Railway URL + `/oauth/callback` to Etsy app settings

## Post-Deployment

### 1. Verify Deployment

Visit your Railway URL - you should see the Etsy Store FastPass dashboard.

### 2. Authenticate with Etsy

1. Click "Connect to Etsy" on the dashboard
2. Authorize the app
3. You'll be redirected back to the dashboard

### 3. Test the API

Try adding a test product:

```bash
curl -X POST https://your-app.up.railway.app/api/products \
  -H "Content-Type: application/json" \
  -d '{
    "test": true
  }'
```

Or use the web dashboard to add a test product.

### 4. Add Products via API

```bash
curl -X POST https://your-app.up.railway.app/api/products \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Handmade Ceramic Mug",
    "description": "Beautiful handcrafted mug",
    "price": 28.99,
    "quantity": 10,
    "whoMade": "i_did",
    "whenMade": "made_to_order",
    "tags": ["mug", "handmade", "ceramic"]
  }'
```

### 5. Bulk Upload

```bash
curl -X POST https://your-app.up.railway.app/api/products \
  -H "Content-Type: application/json" \
  -d @products.json
```

## API Endpoints

Once deployed, your application will have these endpoints:

- `GET /` - Web dashboard
- `GET /health` - Health check
- `GET /auth/start` - Start OAuth flow
- `GET /oauth/callback` - OAuth callback (don't call directly)
- `GET /auth/logout` - Logout
- `GET /api/status` - Check authentication status
- `GET /api/shop` - Get shop information
- `POST /api/products` - Add products (single or bulk)

## Monitoring

### View Logs

Via Railway CLI:
```bash
railway logs
```

Via Dashboard:
- Go to your project
- Click on "Deployments"
- Click on the latest deployment
- View logs in real-time

### Check Status

```bash
curl https://your-app.up.railway.app/health
```

## Troubleshooting

### OAuth Redirect Mismatch

**Error:** "redirect_uri_mismatch"

**Solution:** Make sure your Railway URL + `/oauth/callback` is added to your Etsy app's allowed callback URLs.

### Environment Variables Not Set

**Error:** "Missing required configuration"

**Solution:** Check that all environment variables are set in Railway dashboard:
- `ETSY_API_KEY`
- `ETSY_API_SECRET`
- `ETSY_SHOP_ID`

### Deployment Failed

**Error:** Build or deployment errors

**Solution:**
1. Check the build logs in Railway dashboard
2. Ensure all dependencies are in `package.json`
3. Verify `railway.json` configuration

### Token Storage Issues

Railway's filesystem is ephemeral, so tokens are stored in-memory. If your app restarts, you'll need to re-authenticate. For production, consider using:
- Railway's PostgreSQL plugin
- Redis for token storage
- Environment variables (less secure)

## Scaling

Railway offers several plan tiers:
- **Hobby**: Free with limitations
- **Developer**: $5/month base + usage
- **Team**: $20/month base + usage

For high-volume shops, consider:
1. Upgrading to a paid plan
2. Implementing rate limiting
3. Using a database for token storage
4. Adding a queue for bulk uploads

## Security Considerations

1. **Never commit `.env` to git** - Railway uses environment variables
2. **Use HTTPS** - Railway provides this automatically
3. **Rotate tokens regularly** - The app handles token refresh automatically
4. **Monitor API usage** - Check Etsy API rate limits
5. **Keep dependencies updated** - Run `npm audit` regularly

## Custom Domain

To use a custom domain:

1. Go to Railway dashboard
2. Select your project
3. Click "Settings"
4. Add your custom domain
5. Update DNS records as instructed
6. Update Etsy OAuth callback URL with new domain

## Support

- Railway Docs: https://docs.railway.app
- Etsy API Docs: https://developers.etsy.com/documentation
- Project Issues: https://github.com/danbotservice/EtsyStoreFastPass/issues
