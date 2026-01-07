import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from "react-native";
import Svg, { Path, Rect } from "react-native-svg";
import { usePremium } from "../context/PremiumContext";
import { useSettings } from "../context/SettingsContext";
import { PRODUCT_IDS } from "../services/PurchaseService";
import { typography } from "../theme/typography";

interface PaywallScreenProps {
  onClose: () => void;
}

// Icons
const SoundWaveIcon = ({ color }: { color: string }) => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path d="M3 10v4M7 6v12M11 3v18M15 8v8M19 5v14M23 9v6" stroke={color} strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

const PaletteIcon = ({ color }: { color: string }) => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.93 0 1.5-.67 1.5-1.5 0-.39-.14-.74-.39-1-.23-.23-.37-.55-.37-.91 0-.67.56-1.23 1.26-1.23H16c2.76 0 5-2.24 5-5 0-4.42-4.03-8-9-8z" stroke={color} strokeWidth={2} />
    <Path d="M6.5 11.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM9 7.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM15 7.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM17.5 11.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" fill={color} />
  </Svg>
);

const CloudSyncIcon = ({ color }: { color: string }) => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path d="M18 10a4 4 0 00-4-4 5.9 5.9 0 00-5.5 3.5A4.5 4.5 0 005 14a4.5 4.5 0 004.5 4.5h8.5a4 4 0 000-8z" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M12 13v5M12 18l-2-2M12 18l2-2" stroke={color} strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

const ChartIcon = ({ color }: { color: string }) => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Rect x={3} y={12} width={4} height={8} rx={1} stroke={color} strokeWidth={2} />
    <Rect x={10} y={8} width={4} height={12} rx={1} stroke={color} strokeWidth={2} />
    <Rect x={17} y={4} width={4} height={16} rx={1} stroke={color} strokeWidth={2} />
  </Svg>
);

