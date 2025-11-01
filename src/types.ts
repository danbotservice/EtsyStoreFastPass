export interface EtsyConfig {
  apiKey: string;
  apiSecret: string;
  redirectUri: string;
  shopId: string;
  port: number;
}

export interface TokenStorage {
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: number;
}

export interface ProductData {
  title: string;
  description: string;
  price: number;
  quantity: number;
  whoMade: 'i_did' | 'someone_else' | 'collective';
  whenMade: 'made_to_order' | '2020_2024' | '2010_2019' | '2000_2009' | 'before_2000' | '1990s' | '1980s' | '1970s' | '1960s' | '1950s' | '1940s' | '1930s' | '1920s' | '1910s' | '1900s' | '1800s' | '1700s' | 'before_1700';
  taxonomyId?: number;
  shippingProfileId?: number;
  returnPolicyId?: number;
  materials?: string[];
  tags?: string[];
  images?: string[];
  isSupply?: boolean;
  itemWeight?: number;
  itemWeightUnit?: 'oz' | 'lb' | 'g' | 'kg';
  itemLength?: number;
  itemWidth?: number;
  itemHeight?: number;
  itemDimensionsUnit?: 'in' | 'ft' | 'mm' | 'cm' | 'm' | 'yd' | 'inches';
}

export interface EtsyListing {
  listing_id: number;
  user_id: number;
  shop_id: number;
  title: string;
  description: string;
  state: string;
  creation_timestamp: number;
  ending_timestamp: number;
  original_creation_timestamp: number;
  last_modified_timestamp: number;
  price: {
    amount: number;
    divisor: number;
    currency_code: string;
  };
  quantity: number;
  sku: string[];
  tags: string[];
  materials: string[];
  url: string;
  views: number;
  num_favorers: number;
  shipping_profile_id: number;
  return_policy_id?: number;
  processing_min: number;
  processing_max: number;
  who_made: string;
  when_made: string;
  is_supply: boolean;
  item_weight?: number;
  item_weight_unit?: string;
  item_length?: number;
  item_width?: number;
  item_height?: number;
  item_dimensions_unit?: string;
  is_private: boolean;
  style: string[];
  file_data: string;
  has_variations: boolean;
  should_auto_renew: boolean;
  language: string;
  taxonomy_id?: number;
}

export interface EtsyApiError {
  error: string;
  error_description?: string;
}
