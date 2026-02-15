if (typeof window !== 'undefined' && !window.addEventListener) {
  window.addEventListener = () => {};
}
import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import * as WebBrowser from "expo-web-browser";
import { useEffect } from 'react';
import { Dimensions, Platform, SafeAreaView, Text, TouchableOpacity, View } from 'react-native';
import 'react-native-gesture-handler';

import Colors from './src/constants/Colors';

// ECRANS
import LoginScreen from './src/screens/LoginScreen';
import MealDetailsScreen from './src/screens/MealDetailsScreen';
import NutritionScreen from './src/screens/NutritionScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import RecipesScreen from './src/screens/RecipesScreen';

import ComplexMealScreen from './src/screens/addMeal/ComplexMealScreen';
import FavoritesScreen from './src/screens/addMeal/FavoritesScreen';
import FoodQuantityScreen from './src/screens/addMeal/FoodQuantityScreen';
import FoodSummaryScreen from './src/screens/addMeal/FoodSummaryScreen';
import MealEntryScreen from './src/screens/addMeal/MealEntryScreen';
import PhotoIngredientsScreen from './src/screens/addMeal/PhotoIngredientsScreen';
import PhotoMealScreen from './src/screens/addMeal/PhotoMealScreen';
import ScanFoodScreen from './src/screens/addMeal/ScanFoodScreen';
import SearchFoodScreen from './src/screens/addMeal/SearchFoodScreen';
import EditActivitiesScreen from './src/screens/EditActivitiesScreen';
import EditGoalsScreen from './src/screens/EditGoalsScreen';
import EditProfileInfoScreen from './src/screens/EditProfileInfoScreen';
import NutritionCalendarScreen from './src/screens/NutritionCalendarScreen';
import PaywallScreen from './src/screens/PaywallScreen';
import ProgressScreen from './src/screens/ProgressScreen';

import SelectRecipesScreen from './src/screens/shopping/SelectRecipesScreen';
import ShoppingListScreen from './src/screens/shopping/ShoppingListScreen';

import CreateRecipeFlow from './src/screens/recipes/CreateRecipeFlow';
import RecipeDetailsScreen from './src/screens/recipes/RecipeDetailsScreen';

import GymBroScreen from './src/screens/GymBroScreen';
import FAQScreen from './src/screens/legal/FAQScreen';
import PrivacyScreen from './src/screens/legal/PrivacyScreen';
import TermsScreen from './src/screens/legal/TermsScreen';
import SettingsScreen from './src/screens/SettingsScreen';

import { ClerkProvider, SignedIn, SignedOut, useAuth, useOAuth } from "@clerk/clerk-expo";
import { ConvexReactClient, useQuery } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import * as SecureStore from "expo-secure-store";
import { api } from "./convex/_generated/api";

// ==================== REVENUECAT ====================
import Purchases from 'react-native-purchases';

let isRevenueCatInitialized = false;

const initRevenueCat = async () => {
  if (Platform.OS === 'web') {
    console.log('⚠️ RevenueCat non supporté sur web');
    return;
  }

  if (isRevenueCatInitialized) {
    console.log('⚠️ RevenueCat déjà initialisé');
    return;
  }

  try {
    if (!Purchases || typeof Purchases.configure !== 'function') {
      console.error('❌ Module RevenueCat non disponible');
      return;
    }

    Purchases.setLogLevel(Purchases.LOG_LEVEL.DEBUG);
    
    const API_KEY = Platform.select({
      ios: process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY || 'appl_CkiwoHiYWvnxxCkfrwdRiKtNUlG',
      android: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY
    });

    Purchases.configure({ apiKey: API_KEY });
    
    isRevenueCatInitialized = true;
    console.log('✅ RevenueCat initialisé avec succès');
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation de RevenueCat:', error);
    console.error('Détails:', error.message, error.stack);
  }
};
// ====================================================

const { width, height } = Dimensions.get("window");

WebBrowser.maybeCompleteAuthSession();

const convex = new ConvexReactClient(process.env.EXPO_PUBLIC_CONVEX_URL, {
  unsavedChangesWarning: false,
});

const CLERK_KEY = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY || "pk_test_c291Z2h0LWpheWJpcmQtMTkuY2xlcmsuYWNjb3VudHMuZGV2JA";

