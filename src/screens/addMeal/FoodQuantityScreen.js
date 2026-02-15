import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Colors from '../../constants/Colors';
import { RecipeStore } from '../../data/RecipeStore';

export default function FoodQuantityScreen({ route, navigation }) {
  // On récupère toutes les infos, y compris mealType
  const { product, mealType, forcePercentMode, returnTo, editIndex } = route.params;

  const [mode, setMode] = useState(forcePercentMode ? 'percent' : 'percent');
  
  const [percent, setPercent] = useState(100);
  const [fraction, setFraction] = useState({ num: '1', den: '1' });
  const [qtyValue, setQtyValue] = useState(''); // Vide au début pour forcer la saisie
  const [selectedUnit, setSelectedUnit] = useState('g');

  const UNITS = [
    { label: 'g', weight: 1 },
    { label: 'ml', weight: 1 },
    { label: 'pièce(s)', weight: null },
    { label: 'c.à.s', weight: 15 },
    { label: 'c.à.c', weight: 5 },
  ];

  const handleContinue = () => {
    let factor = 1;
    let label = "";

    // 1. Calcul du facteur
    if (mode === 'percent') {
        factor = percent / 100;
        label = `${Math.round(percent)}%`;
    } 
    else if (mode === 'portion') {
        const n = parseFloat(fraction.num) || 0;
        const d = parseFloat(fraction.den) || 1;
        factor = n / d;
        label = `${fraction.num}/${fraction.den} portion`;
    } 
    else if (mode === 'quantity') {
        const val = parseFloat(qtyValue) || 0;
        const unitData = UNITS.find(u => u.label === selectedUnit);
        
        if (selectedUnit === 'pièce(s)') {
            factor = val; 
        } else {
            const totalGrams = val * unitData.weight;
            factor = totalGrams / 100; 
        }
        label = `${val} ${selectedUnit}`;
    }

    // Gestion des sous-ingrédients (si IA)
    let finalIngredients = product.ingredients;
    if (product.ingredients) {
        finalIngredients = product.ingredients.map(ing => ({
            ...ing,
            calories: Math.round(ing.calories * factor),
            proteins: Math.round(ing.proteins * factor),
            carbs: Math.round(ing.carbs * factor),
            fats: Math.round(ing.fats * factor),
            quantityLabel: ing.weight ? `${Math.round(ing.weight * factor)}g` : ing.quantityLabel
        }));
    }

    // 2. Création de l'objet final
    const finalProduct = {
      ...product,
      finalCalories: Math.round(product.calories * factor),
      finalProteins: Math.round(product.proteins * factor),
      finalCarbs: Math.round(product.carbs * factor),
      finalFats: Math.round(product.fats * factor),
      quantityLabel: label,
      factor: factor,
      isAiMeal: product.isAiMeal,
      ingredients: finalIngredients 
    };

    // 3. NAVIGATION (🔥 CORRIGÉ)
    if (returnTo === 'PhotoIngredientsScreen') {
        // 🔥 CAS SPÉCIAL : Retour à PhotoIngredientsScreen avec ingrédient modifié
        navigation.navigate('PhotoIngredientsScreen', {
            updatedIngredient: {
                ingredient: {
                    name: product.name,
                    quantityLabel: label,
                    calories: Math.round(product.calories * factor),
                    proteins: Math.round(product.proteins * factor),
                    carbs: Math.round(product.carbs * factor),
                    fats: Math.round(product.fats * factor),
                },
                editIndex: editIndex,
            },
            // On remet les params nécessaires pour PhotoIngredientsScreen
            dishName: route.params?.dishName,
            ingredients: route.params?.allIngredients,
            mealType: mealType,
        });
    } else if (returnTo === 'ComplexMeal' || returnTo === 'CreateRecipeFlow') {
        // On sauvegarde dans le store
        if (editIndex !== undefined && editIndex !== null) {
            RecipeStore.updateIngredient(editIndex, finalProduct);
        } else {
            RecipeStore.addIngredient(finalProduct);
        }
        
        // ON RETOURNE EN ARRIÈRE EN RENVOYANT LE MEALTYPE
        navigation.navigate({
            name: returnTo, 
            params: { 
                newIngredient: finalProduct, // Juste pour déclencher le useEffect
                mealType: mealType // <--- TRES IMPORTANT : On le renvoie pour ne pas le perdre
            }, 
            merge: true 
        });
    } else {
        // Cas normal : ajout direct
        navigation.navigate('FoodSummary', { finalProduct, mealType });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>{editIndex !== undefined ? "Modifier" : "Quelle quantité ?"}</Text>
        <View style={{width: 40}} />
      </View>

      <View style={styles.content}>
        <Text style={styles.productName}>{product.name}</Text>
        <Text style={styles.baseInfo}>
            {forcePercentMode 
                ? "Quantité consommée de l'assiette" 
                : `${Math.round(product.calories)} kcal (Base)`}
        </Text>

        {!forcePercentMode && (
            <View style={styles.tabs}>
            <TabButton title="%" active={mode === 'percent'} onPress={() => setMode('percent')} />
            <TabButton title="Portion" active={mode === 'portion'} onPress={() => setMode('portion')} />
            <TabButton title="Quantité" active={mode === 'quantity'} onPress={() => setMode('quantity')} />
            </View>
        )}

        <View style={styles.inputArea}>
          
          {mode === 'percent' && (
            <View style={{width: '100%', alignItems: 'center'}}>
              <Text style={styles.bigValue}>{Math.round(percent)} %</Text>
              <Slider
                style={{width: '100%', height: 40}}
                minimumValue={0}
                maximumValue={100}
                step={5}
                value={percent}
                onValueChange={setPercent}
                minimumTrackTintColor={Colors.primary}
                maximumTrackTintColor="#E5E7EB"
                thumbTintColor={Colors.primary}
              />
            </View>
          )}

          {mode === 'portion' && (
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
              <TextInput style={styles.fractionInput} keyboardType="numeric" value={fraction.num} onChangeText={t => setFraction({...fraction, num: t})} />
              <Text style={{fontSize: 30, marginHorizontal: 10, color: Colors.textLight}}>/</Text>
              <TextInput style={styles.fractionInput} keyboardType="numeric" value={fraction.den} onChangeText={t => setFraction({...fraction, den: t})} />
            </View>
          )}

          {mode === 'quantity' && (
            <View style={{width: '100%', alignItems: 'center'}}>
                <TextInput 
                    style={styles.gramInput} 
                    keyboardType="numeric" 
                    value={qtyValue} 
                    onChangeText={setQtyValue} 
                    autoFocus={true} 
                    placeholder="0"
                    placeholderTextColor="#D1D5DB"
                />
                <View style={{height: 50, marginTop: 15}}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{paddingHorizontal: 10}}>
                        {UNITS.map((u) => (
                            <TouchableOpacity key={u.label} style={[styles.unitChip, selectedUnit === u.label && styles.activeUnitChip]} onPress={() => setSelectedUnit(u.label)}>
                                <Text style={[styles.unitText, selectedUnit === u.label && styles.activeUnitText]}>{u.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            </View>
          )}

        </View>

        <TouchableOpacity style={styles.nextButton} onPress={handleContinue}>
          <Text style={styles.nextText}>Valider</Text>
          <Ionicons name="checkmark" size={24} color="white" />
        </TouchableOpacity>

      </View>
    </SafeAreaView>
  );
}

const TabButton = ({ title, active, onPress }) => (
  <TouchableOpacity style={[styles.tab, active && styles.activeTab]} onPress={onPress}>
    <Text style={[styles.tabText, active && styles.activeTabText]}>{title}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white' },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, alignItems: 'center' },
  backBtn: { padding: 8 },
  title: { fontSize: 18, fontWeight: 'bold' },
  content: { padding: 20, alignItems: 'center' },
  productName: { fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginBottom: 5 },
  baseInfo: { color: Colors.textLight, marginBottom: 30 },
  tabs: { flexDirection: 'row', backgroundColor: '#F3F4F6', borderRadius: 12, padding: 4, marginBottom: 40 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  activeTab: { backgroundColor: 'white', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  tabText: { fontWeight: '600', color: Colors.textLight },
  activeTabText: { color: Colors.primary },
  inputArea: { height: 180, justifyContent: 'center', width: '100%', alignItems: 'center' },
  bigValue: { fontSize: 40, fontWeight: 'bold', color: Colors.primary, marginBottom: 10 },
  fractionInput: { fontSize: 40, fontWeight: 'bold', borderBottomWidth: 2, borderColor: Colors.primary, width: 80, textAlign: 'center', color: Colors.text },
  gramInput: { fontSize: 50, fontWeight: 'bold', borderBottomWidth: 2, borderColor: Colors.primary, minWidth: 100, textAlign: 'center', color: Colors.text },
  unitChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F3F4F6', marginRight: 10, height: 36, justifyContent: 'center' },
  activeUnitChip: { backgroundColor: Colors.primary },
  unitText: { color: Colors.textLight, fontWeight: '600' },
  activeUnitText: { color: 'white' },
  nextButton: { flexDirection: 'row', backgroundColor: Colors.primary, paddingHorizontal: 40, paddingVertical: 15, borderRadius: 30, alignItems: 'center', marginTop: 30 },
  nextText: { color: 'white', fontWeight: 'bold', fontSize: 18, marginRight: 10 }
});