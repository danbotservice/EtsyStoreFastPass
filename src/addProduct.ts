import { EtsyClient } from './etsyClient.js';
import { ProductData } from './types.js';
import { hasValidTokens } from './config.js';
import { readFileSync } from 'fs';

async function addProduct(productData: ProductData): Promise<void> {
  // Check authentication
  if (!hasValidTokens()) {
    console.error('❌ Not authenticated. Please run: npm run auth');
    process.exit(1);
  }

  const client = new EtsyClient();

  try {
    // Create the listing
    const listing = await client.createListing(productData);

    console.log('\n✅ Product added successfully!');
    console.log(`   Title: ${listing.title}`);
    console.log(`   Price: ${listing.price.amount / listing.price.divisor} ${listing.price.currency_code}`);
    console.log(`   Quantity: ${listing.quantity}`);
    console.log(`   View at: ${listing.url}`);
  } catch (error) {
    console.error('❌ Failed to add product:', error);
    process.exit(1);
  }
}

async function addProductsFromFile(filePath: string): Promise<void> {
  // Check authentication
  if (!hasValidTokens()) {
    console.error('❌ Not authenticated. Please run: npm run auth');
    process.exit(1);
  }

  const client = new EtsyClient();

  try {
    console.log(`📂 Reading products from ${filePath}...`);
    const fileContent = readFileSync(filePath, 'utf-8');
    const products: ProductData[] = JSON.parse(fileContent);

    if (!Array.isArray(products)) {
      throw new Error('File must contain an array of products');
    }

    console.log(`📦 Found ${products.length} product(s) to add\n`);

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      console.log(`\n[${i + 1}/${products.length}] Adding: ${product.title}`);

      try {
        const listing = await client.createListing(product);
        console.log(`   ✅ Success! View at: ${listing.url}`);
        successCount++;

        // Add a small delay between requests to avoid rate limiting
        if (i < products.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      } catch (error) {
        console.error(`   ❌ Failed to add this product`);
        failCount++;
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   ✅ Successfully added: ${successCount}`);
    console.log(`   ❌ Failed: ${failCount}`);
  } catch (error) {
    console.error('❌ Error processing file:', error);
    process.exit(1);
  }
}

// CLI interface
const args = process.argv.slice(2);

if (args.length === 0) {
  console.log('🚀 Etsy Product Automation\n');
  console.log('Usage:');
  console.log('  npm run add-product -- --file <path-to-json>');
  console.log('  npm run add-product -- --example');
  console.log('\nExamples:');
  console.log('  npm run add-product -- --file products.json');
  console.log('  npm run add-product -- --example');
  process.exit(0);
}

if (args[0] === '--file' && args[1]) {
  addProductsFromFile(args[1]).catch(console.error);
} else if (args[0] === '--example') {
  // Example single product
  const exampleProduct: ProductData = {
    title: 'Handmade Ceramic Mug - Blue Glaze',
    description:
      'Beautiful handmade ceramic mug with a stunning blue glaze finish. Perfect for your morning coffee or tea. Each piece is unique and made with care.\n\nDimensions: 4" tall, 3" diameter\nCapacity: 12 oz\nMicrowave and dishwasher safe',
    price: 28.99,
    quantity: 10,
    whoMade: 'i_did',
    whenMade: 'made_to_order',
    materials: ['ceramic', 'glaze'],
    tags: ['mug', 'handmade', 'ceramic', 'pottery', 'coffee mug', 'tea cup', 'blue'],
    isSupply: false,
  };

  console.log('📝 Adding example product...\n');
  addProduct(exampleProduct).catch(console.error);
} else {
  console.error('❌ Invalid arguments. Use --help for usage information.');
  process.exit(1);
}
