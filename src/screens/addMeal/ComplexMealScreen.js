import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { useFocusEffect } from '@react-navigation/native';
import { useMutation } from "convex/react";
import { useCallback, useEffect, useState } from 'react';
import { Alert, Modal, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { api } from "../../../convex/_generated/api";
import Colors from '../../constants/Colors';
import { RecipeStore } from '../../data/RecipeStore';

export default function ComplexMealScreen({ route, navigation }) {
  const { mealType, prefilledRecipe } = route.params || {}; 
  const addMealMutation = useMutation(api.meals.add);
  
  // 🔒 SÉCURITÉ : On stocke le mealType dans le state pour ne jamais le perdre
  const [lockedMealType, setLockedMealType] = useState(mealType);

  const [name, setName] = useState("");
  const [ingredients, setIngredients] = useState([]);
  const [totalDish, setTotalDish] = useState({ cal: 0, p: 0, c: 0, f: 0 });
  const [portionPercent, setPortionPercent] = useState(100);
  
  const [showMealSelector, setShowMealSelector] = useState(false);

  // Mise à jour de sécurité si le param change
  useEffect(() => {
    if (mealType && !lockedMealType) {
        setLockedMealType(mealType);
    }
  }, [mealType]);

  // 1. Initialisation via recette
  useEffect(() => {
    if (prefilledRecipe) {
      setName(prefilledRecipe.title);
      RecipeStore.clear();
      RecipeStore.setDishName(prefilledRecipe.title); // 🔥 AJOUT : Sauvegarde le nom dans le Store
      prefilledRecipe.ingredients.forEach(ing => {
          RecipeStore.addIngredient({
            ...ing,
            finalCalories: ing.calories,
            finalProteins: ing.proteins,
            finalCarbs: ing.carbs,
            finalFats: ing.fats
          });
      });
      setIngredients(RecipeStore.getIngredients());
      navigation.setParams({ prefilledRecipe: null });
    }
  }, [prefilledRecipe]);

  // 2. Lecture Store (🔥 CORRIGÉ)
  useFocusEffect(
    useCallback(() => {
      const data = RecipeStore.getIngredients();
      setIngredients(data);
      
      // 🔥 CORRECTION : Ne réinitialise le nom QUE si on n'a pas déjà un nom
      if (!name || name === "") {
        const savedName = RecipeStore.getDishName();
        if (savedName) setName(savedName);
      }
    }, [name]) // 🔥 Dépendance ajoutée pour ne pas écraser
  );

  const handleNameChange = (text) => {
      setName(text);
      RecipeStore.setDishName(text);
  };

  useEffect(() => {
    let t = { cal: 0, p: 0, c: 0, f: 0 };
    ingredients.forEach(ing => {
      t.cal += ing.finalCalories || ing.calories || 0;
      t.p += ing.finalProteins || ing.proteins || 0;
      t.c += ing.finalCarbs || ing.carbs || 0;
      t.f += ing.finalFats || ing.fats || 0;
    });
    setTotalDish(t);
  }, [ingredients]);

  const removeIngredient = (index) => {
    RecipeStore.removeIngredient(index);
    setIngredients(RecipeStore.getIngredients());
  };

  const handleEditIngredient = (ingredient, index) => {
    navigation.navigate('FoodQuantity', { 
        product: ingredient, 
        mealType: lockedMealType,
        returnTo: 'ComplexMeal',
        editIndex: index 
    });
  };

  const handleAddIngredient = () => {
    navigation.navigate('SearchFood', { mealType: lockedMealType || 'Recette', returnTo: 'ComplexMeal' });
  };

  const handleValidateClick = () => {
    if (name.trim() === "") { Alert.alert("Oups", "Donne un nom à ton plat !"); return; }
    if (ingredients.length === 0) { Alert.alert("Vide", "Ajoute au moins un ingrédient."); return; }

    if (lockedMealType && lockedMealType !== 'Recette') {
        saveMeal(lockedMealType);
    } else {
        setShowMealSelector(true);
    }
  };

  const saveMeal = async (selectedType) => {
    const ratio = portionPercent / 100;
    const today = new Date().toISOString().split('T')[0];

    const userMeal = {
        name: name,
        calories: Math.round(totalDish.cal * ratio),
        proteins: Math.round(totalDish.p * ratio),
        carbs: Math.round(totalDish.c * ratio),
        fats: Math.round(totalDish.f * ratio),
        type: selectedType, 
        date: today,
        isComplexMeal: true,
        ingredients: ingredients.map(ing => ({
            name: ing.name,
            quantityLabel: ing.quantityLabel,
            calories: Math.round((ing.finalCalories || ing.calories) * ratio),
            proteins: Math.round((ing.finalProteins || ing.proteins) * ratio),
            carbs: Math.round((ing.finalCarbs || ing.carbs) * ratio),
            fats: Math.round((ing.finalFats || ing.fats) * ratio),
        }))
    };

    try {
        await addMealMutation(userMeal);
        RecipeStore.clear();
        setShowMealSelector(false);
        navigation.popToTop(); 
    } catch (err) {
        Alert.alert("Erreur", "Sauvegarde impossible");
        console.error(err);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>
            {lockedMealType && lockedMealType !== 'Recette' ? `Ajout au ${lockedMealType}` : "Plat Composé"}
        </Text>
        <View style={{width: 40}} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.label}>Nom du plat</Text>
        <TextInput style={styles.nameInput} placeholder="Ex: Gratin Familial" value={name} onChangeText={handleNameChange} />

        <View style={styles.rowBetween}>
            <Text style={styles.label}>Ingrédients ({ingredients.length})</Text>
        </View>

        {ingredients.map((ing, index) => (
            <TouchableOpacity 
                key={ing._localId || index} 
                style={styles.ingCard}
                onPress={() => handleEditIngredient(ing, index)}
            >
                <View style={{flex: 1}}>
                    <Text style={styles.ingName}>{ing.name}</Text>
                    <Text style={styles.ingQty}>{ing.quantityLabel} • {Math.round(ing.finalCalories || ing.calories)} kcal</Text>
                </View>
                <TouchableOpacity onPress={() => removeIngredient(index)} style={{padding: 5}}>
                    <Ionicons name="trash-outline" size={20} color="#EF4444" />
                </TouchableOpacity>
            </TouchableOpacity>
        ))}

        <TouchableOpacity style={styles.addIngButton} onPress={handleAddIngredient}>
            <Ionicons name="add" size={20} color={Colors.textLight} />
            <Text style={{color: Colors.textLight, marginLeft: 5}}>Ajouter un aliment</Text>
        </TouchableOpacity>

        <View style={styles.sliderContainer}>
            <View style={styles.rowBetween}>
                <Text style={styles.label}>Ma portion consommée</Text>
                <View style={styles.percentBadge}>
                    <Text style={styles.percentText}>{Math.round(portionPercent)}%</Text>
                </View>
            </View>
            <Slider
                style={{width: '100%', height: 40}}
                minimumValue={0} maximumValue={100} value={portionPercent} onValueChange={setPortionPercent}
                minimumTrackTintColor={Colors.primary} maximumTrackTintColor="#E5E7EB" thumbTintColor={Colors.primary}
            />
            <View style={styles.rowBetween}>
                <Text style={styles.sliderLabel}>0%</Text>
                <Text style={styles.sliderLabel}>50%</Text>
                <Text style={styles.sliderLabel}>100%</Text>
            </View>
        </View>

        <View style={styles.summaryBox}>
            <Text style={styles.summaryTitle}>Apport final :</Text>
            <Text style={styles.summaryValue}>{Math.round(totalDish.cal * (portionPercent/100))} kcal</Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.validateButton} onPress={handleValidateClick}>
            <Text style={styles.btnText}>Valider et Ajouter</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={showMealSelector} transparent animationType="fade">
        <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Pour quel repas ?</Text>
                {['Petit-déjeuner', 'Déjeuner', 'Collation', 'Dîner'].map((type) => (
                    <TouchableOpacity key={type} style={styles.modalBtn} onPress={() => saveMeal(type)}>
                        <Text style={styles.modalBtnText}>{type}</Text>
                        <Ionicons name="chevron-forward" size={20} color={Colors.textLight} />
                    </TouchableOpacity>
                ))}
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowMealSelector(false)}>
                    <Text style={{color: Colors.textLight}}>Annuler</Text>
                </TouchableOpacity>
            </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, alignItems: 'center' },
  backBtn: { padding: 5 },
  title: { fontSize: 18, fontWeight: 'bold', color: Colors.text },
  content: { padding: 20, paddingBottom: 100 },
  label: { fontSize: 14, fontWeight: '700', color: Colors.textLight, marginBottom: 8 },
  nameInput: { fontSize: 18, fontWeight: 'bold', color: Colors.text, backgroundColor: '#F9FAFB', padding: 15, borderRadius: 12, marginBottom: 25, borderWidth: 1, borderColor: '#F3F4F6' },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
  ingCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', padding: 12, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: '#F3F4F6' },
  ingName: { fontSize: 16, fontWeight: '600', color: Colors.text },
  ingQty: { fontSize: 13, color: Colors.textLight, marginTop: 2 },
  addIngButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 15, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', borderStyle: 'dashed', marginBottom: 30 },
  sliderContainer: { marginBottom: 30 },
  percentBadge: { backgroundColor: '#ECFDF5', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  percentText: { color: Colors.primary, fontWeight: 'bold' },
  sliderLabel: { fontSize: 12, color: Colors.textLight },
  summaryBox: { alignItems: 'center', backgroundColor: '#F9FAFB', padding: 15, borderRadius: 16 },
  summaryTitle: { color: Colors.textLight, marginBottom: 5 },
  summaryValue: { fontSize: 24, fontWeight: 'bold', color: Colors.text },
  footer: { padding: 20, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  validateButton: { backgroundColor: Colors.primary, padding: 18, borderRadius: 16, alignItems: 'center', shadowColor: Colors.primary, shadowOpacity: 0.3, shadowRadius: 5, elevation: 5 },
  btnText: { color: 'white', fontWeight: 'bold', fontSize: 18 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '80%', backgroundColor: 'white', borderRadius: 20, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
  modalBtn: { flexDirection: 'row', justifyContent: 'space-between', padding: 15, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  modalBtnText: { fontSize: 16, fontWeight: '600', color: Colors.text },
  cancelBtn: { marginTop: 15, alignItems: 'center', padding: 10 }
});