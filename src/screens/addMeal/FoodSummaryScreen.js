import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Alert, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Colors from '../../constants/Colors';

import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";

export default function FoodSummaryScreen({ route, navigation }) {
  const { finalProduct, mealType } = route.params || {};
  
  // On récupère les flags pour savoir d'où vient l'aliment
  const isAiMeal = finalProduct?.isAiMeal;
  const isComplexMeal = finalProduct?.isComplexMeal; // <--- NOUVEAU FLAG

  const addMealMutation = useMutation(api.meals.add);
  const addToFavorites = useMutation(api.favorites.add);
  const [isFavorite, setIsFavorite] = useState(false);

  const handleAdd = async () => {
    const today = new Date().toISOString().split('T')[0];
    
    // Gestion des ingrédients (IA ou Complexe ou Simple)
    let ingredientsList = [];
    if (finalProduct.ingredients && finalProduct.ingredients.length > 0) {
        ingredientsList = finalProduct.ingredients;
    } else {
        ingredientsList = [{
            name: finalProduct.name,
            quantityLabel: finalProduct.quantityLabel,
            calories: finalProduct.finalCalories,
            proteins: finalProduct.finalProteins,
            carbs: finalProduct.finalCarbs,
            fats: finalProduct.finalFats,
        }];
    }

    try {
      await addMealMutation({
          name: finalProduct?.name || 'Aliment',
          calories: finalProduct?.finalCalories || 0,
          proteins: finalProduct?.finalProteins || 0,
          carbs: finalProduct?.finalCarbs || 0,
          fats: finalProduct?.finalFats || 0,
          type: mealType,
          date: today,
          ingredients: ingredientsList
      });
      navigation.popToTop(); 
    } catch (err) {
      console.error(err);
      Alert.alert("Erreur", "Impossible d'ajouter le repas.");
    }
  };

  const handleFavorite = async () => {
    if (isFavorite) return;
    try {
      setIsFavorite(true);
      await addToFavorites({
          name: finalProduct?.name || 'Aliment',
          calories: finalProduct?.finalCalories || 0, 
          proteins: finalProduct?.finalProteins || 0,
          carbs: finalProduct?.finalCarbs || 0,
          fats: finalProduct?.finalFats || 0,
          originalData: finalProduct
      });
    } catch (err) { console.error(err); setIsFavorite(false); }
  };

  return (
    <SafeAreaView style={styles.container}>
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Résumé</Text>
        <View style={{width: 40}} /> 
      </View>

      <View style={styles.content}>
        
        <View style={styles.summaryCard}>
          <Text style={styles.name}>{finalProduct?.name || 'Aliment'}</Text>
          <Text style={styles.qty}>Quantité : {finalProduct?.quantityLabel || ''}</Text>
          <View style={styles.divider} />
          <View style={styles.macroRow}>
             <MacroItem label="Calories" value={finalProduct?.finalCalories || 0} unit="kcal" color="#F59E0B" />
             <MacroItem label="Protéines" value={finalProduct?.finalProteins || 0} unit="g" color="#EF4444" />
             <MacroItem label="Glucides" value={finalProduct?.finalCarbs || 0} unit="g" color="#3B82F6" />
             <MacroItem label="Lipides" value={finalProduct?.finalFats || 0} unit="g" color="#8B5CF6" />
          </View>
        </View>

        <TouchableOpacity style={styles.addButton} onPress={handleAdd}>
          <Text style={styles.btnText}>Ajouter au repas</Text>
        </TouchableOpacity>
        
        {/* MODIF : ON AFFICHE LE COEUR SEULEMENT SI C'EST UN ALIMENT SIMPLE */}
        {/* Ni IA, Ni Repas Complexe */}
        {!isAiMeal && !isComplexMeal && (
            <TouchableOpacity style={styles.favButton} onPress={handleFavorite}>
                <Ionicons name={isFavorite ? "heart" : "heart-outline"} size={24} color={isFavorite ? "#EC4899" : Colors.primary} />
                <Text style={[styles.favText, isFavorite && {color: "#EC4899"}]}>
                    {isFavorite ? "Dans les favoris" : "Ajouter aux favoris"}
                </Text>
            </TouchableOpacity>
        )}

      </View>
    </SafeAreaView>
  );
}

const MacroItem = ({ label, value, unit, color }) => (
  <View style={{alignItems: 'center'}}>
    <Text style={{fontSize: 18, fontWeight: 'bold', color: color}}>{Math.round(value)}{unit}</Text>
    <Text style={{fontSize: 12, color: Colors.textLight}}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, alignItems: 'center' },
  backBtn: { padding: 5 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: Colors.text },
  content: { padding: 30, alignItems: 'center', flex: 1 },
  summaryCard: { backgroundColor: 'white', width: '100%', padding: 25, borderRadius: 20, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 5, marginTop: 20 },
  name: { fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginBottom: 5 },
  qty: { fontSize: 16, color: Colors.textLight, marginBottom: 20 },
  divider: { width: '100%', height: 1, backgroundColor: '#E5E7EB', marginBottom: 20 },
  macroRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%' },
  addButton: { backgroundColor: Colors.primary, width: '100%', padding: 18, borderRadius: 16, alignItems: 'center', marginTop: 40 },
  btnText: { color: 'white', fontWeight: 'bold', fontSize: 18 },
  favButton: { flexDirection: 'row', marginTop: 25, alignItems: 'center', padding: 10 },
  favText: { color: Colors.primary, marginLeft: 8, fontWeight: '600', fontSize: 16 }
});