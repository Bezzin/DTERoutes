/**
 * Paywall Screen
 * ================
 * Premium paywall with full-screen Josh background and DTE branding.
 */

import React, {useState, useCallback, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Alert,
  ActivityIndicator,
  ScrollView,
  ImageBackground,
  Image,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Svg, {Path, Circle} from 'react-native-svg';
import LinearGradient from 'react-native-linear-gradient';
import Animated, {FadeInRight, FadeIn} from 'react-native-reanimated';
import Purchases, {PurchasesPackage} from 'react-native-purchases';
import {useSubscriptionStore} from '../store/useSubscriptionStore';
import {Colors, Typography, Spacing, BorderRadius, Gradients} from '../theme';

const {width, height} = Dimensions.get('window');
const joshImage = require('../assets/JTDI.png');
const dteLogo = require('../assets/DTE Final Logo.png');

// Close icon
function CloseIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 6L6 18M6 6L18 18"
        stroke={Colors.text}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// Checkmark icon for benefits
function CheckCircleIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Circle
        cx={12}
        cy={12}
        r={10}
        fill={Colors.primaryAccent}
        stroke={Colors.primaryAccent}
        strokeWidth={2}
      />
      <Path
        d="M9 12L11 14L15 10"
        stroke={Colors.textOnAccent}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// Animated check icon for staggered entrance
function AnimatedBenefit({
  text,
  index,
}: {
  text: string;
  index: number;
}) {
  return (
    <Animated.View
      entering={FadeInRight.delay(200 + index * 100).duration(400)}
      style={styles.benefitRow}>
      <CheckCircleIcon />
      <Text style={styles.benefitText}>{text}</Text>
    </Animated.View>
  );
}

// Main Paywall Screen
export default function PaywallScreen({navigation}: any) {
  const [selectedPlan, setSelectedPlan] = useState<'lifetime' | 'monthly'>('lifetime');
  const [isLoading, setIsLoading] = useState(false);
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [lifetimePrice, setLifetimePrice] = useState<string>('\u00a344.99');
  const [monthlyPrice, setMonthlyPrice] = useState<string>('\u00a312.99');
  const [lifetimePriceNum, setLifetimePriceNum] = useState<number>(44.99);
  const [monthlyPriceNum, setMonthlyPriceNum] = useState<number>(12.99);
  const {checkSubscription} = useSubscriptionStore();

  // Load available packages and prices
  useEffect(() => {
    const loadPackages = async () => {
      try {
        const offerings = await Purchases.getOfferings();
        if (offerings.current) {
          const availablePackages = offerings.current.availablePackages;
          setPackages(availablePackages);

          // Extract price from lifetime package
          const lifetimePkg = availablePackages.find(pkg =>
            pkg.identifier.toLowerCase().includes('lifetime') ||
            pkg.identifier.toLowerCase().includes('life') ||
            pkg.identifier.toLowerCase().includes('annual') ||
            pkg.identifier.toLowerCase().includes('year') ||
            pkg.identifier === '$rc_lifetime',
          );

          if (lifetimePkg?.product?.priceString) {
            setLifetimePrice(lifetimePkg.product.priceString);
            if (lifetimePkg.product.price) {
              setLifetimePriceNum(lifetimePkg.product.price);
            }
          }

          // Extract monthly price
          const monthlyPkg = availablePackages.find(pkg =>
            pkg.identifier.toLowerCase().includes('month') ||
            pkg.identifier === '$rc_monthly',
          );

          if (monthlyPkg?.product?.priceString) {
            setMonthlyPrice(monthlyPkg.product.priceString);
            if (monthlyPkg.product.price) {
              setMonthlyPriceNum(monthlyPkg.product.price);
            }
          }
        }
      } catch (error) {
        console.error('Failed to load packages:', error);
      }
    };
    loadPackages();
  }, []);

  // Handle purchase
  const handlePurchase = useCallback(async () => {
    setIsLoading(true);
    try {
      let selectedPackage: PurchasesPackage | null = null;

      if (packages.length > 0) {
        if (selectedPlan === 'lifetime') {
          selectedPackage =
            packages.find(pkg =>
              pkg.identifier.toLowerCase().includes('lifetime') ||
              pkg.identifier.toLowerCase().includes('life') ||
              pkg.identifier.toLowerCase().includes('annual') ||
              pkg.identifier.toLowerCase().includes('year') ||
              pkg.identifier === '$rc_lifetime',
            ) || packages[0];
        } else {
          selectedPackage =
            packages.find(pkg =>
              pkg.identifier.toLowerCase().includes('month') ||
              pkg.identifier === '$rc_monthly',
            ) || packages[0];
        }
      }

      if (!selectedPackage) {
        const offerings = await Purchases.getOfferings();
        if (offerings.current && offerings.current.availablePackages.length > 0) {
          selectedPackage = offerings.current.availablePackages[0];
        } else {
          throw new Error('No packages available');
        }
      }

      const purchaseResult = await Purchases.purchasePackage(selectedPackage);

      if (purchaseResult.customerInfo.entitlements.active['Test Routes Expert Unlimited']) {
        await checkSubscription();
        Alert.alert(
          'Welcome to Premium!',
          'You now have access to all routes.',
          [{text: 'OK', onPress: () => navigation.goBack()}],
        );
      }
    } catch (error: any) {
      if (!error.userCancelled) {
        Alert.alert(
          'Purchase Failed',
          'Unable to complete purchase. Please try again.',
        );
      }
    } finally {
      setIsLoading(false);
    }
  }, [selectedPlan, packages, checkSubscription, navigation]);

  const handleRestore = useCallback(async () => {
    setIsLoading(true);
    try {
      const restored = await Purchases.restorePurchases();
      if (restored.entitlements.active['Test Routes Expert Unlimited']) {
        await checkSubscription();
        Alert.alert(
          'Restored',
          'Your premium access has been restored.',
          [{text: 'OK', onPress: () => navigation.goBack()}],
        );
      } else {
        Alert.alert('No Purchase Found', 'We could not find an active purchase.');
      }
    } catch (error: any) {
      Alert.alert(
        'Restore Failed',
        'Unable to restore purchases right now. Please try again.',
      );
    } finally {
      setIsLoading(false);
    }
  }, [checkSubscription, navigation]);

  const handleClose = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const benefits = [
    '500+ Verified Test Routes',
    'Turn-by-Turn GPS Navigation',
  ];

  const isLifetime = selectedPlan === 'lifetime';
  const displayPrice = isLifetime ? lifetimePrice : monthlyPrice;
  const displayPeriod = isLifetime ? 'Lifetime access' : 'Per month';
  const displaySubcopy = isLifetime
    ? 'One-time payment. Yours forever.'
    : 'Billed monthly. Cancel anytime.';

  // Discount calculation: lifetime vs 12x monthly
  const annualEquivalent = monthlyPriceNum * 12;
  const discountPercent = annualEquivalent > 0
    ? Math.round(((annualEquivalent - lifetimePriceNum) / annualEquivalent) * 100)
    : 0;

  return (
    <ImageBackground
      source={joshImage}
      style={styles.backgroundImage}
      imageStyle={styles.backgroundImageStyle}>
      <LinearGradient
        colors={[
          'rgba(0,0,0,0.1)',
          'rgba(0,0,0,0.4)',
          'rgba(0,0,0,0.75)',
          'rgba(18,18,18,0.95)',
          '#121212',
        ]}
        locations={[0, 0.3, 0.5, 0.7, 0.85]}
        style={styles.gradientOverlay}>
        <SafeAreaView style={styles.container}>
          {/* Header with close button */}
          <View style={styles.header}>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <CloseIcon />
            </TouchableOpacity>
          </View>

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}>
            {/* Logo */}
            <Animated.View entering={FadeIn.duration(600)} style={styles.logoContainer}>
              <Image source={dteLogo} style={styles.logo} resizeMode="contain" />
            </Animated.View>

            {/* Hero Text */}
            <Animated.View entering={FadeIn.delay(100).duration(600)} style={styles.heroTextContainer}>
              <Text style={styles.heroTitlePrimary}>PASS YOUR TEST.</Text>
              <Text style={styles.heroTitleAccent}>FIRST TIME.</Text>
              <Text style={styles.subtitle}>
                Unlimited access to proven test routes.{'\n'}Stop failing and start driving.
              </Text>
            </Animated.View>

            {/* Benefits List */}
            <View style={styles.benefitsList}>
              {benefits.map((benefit, index) => (
                <AnimatedBenefit key={benefit} text={benefit} index={index} />
              ))}
            </View>

            {/* Bottom Panel */}
            <Animated.View entering={FadeIn.delay(500).duration(600)} style={styles.bottomPanel}>
              {/* Plan Toggle */}
              <View style={styles.planToggle}>
                <TouchableOpacity
                  style={[styles.toggleButton, isLifetime && styles.toggleButtonActive]}
                  onPress={() => setSelectedPlan('lifetime')}
                  activeOpacity={0.85}>
                  <Text style={[styles.toggleText, isLifetime && styles.toggleTextActive]}>
                    Lifetime (Best)
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.toggleButton, !isLifetime && styles.toggleButtonActive]}
                  onPress={() => setSelectedPlan('monthly')}
                  activeOpacity={0.85}>
                  <Text style={[styles.toggleText, !isLifetime && styles.toggleTextActive]}>
                    Monthly
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Price Card */}
              <View style={styles.priceCard}>
                {isLifetime && (
                  <View style={styles.bestValueBadge}>
                    <Text style={styles.bestValueText}>LAUNCH OFFER</Text>
                  </View>
                )}
                <Text style={styles.priceValue}>{displayPrice}</Text>
                <Text style={styles.pricePeriod}>{displayPeriod}</Text>
                {isLifetime && discountPercent > 0 && (
                  <Text style={styles.savingsText}>
                    Save {discountPercent}% vs monthly
                  </Text>
                )}
                <Text style={styles.priceSubcopy}>{displaySubcopy}</Text>
              </View>

              {/* CTA Button */}
              <TouchableOpacity
                onPress={handlePurchase}
                disabled={isLoading}
                activeOpacity={0.8}
                style={styles.ctaButton}>
                <LinearGradient
                  colors={Gradients.orangeButton}
                  style={styles.ctaButtonGradient}>
                  {isLoading ? (
                    <ActivityIndicator color={Colors.textOnAccent} />
                  ) : (
                    <Text style={styles.ctaButtonText}>
                      {isLifetime ? 'UNLOCK LIFETIME ACCESS' : 'START MONTHLY ACCESS'}
                    </Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              {/* Restore Button */}
              <TouchableOpacity
                onPress={handleRestore}
                disabled={isLoading}
                style={styles.restoreButton}>
                <Text style={styles.restoreText}>Restore Purchase</Text>
              </TouchableOpacity>

              {/* Disclaimer */}
              <Text style={styles.disclaimerText}>
                {isLifetime
                  ? 'One-time purchase. No recurring charges. Terms apply.'
                  : 'Subscription auto-renews monthly until cancelled. Manage or cancel anytime in Google Play subscriptions. Terms apply.'}
              </Text>
            </Animated.View>
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  backgroundImageStyle: {
    resizeMode: 'cover',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  gradientOverlay: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  closeButton: {
    padding: Spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: BorderRadius.round,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  logo: {
    width: 220,
    height: 50,
  },
  heroTextContainer: {
    paddingHorizontal: Spacing.xl,
    marginTop: Spacing.xl,
    alignItems: 'center',
  },
  heroTitlePrimary: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: 1,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: {width: 0, height: 2},
    textShadowRadius: 4,
  },
  heroTitleAccent: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.primaryAccent,
    letterSpacing: 1,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: {width: 0, height: 2},
    textShadowRadius: 4,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.sm,
    lineHeight: 22,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: {width: 0, height: 1},
    textShadowRadius: 3,
  },
  benefitsList: {
    paddingHorizontal: Spacing.xl,
    marginTop: Spacing.xl,
    gap: Spacing.md,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  benefitText: {
    ...Typography.body,
    color: Colors.text,
    flex: 1,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: {width: 0, height: 1},
    textShadowRadius: 3,
  },
  bottomPanel: {
    marginTop: Spacing.xl,
    marginHorizontal: Spacing.lg,
    padding: Spacing.lg,
    backgroundColor: 'rgba(30, 30, 30, 0.85)',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    gap: Spacing.md,
  },
  planToggle: {
    flexDirection: 'row',
    backgroundColor: Colors.backgroundTertiary,
    borderRadius: BorderRadius.md,
    padding: Spacing.xs,
    gap: Spacing.xs,
  },
  toggleButton: {
    flex: 1,
    borderRadius: BorderRadius.sm,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  toggleButtonActive: {
    backgroundColor: Colors.primaryAccent,
  },
  toggleText: {
    ...Typography.bodySecondary,
    color: Colors.textSecondary,
    fontWeight: '700',
  },
  toggleTextActive: {
    color: Colors.textOnAccent,
  },
  priceCard: {
    borderWidth: 1.5,
    borderColor: Colors.primaryAccent,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    backgroundColor: 'rgba(18, 18, 18, 0.9)',
    position: 'relative',
  },
  bestValueBadge: {
    position: 'absolute',
    top: -12,
    backgroundColor: Colors.primaryAccent,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  bestValueText: {
    ...Typography.caption,
    color: Colors.textOnAccent,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  priceValue: {
    fontSize: 44,
    fontWeight: '800',
    color: Colors.text,
    marginTop: Spacing.xs,
  },
  pricePeriod: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  savingsText: {
    ...Typography.caption,
    color: Colors.success,
    fontWeight: '700',
    marginTop: Spacing.xs,
  },
  priceSubcopy: {
    ...Typography.caption,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
  },
  ctaButton: {
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    shadowColor: Colors.primaryAccent,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  ctaButtonGradient: {
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaButtonText: {
    ...Typography.button,
    color: Colors.textOnAccent,
    fontWeight: '800',
    letterSpacing: 1,
    fontSize: 15,
  },
  restoreButton: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  restoreText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    textDecorationLine: 'underline',
  },
  disclaimerText: {
    ...Typography.caption,
    textAlign: 'center',
    color: Colors.textMuted,
  },
});