const tokenCache = {
  async getToken(key) { try { return SecureStore.getItemAsync(key); } catch (err) { return null; } },
  async saveToken(key, value) { try { return SecureStore.setItemAsync(key, value); } catch (err) { return; } },
};

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: { 
          height: 75, paddingBottom: 10, paddingTop: 10,
          backgroundColor: 'white', 
          borderTopColor: '#E5E7EB' 
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Entraînement') iconName = focused ? 'fitness' : 'fitness-outline';
          else if (route.name === 'Nutrition') iconName = focused ? 'restaurant' : 'restaurant-outline';
          else if (route.name === 'Recettes') iconName = focused ? 'book' : 'book-outline';
          else if (route.name === 'Profil') iconName = focused ? 'person' : 'person-outline';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Nutrition" component={NutritionScreen} />
      <Tab.Screen name="Recettes" component={RecipesScreen} />
      <Tab.Screen name="Profil" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

function MainApp() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tabs" component={TabNavigator} />
      <Stack.Screen name="MealDetails" component={MealDetailsScreen} />
      <Stack.Screen name="Favorites" component={FavoritesScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="GymBro" component={GymBroScreen} />
      <Stack.Screen name="Privacy" component={PrivacyScreen} />
      <Stack.Screen name="EditProfileInfo" component={EditProfileInfoScreen} />
      <Stack.Screen name="EditGoals" component={EditGoalsScreen} />
      <Stack.Screen name="EditActivities" component={EditActivitiesScreen} />
      <Stack.Screen name="FAQ" component={FAQScreen} />
      <Stack.Screen name="Terms" component={TermsScreen} />
      <Stack.Screen name="Paywall" component={PaywallScreen} options={{ presentation: 'modal', gestureEnabled: false }} />
      <Stack.Screen name="Progress" component={ProgressScreen} />
      <Stack.Screen name="ShoppingList" component={ShoppingListScreen} />
      <Stack.Screen name="SelectRecipes" component={SelectRecipesScreen} />
      <Stack.Screen name="CreateRecipeFlow" component={CreateRecipeFlow} />
      <Stack.Screen name="RecipeDetails" component={RecipeDetailsScreen} />
      <Stack.Screen name="NutritionCalendar" component={NutritionCalendarScreen} />
      <Stack.Screen name="ComplexMeal" component={ComplexMealScreen} />
      <Stack.Screen name="SearchFood" component={SearchFoodScreen} />
      <Stack.Screen name="FoodQuantity" component={FoodQuantityScreen} />
      <Stack.Group options={{ presentation: 'modal' }}>
        <Stack.Screen name="MealEntry" component={MealEntryScreen} />
        <Stack.Screen name="FoodSummary" component={FoodSummaryScreen} />
        <Stack.Screen name="ScanFood" component={ScanFoodScreen} />
        <Stack.Screen name="PhotoMeal" component={PhotoMealScreen} />
        <Stack.Screen name="PhotoIngredientsScreen" component={PhotoIngredientsScreen} />
      </Stack.Group>
    </Stack.Navigator>
  );
}

function AuthCheck() {
  const userData = useQuery(api.users.checkUser);

  if (userData === undefined) return <View style={{flex:1, justifyContent:'center', alignItems:'center', backgroundColor:'white'}}><Text style={{color: 'gray'}}>Chargement...</Text></View>;
  if (userData === null) return <OnboardingScreen />;
  if (!userData.isPremium) {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Paywall" component={PaywallScreen} options={{ gestureEnabled: false }} />
        <Stack.Screen name="GymBro" component={GymBroScreen} />
      </Stack.Navigator>
    );
  }
  
  return <MainApp />;
}

const FeatureRow = ({ icon, title, subtitle, color }) => (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}> 
        <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: color + '15', justifyContent: 'center', alignItems: 'center', marginRight: 15 }}>
            <Ionicons name={icon} size={22} color={color} />
        </View>
        <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 15, fontWeight: 'bold', color: '#1F2937', marginBottom: 2 }}>{title}</Text>
            <Text style={{ fontSize: 13, color: '#6B7280' }}>{subtitle}</Text>
        </View>
    </View>
);

export default function App() {
  useEffect(() => {
    const timer = setTimeout(() => {
      initRevenueCat();
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <ClerkProvider publishableKey={CLERK_KEY} tokenCache={tokenCache}>
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        <NavigationContainer>
          <StatusBar style="dark" /> 
          <SignedIn><AuthCheck /></SignedIn>
          <SignedOut><LoginScreen /></SignedOut>
        </NavigationContainer>
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}