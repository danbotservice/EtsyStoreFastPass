# Etsy Store FastPass

An automation tool to quickly add products to your Etsy shop using the Etsy API v3. This tool handles OAuth 2.0 authentication and provides a simple interface for bulk product uploads.

## 🚀 Quick Deploy to Railway

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template)

The easiest way to use this tool is to deploy it to Railway. See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed instructions.

**Quick steps:**
1. Push this repo to GitHub
2. Connect to Railway and deploy
3. Set environment variables (ETSY_API_KEY, ETSY_API_SECRET, ETSY_SHOP_ID)
4. Visit your Railway URL and connect to Etsy
5. Start adding products via the web interface or API

## Features

- 🔐 OAuth 2.0 authentication with Etsy
- 🚀 Bulk product upload from JSON files
- 🔄 Automatic token refresh
- 📦 Support for product details, pricing, inventory, and more
- 🏷️ Tags, materials, and category support
- 📏 Dimensions and weight specifications
- 💾 Secure token storage

## Prerequisites

- Node.js 18+ installed
- An Etsy seller account
- Etsy API credentials (API Key and Secret)

## Getting Started

### 1. Set Up Etsy API Credentials

1. Go to [Etsy Developers](https://www.etsy.com/developers/your-apps)
2. Click "Create a New App"
3. Fill in your app details:
   - App Name: Choose any name
   - What's this app for: Select "Personal Use"
   - Intended Audience: Select appropriate option
4. Once created, note your **Keystring** (API Key) and **Shared Secret** (API Secret)

### 2. Configure the Application

1. Clone this repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

4. Edit `.env` and add your credentials:
   ```env
   ETSY_API_KEY=your_keystring_here
   ETSY_API_SECRET=your_shared_secret_here
   ETSY_SHOP_ID=your_shop_id_here
   REDIRECT_URI=http://localhost:3000/oauth/callback
   PORT=3000
   ```

   **Finding your Shop ID:**
   - Go to your Etsy shop
   - Your URL will look like: `https://www.etsy.com/shop/YourShopName`
   - You can use your shop name as the Shop ID, or use the numeric ID from the API

### 3. Authenticate with Etsy

Run the authentication flow:

```bash
npm run auth
```

This will:
1. Start a local server on port 3000
2. Open your browser to Etsy's authorization page
3. Ask you to grant permissions to your app
4. Save your access token securely

**Note:** You only need to do this once. The tool will automatically refresh your token when needed.

### 4. Add Products

#### Add a Single Example Product

Test the tool with a sample product:

```bash
npm run add-product -- --example
```

#### Bulk Upload from JSON File

1. Create a JSON file with your products (see `products.example.json` for format)
2. Run:

```bash
npm run add-product -- --file products.json
```

## Product Data Format

Each product should be a JSON object with the following fields:

### Required Fields

```json
{
  "title": "Product Title (max 140 characters)",
  "description": "Detailed product description",
  "price": 29.99,
  "quantity": 10,
  "whoMade": "i_did",
  "whenMade": "2020_2024"
}
```

### Optional Fields

```json
{
  "materials": ["wood", "metal", "paint"],
  "tags": ["handmade", "vintage", "rustic"],
  "isSupply": false,
  "taxonomyId": 1234,
  "shippingProfileId": 5678,
  "returnPolicyId": 9012,
  "itemWeight": 16,
  "itemWeightUnit": "oz",
  "itemLength": 10,
  "itemWidth": 8,
  "itemHeight": 6,
  "itemDimensionsUnit": "in",
  "images": ["path/to/image1.jpg", "path/to/image2.jpg"]
}
```

### Field Options

**whoMade:**
- `i_did` - You made it
- `someone_else` - Someone else made it
- `collective` - A member of your collective made it

**whenMade:**
- `made_to_order` - Made to order
- `2020_2024` - 2020-2024
- `2010_2019` - 2010-2019
- `2000_2009` - 2000-2009
- And other vintage date ranges...

**itemWeightUnit:**
- `oz`, `lb`, `g`, `kg`

**itemDimensionsUnit:**
- `in`, `ft`, `mm`, `cm`, `m`, `yd`, `inches`

## Example Products File

See `products.example.json` for a complete example with 4 sample products including:
- Ceramic coffee mug
- Leather bookmark
- Soy candle
- Macramé wall hanging

## API Rate Limits

Etsy has rate limits on their API. This tool includes a 1-second delay between uploads when processing multiple products to avoid hitting rate limits.

## Troubleshooting

### "Not authenticated" Error

Run `npm run auth` to authenticate with Etsy.

### "Token expired" Error

The tool should automatically refresh your token. If it doesn't work, re-run `npm run auth`.

### "Missing ETSY_SHOP_ID" Warning

Add your shop ID to the `.env` file. You can find it in your Etsy shop URL or via the Etsy API.

### Port 3000 Already in Use

Change the `PORT` in your `.env` file to another port (e.g., 3001), and update the `REDIRECT_URI` accordingly.

## Security Notes

- Never commit your `.env` file or `tokens.json` to version control
- Keep your API credentials secure
- The OAuth tokens are stored locally in `tokens.json`
- Access tokens expire after a period; refresh tokens are used to get new access tokens automatically

## Development

### Build TypeScript

```bash
npm run build
```

### Type Check

```bash
npm run type-check
```

### Run Development Server

```bash
npm run dev
```

## Project Structure

```
.
├── src/
│   ├── auth.ts           # OAuth 2.0 authentication flow
│   ├── etsyClient.ts     # Etsy API client
│   ├── addProduct.ts     # Product upload script
│   ├── config.ts         # Configuration management
│   ├── types.ts          # TypeScript type definitions
│   └── index.ts          # Main entry point
├── .env.example          # Example environment variables
├── products.example.json # Example products file
├── package.json
├── tsconfig.json
└── README.md
```

## API Documentation

For more information about the Etsy API, visit:
- [Etsy API Documentation](https://developers.etsy.com/documentation)
- [Etsy API v3 Reference](https://developers.etsy.com/documentation/reference)

## Future Enhancements

Potential features to add:
- Image upload support (currently needs manual upload)
- Product variations (size, color, etc.)
- Inventory management
- Order processing
- Product updates and deletions
- CSV import support
- Interactive CLI for product creation

## License

MIT

## Support

For issues or questions:
1. Check the Etsy API documentation
2. Verify your API credentials are correct
3. Ensure your app has the necessary permissions
4. Check that your shop is set up correctly on Etsy

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
