import axios, { AxiosInstance } from 'axios';
import { getConfig, loadTokens, saveTokens } from './config.js';
import { ProductData, EtsyListing, EtsyApiError } from './types.js';

const ETSY_API_BASE = 'https://api.etsy.com/v3/application';
const ETSY_TOKEN_URL = 'https://api.etsy.com/v3/public/oauth/token';

export class EtsyClient {
  private client: AxiosInstance;
  private config = getConfig();

  constructor() {
    this.client = axios.create({
      baseURL: ETSY_API_BASE,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor to attach access token
    this.client.interceptors.request.use(
      async (config) => {
        const tokens = loadTokens();
        if (!tokens.accessToken) {
          throw new Error(
            'No access token found. Please run authentication first: npm run auth'
          );
        }

        // Check if token is expired and refresh if needed
        if (tokens.expiresAt && tokens.expiresAt < Date.now() + 5 * 60 * 1000) {
          await this.refreshAccessToken();
          const newTokens = loadTokens();
          config.headers.Authorization = `Bearer ${newTokens.accessToken}`;
        } else {
          config.headers.Authorization = `Bearer ${tokens.accessToken}`;
        }

        return config;
      },
      (error) => Promise.reject(error)
    );

    // Add response interceptor for better error handling
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          // Token expired, try to refresh
          try {
            await this.refreshAccessToken();
            // Retry the original request
            const originalRequest = error.config;
            const tokens = loadTokens();
            originalRequest.headers.Authorization = `Bearer ${tokens.accessToken}`;
            return this.client(originalRequest);
          } catch (refreshError) {
            console.error('❌ Token refresh failed. Please re-authenticate: npm run auth');
            throw refreshError;
          }
        }
        return Promise.reject(error);
      }
    );
  }

  private async refreshAccessToken(): Promise<void> {
    const tokens = loadTokens();
    if (!tokens.refreshToken) {
      throw new Error('No refresh token available. Please re-authenticate.');
    }

    console.log('🔄 Refreshing access token...');

    try {
      const response = await axios.post(
        ETSY_TOKEN_URL,
        new URLSearchParams({
          grant_type: 'refresh_token',
          client_id: this.config.apiKey,
          refresh_token: tokens.refreshToken,
        }).toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      const { access_token, refresh_token, expires_in } = response.data;

      saveTokens({
        accessToken: access_token,
        refreshToken: refresh_token,
        expiresAt: Date.now() + expires_in * 1000,
      });

      console.log('✅ Access token refreshed');
    } catch (error) {
      console.error('❌ Failed to refresh token:', error);
      throw new Error('Token refresh failed. Please re-authenticate.');
    }
  }

  async getShopInfo(shopId?: string): Promise<any> {
    const id = shopId || this.config.shopId;
    if (!id) {
      throw new Error('Shop ID is required. Set ETSY_SHOP_ID in .env or pass as parameter.');
    }

    try {
      const response = await this.client.get(`/shops/${id}`);
      return response.data;
    } catch (error) {
      this.handleError(error, 'Failed to get shop info');
    }
  }

  async createListing(productData: ProductData, shopId?: string): Promise<EtsyListing> {
    const id = shopId || this.config.shopId;
    if (!id) {
      throw new Error('Shop ID is required. Set ETSY_SHOP_ID in .env or pass as parameter.');
    }

    try {
      // Prepare listing data according to Etsy API v3 requirements
      const listingData: any = {
        quantity: productData.quantity,
        title: productData.title,
        description: productData.description,
        price: productData.price,
        who_made: productData.whoMade,
        when_made: productData.whenMade,
        taxonomy_id: productData.taxonomyId,
        shipping_profile_id: productData.shippingProfileId,
        return_policy_id: productData.returnPolicyId,
        type: productData.isSupply ? 'supply' : 'physical',
      };

      // Add optional fields if provided
      if (productData.materials && productData.materials.length > 0) {
        listingData.materials = productData.materials;
      }

      if (productData.tags && productData.tags.length > 0) {
        listingData.tags = productData.tags;
      }

      if (productData.itemWeight) {
        listingData.item_weight = productData.itemWeight;
        listingData.item_weight_unit = productData.itemWeightUnit || 'oz';
      }

      if (productData.itemLength) {
        listingData.item_length = productData.itemLength;
      }

      if (productData.itemWidth) {
        listingData.item_width = productData.itemWidth;
      }

      if (productData.itemHeight) {
        listingData.item_height = productData.itemHeight;
      }

      if (productData.itemDimensionsUnit) {
        listingData.item_dimensions_unit = productData.itemDimensionsUnit;
      }

      console.log('📤 Creating listing...');
      const response = await this.client.post(`/shops/${id}/listings`, listingData);

      const listing: EtsyListing = response.data;
      console.log(`✅ Listing created successfully!`);
      console.log(`   ID: ${listing.listing_id}`);
      console.log(`   URL: ${listing.url}`);

      // Upload images if provided
      if (productData.images && productData.images.length > 0) {
        await this.uploadImages(listing.listing_id, productData.images);
      }

      return listing;
    } catch (error) {
      this.handleError(error, 'Failed to create listing');
      throw error;
    }
  }

  async uploadImages(listingId: number, imagePaths: string[]): Promise<void> {
    console.log(`📸 Uploading ${imagePaths.length} image(s)...`);

    for (let i = 0; i < imagePaths.length; i++) {
      const imagePath = imagePaths[i];
      try {
        // Note: Image upload requires multipart/form-data
        // This is a placeholder - actual implementation would need FormData
        console.log(`   Uploading image ${i + 1}/${imagePaths.length}: ${imagePath}`);

        // In a real implementation, you would:
        // 1. Read the image file
        // 2. Create FormData with the image
        // 3. POST to /application/shops/{shop_id}/listings/{listing_id}/images

        console.log(`   ⚠️  Image upload not yet implemented. Please upload images manually.`);
      } catch (error) {
        console.error(`   ❌ Failed to upload image ${imagePath}:`, error);
      }
    }
  }

  async getShippingProfiles(shopId?: string): Promise<any[]> {
    const id = shopId || this.config.shopId;
    if (!id) {
      throw new Error('Shop ID is required.');
    }

    try {
      const response = await this.client.get(`/shops/${id}/shipping-profiles`);
      return response.data.results || [];
    } catch (error) {
      this.handleError(error, 'Failed to get shipping profiles');
      return [];
    }
  }

  async getReturnPolicies(shopId?: string): Promise<any[]> {
    const id = shopId || this.config.shopId;
    if (!id) {
      throw new Error('Shop ID is required.');
    }

    try {
      const response = await this.client.get(`/shops/${id}/policies/return`);
      return response.data.results || [];
    } catch (error) {
      this.handleError(error, 'Failed to get return policies');
      return [];
    }
  }

  private handleError(error: any, message: string): void {
    if (axios.isAxiosError(error)) {
      const apiError = error.response?.data as EtsyApiError | undefined;
      console.error(`❌ ${message}`);
      console.error(`   Status: ${error.response?.status}`);
      console.error(`   Error: ${apiError?.error || error.message}`);
      if (apiError?.error_description) {
        console.error(`   Description: ${apiError.error_description}`);
      }
    } else {
      console.error(`❌ ${message}:`, error);
    }
  }
}
