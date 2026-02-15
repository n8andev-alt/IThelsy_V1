import { useAuth } from "@clerk/clerk-expo";
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useMutation, useQuery } from "convex/react";
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Purchases from 'react-native-purchases';
import { api } from "../../convex/_generated/api";
import Colors from '../constants/Colors';

export default function PaywallScreen() {
  const navigation = useNavigation();
  const [selectedPlan, setSelectedPlan] = useState('yearly');
  const [loading, setLoading] = useState(false);
  const [loadingOfferings, setLoadingOfferings] = useState(true);
  const [packages, setPackages] = useState([]);
  const [isDevMode, setIsDevMode] = useState(false);

  const userData = useQuery(api.users.checkUser);
  const updateUser = useMutation(api.users.updateUserData);
  const { signOut } = useAuth();

  useEffect(() => {
    const timer = setTimeout(() => {
      loadOfferings();
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  // 🔥 HELPER : Navigation safe (évite l'erreur GO_BACK)
  const handleNavigateBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.reset({
        index: 0,
        routes: [{ name: 'NutritionScreen' }],
      });
    }
  };

  const loadOfferings = async () => {
    if (Platform.OS === 'web') {
      setLoadingOfferings(false);
      return;
    }

    try {
      setLoadingOfferings(true);

      if (!Purchases || typeof Purchases.getOfferings !== 'function') {
        setLoadingOfferings(false);
        return;
      }

      const offerings = await Purchases.getOfferings();
      
      if (offerings?.current?.availablePackages?.length > 0) {
        console.log('✅ Offerings chargés');
        setPackages(offerings.current.availablePackages);
        setIsDevMode(false);
      } else {
        console.warn('⚠️ Aucun offering - Mode DEV');
        setIsDevMode(true);
        const mockPackages = [
          { identifier: '$rc_annual', product: { priceString: '44,99 €', price: 44.99 } },
          { identifier: '$rc_monthly', product: { priceString: '4,99 €', price: 4.99 } }
        ];
        setPackages(mockPackages);
      }
      
    } catch (error) {
      console.log('⚠️ Erreur RevenueCat - Mode DEV');
      setIsDevMode(true);
      const mockPackages = [
        { identifier: '$rc_annual', product: { priceString: '44,99 €', price: 44.99 } },
        { identifier: '$rc_monthly', product: { priceString: '4,99 €', price: 4.99 } }
      ];
      setPackages(mockPackages);
    } finally {
      setLoadingOfferings(false);
    }
  };

  const handlePurchase = async () => {
    if (isDevMode) {
      Alert.alert(
        'Mode Développement',
        'Les achats ne fonctionnent qu\'en production. Activer le premium pour tester ?',
        [
          { text: 'Annuler', style: 'cancel' },
          { 
            text: 'Activer Premium', 
            onPress: async () => {
              try {
                setLoading(true);
                if (userData) {
                  await updateUser({ id: userData._id, isPremium: true });
                  Alert.alert('✅ Premium activé !', 'Profite de toutes les fonctionnalités.', [
                    { text: 'OK', onPress: handleNavigateBack }
                  ]);
                }
              } catch (error) {
                Alert.alert('Erreur', 'Impossible d\'activer le premium');
              } finally {
                setLoading(false);
              }
            }
          }
        ]
      );
      return;
    }

    try {
      setLoading(true);

      const packageToPurchase = packages.find(pkg => 
        selectedPlan === 'yearly' 
          ? pkg.identifier === '$rc_annual' 
          : pkg.identifier === '$rc_monthly'
      );

      if (!packageToPurchase) {
        Alert.alert('Erreur', 'Package non trouvé');
        setLoading(false);
        return;
      }

      const { customerInfo } = await Purchases.purchasePackage(packageToPurchase);

      if (customerInfo.entitlements.active['premium']) {
        if (userData) {
          await updateUser({ id: userData._id, isPremium: true });
          Alert.alert("Bienvenue dans le club Premium ! 🎉", "Ton abonnement est actif.", [{
            text: "C'est parti !", 
            onPress: handleNavigateBack
          }]);
        }
      } else {
        Alert.alert('Erreur', 'L\'abonnement n\'a pas pu être activé.');
      }

    } catch (error) {
      if (!error.userCancelled) {
        Alert.alert('Erreur', 'Une erreur est survenue lors de l\'achat.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async () => {
    if (isDevMode) {
      Alert.alert('Mode Développement', 'La restauration ne fonctionne qu\'en production.', [{ text: 'OK' }]);
      return;
    }

    try {
      setLoading(true);
      const customerInfo = await Purchases.restorePurchases();

      if (customerInfo.entitlements.active['premium']) {
        if (userData) {
          await updateUser({ id: userData._id, isPremium: true });
          Alert.alert('✅ Restauration réussie', 'Ton abonnement a été restauré !', [{
            text: "OK", 
            onPress: handleNavigateBack
          }]);
        }
      } else {
        Alert.alert('ℹ️ Aucun abonnement', 'Aucun abonnement actif trouvé.');
      }

    } catch (error) {
      Alert.alert('Erreur', 'Impossible de restaurer les achats.');
    } finally {
      setLoading(false);
    }
  };

  const yearlyPackage = packages.find(pkg => pkg.identifier === '$rc_annual');
  const monthlyPackage = packages.find(pkg => pkg.identifier === '$rc_monthly');

  const yearlyPrice = yearlyPackage?.product?.priceString || '44,99 €';
  const monthlyPrice = monthlyPackage?.product?.priceString || '4,99 €';

  // 🔥 FIX : Gestion sécurisée du calcul
  const calculateMonthlyPrice = (price) => {
    if (!price || isNaN(price)) return '3,75 €';
    try {
      return `${String((price / 12).toFixed(2)).replace('.', ',')} €`;
    } catch (e) {
      return '3,75 €';
    }
  };

  const yearlyMonthlyPrice = calculateMonthlyPrice(yearlyPackage?.product?.price);

  if (loadingOfferings) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={{ marginTop: 16, color: Colors.textLight }}>
            Chargement des offres...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        
        {/* HEADER */}
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => signOut()}>
            <Text style={styles.closeText}>Se déconnecter</Text>
          </TouchableOpacity>
        </View>

        {/* ICÔNE + TITRE */}
        <View style={styles.topSection}>
          <MaterialCommunityIcons name="crown" size={70} color="#F59E0B" />
          <Text style={styles.title}>Deviens Premium</Text>
          <Text style={styles.subtitle}>Débloquez toutes les fonctionnalités pour atteindre vos objectifs</Text>
        </View>

        {/* FEATURES */}
        <View style={styles.features}>
            <FeatureItem text="Scans et photo IA illimités" />
            <FeatureItem text="Programmes personnalisés" />
            <FeatureItem text="Suivi des performances" />
            <FeatureItem text="Mode duo" />
        </View>

        {/* PLANS */}
        <View style={styles.plansContainer}>
          
          {yearlyPackage && (
            <TouchableOpacity
                style={[styles.planCard, selectedPlan === 'yearly' && styles.selectedPlan]}
                onPress={() => setSelectedPlan('yearly')}
                activeOpacity={0.9}
            >
                {selectedPlan === 'yearly' && (
                    <View style={styles.badgeContainer}><Text style={styles.badgeText}>Meilleure offre</Text></View>
                )}
                <View style={styles.planContent}>
                    <View>
                        <Text style={styles.planTitle}>Annuel</Text>
                        <Text style={styles.planSub}>Essai gratuit 7 jours</Text>
                    </View>
                    <View style={{alignItems:'flex-end'}}>
                        <Text style={styles.price}>
                          {yearlyMonthlyPrice} <Text style={styles.priceUnit}>/mois</Text>
                        </Text>
                        <Text style={styles.priceDetail}>Facturé {yearlyPrice}/an</Text>
                    </View>
                </View>
            </TouchableOpacity>
          )}

          {monthlyPackage && (
            <TouchableOpacity
                style={[styles.planCard, selectedPlan === 'monthly' && styles.selectedPlan]}
                onPress={() => setSelectedPlan('monthly')}
                activeOpacity={0.9}
            >
                {selectedPlan === 'monthly' && (
                    <View style={[styles.badgeContainer, {backgroundColor: Colors.secondary}]}>
                        <Text style={styles.badgeText}>Flexible</Text>
                    </View>
                )}
                <View style={styles.planContent}>
                    <View>
                        <Text style={styles.planTitle}>Mensuel</Text>
                        <Text style={styles.planSub}>Essai gratuit 7 jours</Text>
                    </View>
                    <View style={{alignItems:'flex-end'}}>
                        <Text style={styles.price}>
                          {monthlyPrice} <Text style={styles.priceUnit}>/mois</Text>
                        </Text>
                        <Text style={styles.priceDetail}>Facturé mensuellement</Text>
                    </View>
                </View>
            </TouchableOpacity>
          )}

        </View>

        <Text style={styles.disclaimer}>
            Aucun frais aujourd'hui. Annulez à tout moment.
        </Text>

      </View>

      {/* FOOTER */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.ctaButton} onPress={handlePurchase} disabled={loading}>
            {loading ? <ActivityIndicator color="white" /> : (
                <View style={{alignItems:'center'}}>
                    <Text style={styles.ctaText}>Commencer l'essai gratuit</Text>
                    {!isDevMode && (
                      <Text style={styles.ctaSubText}>
                          Puis {selectedPlan === 'yearly' ? yearlyPrice + '/an' : monthlyPrice + '/mois'}
                      </Text>
                    )}
                </View>
            )}
        </TouchableOpacity>
        <TouchableOpacity onPress={handleRestore} disabled={loading}>
             <Text style={styles.restoreText}>Restaurer mes achats</Text>
        </TouchableOpacity>
      </View>

    </SafeAreaView>
  );
}

const FeatureItem = ({ text }) => (
    <View style={styles.featureItem}>
        <Ionicons name="checkmark-circle" size={18} color={Colors.primary} style={{marginRight: 8}} />
        <Text style={styles.featureText}>{text}</Text>
    </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white' },
  content: { flex: 1, paddingHorizontal: 20, paddingTop: 10 },
  
  headerRow: { 
    flexDirection: 'row', 
    justifyContent: 'flex-end', 
    marginBottom: 10
  },
  closeText: { color: Colors.textLight, fontSize: 12 },
  
  topSection: { alignItems: 'center', marginBottom: 25 },
  title: { 
    fontSize: 24, 
    fontWeight: '900', 
    color: Colors.text, 
    marginTop: 8,
    marginBottom: 5
  },
  subtitle: { 
    fontSize: 14, 
    color: Colors.textLight, 
    textAlign: 'center',
    paddingHorizontal: 10,
    lineHeight: 19
  },
  
  features: { marginBottom: 25, paddingHorizontal: 5 },
  featureItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 10
  },
  featureText: { 
    fontSize: 14, 
    color: Colors.text, 
    fontWeight: '500'
  },

  plansContainer: { marginBottom: 15 },
  planCard: { 
    borderWidth: 2, 
    borderColor: '#F3F4F6', 
    borderRadius: 14, 
    padding: 18, 
    marginBottom: 12, 
    backgroundColor: 'white'
  },
  selectedPlan: { borderColor: Colors.primary, backgroundColor: '#F0FDF4' },
  badgeContainer: { 
    position: 'absolute', 
    top: -10, 
    left: 18, 
    backgroundColor: Colors.primary, 
    paddingHorizontal: 10, 
    paddingVertical: 4, 
    borderRadius: 10
  },
  badgeText: { color: 'white', fontSize: 10, fontWeight: 'bold' },
  planContent: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center'
  },
  planTitle: { fontSize: 17, fontWeight: 'bold', color: Colors.text },
  planSub: { color: Colors.textLight, fontSize: 12, marginTop: 20 },
  price: { fontSize: 19, fontWeight: '900', color: Colors.text },
  priceUnit: { fontSize: 13, fontWeight: 'normal' },
  priceDetail: { fontSize: 11, color: Colors.textLight, marginTop: 2 },
  
  disclaimer: { 
    fontSize: 11, 
    color: '#9CA3AF', 
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: 15
  },

  footer: { 
    padding: 20, 
    paddingBottom: 15,
    borderTopWidth: 1, 
    borderTopColor: '#F3F4F6' 
  },
  ctaButton: { 
    backgroundColor: Colors.primary, 
    paddingVertical: 14, 
    borderRadius: 30, 
    alignItems: 'center', 
    justifyContent: 'center',
    shadowColor: Colors.primary, 
    shadowOpacity: 0.4, 
    shadowRadius: 10, 
    elevation: 5,
    height: 60
  },
  ctaText: { color: 'white', fontWeight: 'bold', fontSize: 17 },
  ctaSubText: { 
    color: 'rgba(255,255,255,0.9)', 
    fontSize: 12, 
    marginTop: 2
  },
  restoreText: { 
    textAlign: 'center', 
    color: Colors.textLight, 
    marginTop: 14, 
    fontSize: 12
  }
});