const CheckIcon = ({ color }: { color: string }) => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <Path d="M20 6L9 17l-5-5" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const PaywallScreen: React.FC<PaywallScreenProps> = ({ onClose }) => {
  const { products, purchase, restore, isLoading, isPremium, toggleMockPremium } = usePremium();
  const { colors, isDark } = useSettings();
  const [selectedProduct, setSelectedProduct] = useState(PRODUCT_IDS.ANNUAL);
  const [processingPurchase, setProcessingPurchase] = useState(false);

  const handlePurchase = async () => {
    setProcessingPurchase(true);
    const result = await purchase(selectedProduct);
    setProcessingPurchase(false);

    if (result.success) {
      Alert.alert("Welcome to Premium!", "You now have access to all premium features.", [{ text: "Let's Go!", onPress: onClose }]);
    } else if (result.error && result.error !== "Purchase cancelled") {
      Alert.alert("Purchase Failed", result.error);
    }
  };

  const handleRestore = async () => {
    setProcessingPurchase(true);
    const result = await restore();
    setProcessingPurchase(false);

    if (result.success && isPremium) {
      Alert.alert("Purchases Restored!", "Your premium subscription has been restored.", [{ text: "Great!", onPress: onClose }]);
    } else if (!isPremium) {
      Alert.alert("No Purchases Found", "We couldn't find any previous purchases for this account.");
    }
  };

  const monthlyProduct = products.find((p) => p.period === "monthly");
  const annualProduct = products.find((p) => p.period === "annual");

  const FEATURES = [
    { icon: <SoundWaveIcon color={colors.text} />, title: "All Ambient Sounds", description: "Rain, forest, café, ocean & more" },
    { icon: <PaletteIcon color={colors.text} />, title: "Theme Customization", description: "More themes and colors" },
    { icon: <CloudSyncIcon color={colors.text} />, title: "Cloud Sync", description: "Sync across all devices" },
    { icon: <ChartIcon color={colors.text} />, title: "Advanced Analytics", description: "Detailed productivity insights" },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Close button */}
        <TouchableOpacity style={[styles.closeButton, { backgroundColor: colors.card }]} onPress={onClose}>
          <Text style={[styles.closeButtonText, { color: colors.text }]}>✕</Text>
        </TouchableOpacity>

        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Unlock Premium</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Supercharge your focus</Text>
        </View>

        {/* Features list */}
        <View style={[styles.featuresContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {FEATURES.map((feature, index) => (
            <View key={index} style={[styles.featureRow, index < FEATURES.length - 1 && { borderBottomColor: colors.border, borderBottomWidth: 1 }]}>
              <View style={[styles.featureIcon, { backgroundColor: colors.surface }]}>{feature.icon}</View>
              <View style={styles.featureText}>
                <Text style={[styles.featureTitle, { color: colors.text }]}>{feature.title}</Text>
                <Text style={[styles.featureDescription, { color: colors.textMuted }]}>{feature.description}</Text>
              </View>
              <CheckIcon color={colors.text} />
            </View>
          ))}
        </View>

        {/* Subscription options */}
        <View style={styles.productsContainer}>
          <Text style={[styles.productsTitle, { color: colors.text }]}>Choose Your Plan</Text>

          {annualProduct && (
            <TouchableOpacity
              style={[styles.productCard, { backgroundColor: colors.card, borderColor: selectedProduct === PRODUCT_IDS.ANNUAL ? colors.text : colors.border }]}
              onPress={() => setSelectedProduct(PRODUCT_IDS.ANNUAL)}
            >
              <View style={[styles.saveBadge, { backgroundColor: colors.text }]}>
                <Text style={[styles.saveBadgeText, { color: colors.background }]}>SAVE 40%</Text>
              </View>
              <View style={styles.productInfo}>
                <Text style={[styles.productTitle, { color: colors.text }]}>{annualProduct.title}</Text>
                <Text style={[styles.productPrice, { color: colors.text }]}>{annualProduct.priceString}</Text>
                <Text style={[styles.productPeriod, { color: colors.textMuted }]}>Billed annually</Text>
              </View>
              <View style={[styles.radioOuter, { borderColor: selectedProduct === PRODUCT_IDS.ANNUAL ? colors.text : colors.border }]}>
                {selectedProduct === PRODUCT_IDS.ANNUAL && <View style={[styles.radioInner, { backgroundColor: colors.text }]} />}
              </View>
            </TouchableOpacity>
          )}

          {monthlyProduct && (
            <TouchableOpacity
              style={[styles.productCard, { backgroundColor: colors.card, borderColor: selectedProduct === PRODUCT_IDS.MONTHLY ? colors.text : colors.border }]}
              onPress={() => setSelectedProduct(PRODUCT_IDS.MONTHLY)}
            >
              <View style={styles.productInfo}>
                <Text style={[styles.productTitle, { color: colors.text }]}>{monthlyProduct.title}</Text>
                <Text style={[styles.productPrice, { color: colors.text }]}>{monthlyProduct.priceString}</Text>
                <Text style={[styles.productPeriod, { color: colors.textMuted }]}>Billed monthly</Text>
              </View>
              <View style={[styles.radioOuter, { borderColor: selectedProduct === PRODUCT_IDS.MONTHLY ? colors.text : colors.border }]}>
                {selectedProduct === PRODUCT_IDS.MONTHLY && <View style={[styles.radioInner, { backgroundColor: colors.text }]} />}
              </View>
            </TouchableOpacity>
          )}
        </View>

        {/* Purchase button */}
        <TouchableOpacity style={[styles.purchaseButton, { backgroundColor: colors.text }]} onPress={handlePurchase} disabled={processingPurchase || isLoading}>
          {processingPurchase ? <ActivityIndicator color={colors.background} /> : <Text style={[styles.purchaseButtonText, { color: colors.background }]}>Start Premium</Text>}
        </TouchableOpacity>

        {/* Restore purchases */}
        <TouchableOpacity style={styles.restoreButton} onPress={handleRestore} disabled={processingPurchase || isLoading}>
          <Text style={[styles.restoreButtonText, { color: colors.textSecondary }]}>Restore Purchases</Text>
        </TouchableOpacity>

        {/* Terms */}
        <Text style={[styles.termsText, { color: colors.textMuted }]}>Subscriptions auto-renew unless cancelled 24 hours before the end of the period.</Text>

        {/* Dev toggle */}
        <TouchableOpacity style={[styles.devToggle, { backgroundColor: colors.card }]} onPress={toggleMockPremium}>
          <Text style={[styles.devToggleText, { color: colors.textMuted }]}>[DEV] Tap to toggle • {isPremium ? "Premium" : "Free"}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  closeButton: {
    position: "absolute",
    top: 50,
    right: 24,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  closeButtonText: {
    ...typography.callout,
    fontWeight: "600",
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
    marginTop: 20,
  },
  title: {
    ...typography.largeTitle,
  },
  subtitle: {
    ...typography.callout,
    marginTop: 8,
  },
  featuresContainer: {
    borderRadius: 12,
    marginBottom: 32,
    borderWidth: 1,
    overflow: "hidden",
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    ...typography.headline,
    marginBottom: 2,
  },
  featureDescription: {
    ...typography.footnote,
  },
  productsContainer: {
    marginBottom: 24,
  },
  productsTitle: {
    ...typography.headline,
    marginBottom: 16,
    textAlign: "center",
  },
  productCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    padding: 20,
    marginBottom: 12,
    borderWidth: 2,
    position: "relative",
    overflow: "hidden",
  },
  saveBadge: {
    position: "absolute",
    top: -1,
    right: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
  },
  saveBadgeText: {
    ...typography.caption2,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  productInfo: {
    flex: 1,
  },
  productTitle: {
    ...typography.headline,
  },
  productPrice: {
    ...typography.numericSmall,
    fontWeight: "200",
    marginTop: 4,
  },
  productPeriod: {
    ...typography.footnote,
    marginTop: 2,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  purchaseButton: {
    borderRadius: 12,
    paddingVertical: 18,
    alignItems: "center",
    marginBottom: 12,
  },
  purchaseButtonText: {
    ...typography.headline,
    fontWeight: "700",
  },
  restoreButton: {
    paddingVertical: 14,
    alignItems: "center",
  },
  restoreButtonText: {
    ...typography.subheadline,
    fontWeight: "500",
  },
  termsText: {
    ...typography.caption2,
    textAlign: "center",
    marginTop: 16,
    lineHeight: 16,
  },
  devToggle: {
    marginTop: 24,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  devToggleText: {
    ...typography.caption1,
  },
});
