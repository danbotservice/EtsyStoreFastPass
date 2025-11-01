import { EtsyClient } from './etsyClient.js';
import { hasValidTokens, getConfig } from './config.js';

async function main() {
  console.log('🎨 Etsy Store FastPass\n');
  console.log('An automation tool for quickly adding products to your Etsy shop\n');

  // Check authentication status
  if (hasValidTokens()) {
    console.log('✅ You are authenticated!');

    try {
      const client = new EtsyClient();
      const config = getConfig();

      if (config.shopId) {
        const shopInfo = await client.getShopInfo();
        console.log(`📍 Connected to shop: ${shopInfo.shop_name || config.shopId}`);
      }
    } catch (error) {
      console.error('⚠️  Could not fetch shop info');
    }

    console.log('\n📚 Available commands:');
    console.log('  npm run add-product -- --file products.json');
    console.log('  npm run add-product -- --example');
  } else {
    console.log('❌ Not authenticated');
    console.log('\n🔐 To get started, run:');
    console.log('  npm run auth');
  }

  console.log('\n💡 For more information, check the README.md file');
}

main().catch(console.error);
