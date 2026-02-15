import { Platform } from 'react-native';
import Purchases, {
    CustomerInfo,
    PurchasesOffering,
    PurchasesPackage
} from 'react-native-purchases';

// ⚠️ REMPLACE PAR TA CLÉ API REVENUECAT
const REVENUECAT_API_KEY = 'appl_CkiwoHiYWvnxxCkfrwdRiKtNUlG';

let isInitialized = false;

// Initialiser RevenueCat
export const initRevenueCat = async () => {
  // Ne pas initialiser sur web
  if (Platform.OS === 'web') {
    console.log('⚠️ RevenueCat non supporté sur web');
    return;
  }

  // Éviter les doubles initialisations
  if (isInitialized) {
    console.log('⚠️ RevenueCat déjà initialisé');
    return;
  }

  try {
    // Vérifier que Purchases est disponible
    if (!Purchases || typeof Purchases.configure !== 'function') {
      console.error('❌ Module RevenueCat non disponible');
      return;
    }

    Purchases.setLogLevel(Purchases.LOG_LEVEL.DEBUG);
    await Purchases.configure({ apiKey: REVENUECAT_API_KEY });
    isInitialized = true;
    console.log('✅ RevenueCat initialisé avec succès');
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation de RevenueCat:', error);
  }
};

// Récupérer les offres disponibles
export const getOfferings = async (): Promise<PurchasesOffering | null> => {
  if (!isInitialized || Platform.OS === 'web') {
    console.warn('⚠️ RevenueCat non initialisé ou plateforme non supportée');
    return null;
  }

  try {
    const offerings = await Purchases.getOfferings();
    if (offerings.current !== null) {
      console.log('✅ Offerings récupérés:', offerings.current);
      return offerings.current;
    }
    return null;
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des offerings:', error);
    return null;
  }
};

// Acheter un package
export const purchasePackage = async (
  packageToPurchase: PurchasesPackage
): Promise<CustomerInfo | null> => {
  try {
    const { customerInfo } = await Purchases.purchasePackage(packageToPurchase);
    console.log('✅ Achat réussi:', customerInfo);
    return customerInfo;
  } catch (error: any) {
    if (!error.userCancelled) {
      console.error('❌ Erreur lors de l\'achat:', error);
    } else {
      console.log('ℹ️ Achat annulé par l\'utilisateur');
    }
    return null;
  }
};

// Restaurer les achats
export const restorePurchases = async (): Promise<CustomerInfo | null> => {
  try {
    const customerInfo = await Purchases.restorePurchases();
    console.log('✅ Achats restaurés:', customerInfo);
    return customerInfo;
  } catch (error) {
    console.error('❌ Erreur lors de la restauration:', error);
    return null;
  }
};

// Vérifier si l'utilisateur a un abonnement actif
export const checkSubscriptionStatus = async (): Promise<boolean> => {
  try {
    const customerInfo = await Purchases.getCustomerInfo();
    const isPremium = customerInfo.entitlements.active['premium'] !== undefined;
    console.log('ℹ️ Statut premium:', isPremium);
    return isPremium;
  } catch (error) {
    console.error('❌ Erreur lors de la vérification du statut:', error);
    return false;
  }
};