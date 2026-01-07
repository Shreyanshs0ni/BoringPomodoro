import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import {
  purchaseService,
  PurchaserInfo,
  SubscriptionProduct,
} from "../services/PurchaseService";

// Define what features are available at each tier
export const FREE_TIER_LIMITS = {
  ambientSounds: ["rain", "forest"], // Only these sound IDs available
  maxThemes: 2, // Limited themes
  firebaseSync: false,
  advancedStats: false,
  customCategories: false,
  maxTasksPerDay: 10,
};

export const PREMIUM_FEATURES = {
  allAmbientSounds: true,
  allThemes: true,
  firebaseSync: true,
  advancedStats: true,
  customCategories: true,
  unlimitedTasks: true,
  prioritySupport: true,
};

interface PremiumContextType {
  isPremium: boolean;
  isLoading: boolean;
  purchaserInfo: PurchaserInfo | null;
  products: SubscriptionProduct[];

  // Feature checks
  canUseAmbientSound: (soundId: string) => boolean;
  canUseTheme: (themeId: string) => boolean;
  canUseFirebaseSync: () => boolean;
  canUseAdvancedStats: () => boolean;
  canAddMoreTasks: (currentTaskCount: number) => boolean;

  // Purchase actions
  purchase: (productId: string) => Promise<{ success: boolean; error?: string }>;
  restore: () => Promise<{ success: boolean; error?: string }>;
  refreshStatus: () => Promise<void>;

  // Development helper
  toggleMockPremium: () => Promise<void>;

  // Navigation helper
  showPaywall: boolean;
  setShowPaywall: (show: boolean) => void;
}

const PremiumContext = createContext<PremiumContextType | undefined>(undefined);

interface PremiumProviderProps {
  children: ReactNode;
}

export const PremiumProvider: React.FC<PremiumProviderProps> = ({ children }) => {
  const [isPremium, setIsPremium] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [purchaserInfo, setPurchaserInfo] = useState<PurchaserInfo | null>(null);
  const [products, setProducts] = useState<SubscriptionProduct[]>([]);
  const [showPaywall, setShowPaywall] = useState(false);

  useEffect(() => {
    const initialize = async () => {
      setIsLoading(true);
      try {
        await purchaseService.initialize();
        const prods = await purchaseService.getProducts();
        setProducts(prods);
      } catch (error) {
        console.error("Error initializing purchase service:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initialize();

    // Listen for purchaser info updates
    const unsubscribe = purchaseService.addPurchaserInfoListener((info) => {
      setPurchaserInfo(info);
      setIsPremium(info.isPremium);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const canUseAmbientSound = useCallback(
    (soundId: string): boolean => {
      if (isPremium) return true;
      return FREE_TIER_LIMITS.ambientSounds.includes(soundId);
    },
    [isPremium]
  );

  const canUseTheme = useCallback(
    (themeId: string): boolean => {
      if (isPremium) return true;
      // First 2 themes are free
      const freeThemes = ["default", "dark"];
      return freeThemes.includes(themeId);
    },
    [isPremium]
  );

  const canUseFirebaseSync = useCallback((): boolean => {
    return isPremium && PREMIUM_FEATURES.firebaseSync;
  }, [isPremium]);

  const canUseAdvancedStats = useCallback((): boolean => {
    return isPremium && PREMIUM_FEATURES.advancedStats;
  }, [isPremium]);

  const canAddMoreTasks = useCallback(
    (currentTaskCount: number): boolean => {
      if (isPremium) return true;
      return currentTaskCount < FREE_TIER_LIMITS.maxTasksPerDay;
    },
    [isPremium]
  );

  const purchase = useCallback(
    async (productId: string): Promise<{ success: boolean; error?: string }> => {
      setIsLoading(true);
      try {
        const result = await purchaseService.purchaseProduct(productId);
        return result;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const restore = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      const result = await purchaseService.restorePurchases();
      return result;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshStatus = useCallback(async (): Promise<void> => {
    await purchaseService.restorePurchases();
  }, []);

  const toggleMockPremium = useCallback(async (): Promise<void> => {
    await purchaseService.toggleMockPremium();
  }, []);

  const value: PremiumContextType = {
    isPremium,
    isLoading,
    purchaserInfo,
    products,
    canUseAmbientSound,
    canUseTheme,
    canUseFirebaseSync,
    canUseAdvancedStats,
    canAddMoreTasks,
    purchase,
    restore,
    refreshStatus,
    toggleMockPremium,
    showPaywall,
    setShowPaywall,
  };

  return (
    <PremiumContext.Provider value={value}>{children}</PremiumContext.Provider>
  );
};

export const usePremium = (): PremiumContextType => {
  const context = useContext(PremiumContext);
  if (context === undefined) {
    throw new Error("usePremium must be used within a PremiumProvider");
  }
  return context;
};

