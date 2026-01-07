/**
 * Purchase Service - RevenueCat Integration
 * 
 * To fully integrate RevenueCat:
 * 1. Install: npx expo install react-native-purchases
 * 2. Create account at https://app.revenuecat.com
 * 3. Set up products in App Store Connect / Google Play Console
 * 4. Configure products in RevenueCat dashboard
 * 5. Replace REVENUECAT_API_KEY with your actual key
 * 
 * For now, this service uses mock data for development.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

// RevenueCat API keys (replace with actual keys when ready)
const REVENUECAT_IOS_KEY = "your_ios_api_key";
const REVENUECAT_ANDROID_KEY = "your_android_api_key";

// Product identifiers (must match App Store Connect / Google Play Console)
export const PRODUCT_IDS = {
  MONTHLY: "premium_monthly",
  ANNUAL: "premium_annual",
};

export interface SubscriptionProduct {
  identifier: string;
  title: string;
  description: string;
  price: string;
  priceString: string;
  period: "monthly" | "annual";
  currencyCode: string;
}

export interface PurchaserInfo {
  isPremium: boolean;
  activeSubscriptions: string[];
  expirationDate: string | null;
  originalPurchaseDate: string | null;
}

// Mock products for development
const MOCK_PRODUCTS: SubscriptionProduct[] = [
  {
    identifier: PRODUCT_IDS.MONTHLY,
    title: "Premium Monthly",
    description: "Unlock all premium features",
    price: "4.99",
    priceString: "$4.99/month",
    period: "monthly",
    currencyCode: "USD",
  },
  {
    identifier: PRODUCT_IDS.ANNUAL,
    title: "Premium Annual",
    description: "Save 40% with annual billing",
    price: "35.99",
    priceString: "$35.99/year",
    period: "annual",
    currencyCode: "USD",
  },
];

const PREMIUM_STATUS_KEY = "@premium_status";
const MOCK_MODE = true; // Set to false when RevenueCat is configured

class PurchaseService {
  private isInitialized = false;
  private purchaserInfo: PurchaserInfo | null = null;
  private listeners: ((info: PurchaserInfo) => void)[] = [];

  async initialize(userId?: string): Promise<void> {
    if (this.isInitialized) return;

    if (MOCK_MODE) {
      // Load mock premium status from storage
      await this.loadMockStatus();
      this.isInitialized = true;
      return;
    }

    // Real RevenueCat initialization
    // Uncomment when ready to integrate:
    /*
    try {
      const { Platform } = require("react-native");
      const Purchases = require("react-native-purchases").default;
      
      const apiKey = Platform.OS === "ios" 
        ? REVENUECAT_IOS_KEY 
        : REVENUECAT_ANDROID_KEY;
      
      await Purchases.configure({ apiKey });
      
      if (userId) {
        await Purchases.logIn(userId);
      }
      
      // Set up purchaser info listener
      Purchases.addCustomerInfoUpdateListener((info: any) => {
        this.updatePurchaserInfo(this.parsePurchaserInfo(info));
      });
      
      // Get initial purchaser info
      const info = await Purchases.getCustomerInfo();
      this.updatePurchaserInfo(this.parsePurchaserInfo(info));
      
      this.isInitialized = true;
    } catch (error) {
      console.error("Error initializing RevenueCat:", error);
    }
    */
  }

  private async loadMockStatus(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem(PREMIUM_STATUS_KEY);
      if (data) {
        this.purchaserInfo = JSON.parse(data);
      } else {
        this.purchaserInfo = {
          isPremium: false,
          activeSubscriptions: [],
          expirationDate: null,
          originalPurchaseDate: null,
        };
      }
      this.notifyListeners();
    } catch (error) {
      console.error("Error loading mock status:", error);
      this.purchaserInfo = {
        isPremium: false,
        activeSubscriptions: [],
        expirationDate: null,
        originalPurchaseDate: null,
      };
    }
  }

  private async saveMockStatus(): Promise<void> {
    try {
      await AsyncStorage.setItem(
        PREMIUM_STATUS_KEY,
        JSON.stringify(this.purchaserInfo)
      );
    } catch (error) {
      console.error("Error saving mock status:", error);
    }
  }

  private updatePurchaserInfo(info: PurchaserInfo): void {
    this.purchaserInfo = info;
    this.notifyListeners();
  }

  private notifyListeners(): void {
    if (this.purchaserInfo) {
      this.listeners.forEach((listener) => listener(this.purchaserInfo!));
    }
  }

  addPurchaserInfoListener(listener: (info: PurchaserInfo) => void): () => void {
    this.listeners.push(listener);
    // Immediately call with current info
    if (this.purchaserInfo) {
      listener(this.purchaserInfo);
    }
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  async getProducts(): Promise<SubscriptionProduct[]> {
    if (MOCK_MODE) {
      return MOCK_PRODUCTS;
    }

    // Real RevenueCat implementation:
    /*
    try {
      const Purchases = require("react-native-purchases").default;
      const offerings = await Purchases.getOfferings();
      
      if (offerings.current) {
        return offerings.current.availablePackages.map((pkg: any) => ({
          identifier: pkg.product.identifier,
          title: pkg.product.title,
          description: pkg.product.description,
          price: pkg.product.price.toString(),
          priceString: pkg.product.priceString,
          period: pkg.packageType === "ANNUAL" ? "annual" : "monthly",
          currencyCode: pkg.product.currencyCode,
        }));
      }
      return [];
    } catch (error) {
      console.error("Error getting products:", error);
      return [];
    }
    */
    return MOCK_PRODUCTS;
  }

  async purchaseProduct(productId: string): Promise<{ success: boolean; error?: string }> {
    if (MOCK_MODE) {
      // Simulate successful purchase
      const product = MOCK_PRODUCTS.find((p) => p.identifier === productId);
      if (!product) {
        return { success: false, error: "Product not found" };
      }

      const expirationDate = new Date();
      if (product.period === "annual") {
        expirationDate.setFullYear(expirationDate.getFullYear() + 1);
      } else {
        expirationDate.setMonth(expirationDate.getMonth() + 1);
      }

      this.purchaserInfo = {
        isPremium: true,
        activeSubscriptions: [productId],
        expirationDate: expirationDate.toISOString(),
        originalPurchaseDate: new Date().toISOString(),
      };

      await this.saveMockStatus();
      this.notifyListeners();

      return { success: true };
    }

    // Real RevenueCat implementation:
    /*
    try {
      const Purchases = require("react-native-purchases").default;
      const offerings = await Purchases.getOfferings();
      
      const packageToPurchase = offerings.current?.availablePackages.find(
        (pkg: any) => pkg.product.identifier === productId
      );
      
      if (!packageToPurchase) {
        return { success: false, error: "Product not found" };
      }
      
      const { customerInfo } = await Purchases.purchasePackage(packageToPurchase);
      this.updatePurchaserInfo(this.parsePurchaserInfo(customerInfo));
      
      return { success: true };
    } catch (error: any) {
      if (error.userCancelled) {
        return { success: false, error: "Purchase cancelled" };
      }
      console.error("Error purchasing:", error);
      return { success: false, error: error.message || "Purchase failed" };
    }
    */
    return { success: false, error: "Not implemented" };
  }

  async restorePurchases(): Promise<{ success: boolean; error?: string }> {
    if (MOCK_MODE) {
      // In mock mode, just return current status
      return { success: true };
    }

    // Real RevenueCat implementation:
    /*
    try {
      const Purchases = require("react-native-purchases").default;
      const { customerInfo } = await Purchases.restorePurchases();
      this.updatePurchaserInfo(this.parsePurchaserInfo(customerInfo));
      return { success: true };
    } catch (error: any) {
      console.error("Error restoring purchases:", error);
      return { success: false, error: error.message || "Restore failed" };
    }
    */
    return { success: true };
  }

  getPurchaserInfo(): PurchaserInfo | null {
    return this.purchaserInfo;
  }

  isPremium(): boolean {
    return this.purchaserInfo?.isPremium ?? false;
  }

  // For development/testing - simulate premium toggle
  async toggleMockPremium(): Promise<void> {
    if (!MOCK_MODE) return;

    if (this.purchaserInfo?.isPremium) {
      this.purchaserInfo = {
        isPremium: false,
        activeSubscriptions: [],
        expirationDate: null,
        originalPurchaseDate: null,
      };
    } else {
      const expirationDate = new Date();
      expirationDate.setMonth(expirationDate.getMonth() + 1);

      this.purchaserInfo = {
        isPremium: true,
        activeSubscriptions: [PRODUCT_IDS.MONTHLY],
        expirationDate: expirationDate.toISOString(),
        originalPurchaseDate: new Date().toISOString(),
      };
    }

    await this.saveMockStatus();
    this.notifyListeners();
  }

  // Parse RevenueCat customer info to our format
  private parsePurchaserInfo(customerInfo: any): PurchaserInfo {
    const entitlements = customerInfo.entitlements?.active || {};
    const isPremium = Object.keys(entitlements).length > 0;

    return {
      isPremium,
      activeSubscriptions: Object.keys(entitlements),
      expirationDate: entitlements.premium?.expirationDate || null,
      originalPurchaseDate: entitlements.premium?.originalPurchaseDate || null,
    };
  }
}

export const purchaseService = new PurchaseService();

