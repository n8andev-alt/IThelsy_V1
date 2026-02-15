import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Colors from '../../constants/Colors';

export default function PhotoIngredientsScreen({ route, navigation }) {
  console.log("🔍 PhotoIngredientsScreen - route.params:", JSON.stringify(route.params, null, 2));
  
  const { dishName, ingredients: initialIngredients, mealType } = route.params;
  
  console.log("🔍 dishName:", dishName);
  console.log("🔍 initialIngredients:", JSON.stringify(initialIngredients, null, 2));
  console.log("🔍 mealType:", mealType);
  
  // 1. INITIALISATION ROBUSTE
  const [ingredients, setIngredients] = useState(() => {
    if (!initialIngredients) {
      console.error("❌ initialIngredients est undefined !");
      return [];
    }
    
    return initialIngredients.map(ing => {
      console.log("🔍 Ingrédient reçu:", JSON.stringify(ing, null, 2));
      return {
        name: ing.name,
        quantityLabel: ing.quantityLabel || "100g",
        calories: ing.calories || 0,
        proteins: ing.proteins || 0,
        carbs: ing.carbs || 0,
        fats: ing.fats || 0,
      };
    });
  });
  
  const [totals, setTotals] = useState({ cal: 0, p: 0, c: 0, f: 0 });

  useEffect(() => {
    console.log("🔍 Recalcul des totaux...");
    let t = { cal: 0, p: 0, c: 0, f: 0 };
    ingredients.forEach(ing => {
      t.cal += ing.calories || 0;
      t.p += ing.proteins || 0;
      t.c += ing.carbs || 0;
      t.f += ing.fats || 0;
    });
    console.log("🔍 Nouveaux totaux:", t);
    setTotals(t);
  }, [ingredients]);

  // 🔥 NAVIGATION VERS FoodQuantity POUR MODIFIER
  const handleEditQuantity = (ingredient, index) => {
    console.log("🔍 handleEditQuantity appelé");
    console.log("🔍 Ingrédient à modifier:", JSON.stringify(ingredient, null, 2));
    console.log("🔍 Index:", index);
    
    navigation.navigate('FoodQuantity', {
      product: {
        name: ingredient.name,
        calories: ingredient.calories,
        proteins: ingredient.proteins,
        carbs: ingredient.carbs,
        fats: ingredient.fats,
        quantityLabel: ingredient.quantityLabel,
      },
      mealType: mealType,
      returnTo: 'PhotoIngredientsScreen',
      editIndex: index,
      dishName: dishName,
      allIngredients: ingredients,
    });
  };

  // 🔥 ÉCOUTE DU RETOUR DEPUIS FoodQuantity
  useEffect(() => {
    console.log("🔍 useEffect retour - route.params.updatedIngredient:", route.params?.updatedIngredient);
    
    if (route.params?.updatedIngredient) {
      const { ingredient, editIndex } = route.params.updatedIngredient;
      
      console.log("🔍 Ingrédient mis à jour reçu:", JSON.stringify(ingredient, null, 2));
      console.log("🔍 editIndex:", editIndex);
      
      setIngredients(currentIngredients => {
        console.log("🔍 currentIngredients avant update:", JSON.stringify(currentIngredients, null, 2));
        
        const updated = currentIngredients.map((ing, i) => {
          if (i !== editIndex) return ing;
          
          console.log("🔍 Mise à jour de l'ingrédient à l'index", i);
          return {
            name: ingredient.name,
            quantityLabel: ingredient.quantityLabel,
            calories: ingredient.calories,
            proteins: ingredient.proteins,
            carbs: ingredient.carbs,
            fats: ingredient.fats,
          };
        });
        
        console.log("🔍 currentIngredients après update:", JSON.stringify(updated, null, 2));
        return updated;
      });

      // Nettoie le param pour éviter les re-updates
      navigation.setParams({ updatedIngredient: null });
    }
  }, [route.params?.updatedIngredient]);

  const handleNext = () => {
    console.log("🔍 handleNext appelé");
    console.log("🔍 ingredients:", JSON.stringify(ingredients, null, 2));
    
    // 🔥 NETTOYER LES INGRÉDIENTS
    const cleanIngredients = ingredients.map(ing => ({
      name: ing.name,
      quantityLabel: ing.quantityLabel,
      calories: Math.round(ing.calories),
      proteins: Math.round(ing.proteins),
      carbs: Math.round(ing.carbs),
      fats: Math.round(ing.fats),
    }));

    console.log("🔍 cleanIngredients:", JSON.stringify(cleanIngredients, null, 2));

    const consolidatedProduct = {
      name: dishName,
      calories: Math.round(totals.cal),
      proteins: Math.round(totals.p),
      carbs: Math.round(totals.c),
      fats: Math.round(totals.f),
      ingredients: cleanIngredients,
      isAiMeal: true, 
    };

    console.log("🔍 Navigation vers FoodQuantity avec:", JSON.stringify(consolidatedProduct, null, 2));

    navigation.navigate('FoodQuantity', { 
        product: consolidatedProduct, 
        mealType,
        forcePercentMode: true 
    });
  };

  if (!ingredients || ingredients.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Erreur</Text>
          <View style={{width: 40}} />
        </View>
        <View style={{flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20}}>
          <Text style={{fontSize: 18, color: Colors.text, textAlign: 'center'}}>
            Aucun ingrédient détecté. Réessaye de prendre une photo.
          </Text>
          <TouchableOpacity 
            style={{marginTop: 20, backgroundColor: Colors.primary, padding: 15, borderRadius: 12}}
            onPress={() => navigation.goBack()}
          >
            <Text style={{color: 'white', fontWeight: 'bold'}}>Retour</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Vérification</Text>
        <View style={{width: 40}} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{flex:1}}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        <Text style={styles.headerTitle}>{dishName}</Text>
        <Text style={styles.subtitle}>Vérifie les quantités estimées :</Text>

        {ingredients.map((ing, index) => (
          <TouchableOpacity 
            key={index} 
            style={styles.card}
            onPress={() => handleEditQuantity(ing, index)}
            activeOpacity={0.7}
          >
            <View style={{flex: 1}}>
                <Text style={styles.ingNameText}>{ing.name}</Text>
                <View style={styles.macroRow}>
                    <Text style={styles.macroText}>{Math.round(ing.calories)} kcal</Text>
                    <Text style={styles.macroTextDot}>•</Text>
                    <Text style={styles.macroText}>P: {Math.round(ing.proteins)}</Text>
                    <Text style={styles.macroText}>G: {Math.round(ing.carbs)}</Text>
                    <Text style={styles.macroText}>L: {Math.round(ing.fats)}</Text>
                </View>
            </View>
            
            {/* 🔥 AFFICHAGE QUANTITÉ CLIQUABLE */}
            <View style={styles.weightBox}>
                <Text style={styles.weightText}>{ing.quantityLabel}</Text>
                <Ionicons name="pencil" size={14} color={Colors.primary} style={{marginLeft: 6}} />
            </View>
          </TouchableOpacity>
        ))}

        <View style={{height: 100}} />

      </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.footer}>
        <View style={styles.totalRow}>
            <View>
                <Text style={styles.totalLabel}>Total estimé</Text>
                <Text style={styles.totalValue}>{Math.round(totals.cal)} <Text style={{fontSize:16, fontWeight:'normal'}}>kcal</Text></Text>
            </View>
            <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
                <Text style={styles.btnText}>Valider</Text>
                <Ionicons name="arrow-forward" size={20} color="white" />
            </TouchableOpacity>
        </View>
      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, alignItems: 'center', backgroundColor: 'white' },
  backBtn: { padding: 5 },
  title: { fontSize: 16, fontWeight: '600', color: Colors.textLight },
  
  content: { padding: 20 },
  headerTitle: { fontSize: 26, fontWeight: '800', color: Colors.text, marginBottom: 5 },
  subtitle: { color: Colors.textLight, marginBottom: 20, fontSize: 15 },

  card: { 
    flexDirection: 'row', alignItems: 'center', 
    backgroundColor: 'white', 
    padding: 15, borderRadius: 16, marginBottom: 12,
    shadowColor: "#000", shadowOpacity: 0.03, shadowRadius: 5, elevation: 2,
    borderWidth: 1, borderColor: '#E5E7EB'
  },
  
  ingNameText: { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: 4 },

  macroRow: { flexDirection: 'row', alignItems: 'center' },
  macroText: { fontSize: 12, color: Colors.textLight, fontWeight: '500' },
  macroTextDot: { fontSize: 12, color: Colors.textLight, marginHorizontal: 5 },

  // 🔥 POIDS CLIQUABLE
  weightBox: { 
    flexDirection: 'row', alignItems: 'center', 
    backgroundColor: '#F3F4F6', borderRadius: 10, 
    paddingHorizontal: 12, paddingVertical: 8, marginLeft: 10,
    borderWidth: 1, borderColor: Colors.primary + '20'
  },
  weightText: { fontSize: 14, fontWeight: 'bold', color: Colors.text },

  footer: { 
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: 'white', padding: 20, paddingBottom: 30,
    borderTopLeftRadius: 25, borderTopRightRadius: 25,
    shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 10, elevation: 10
  },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: 12, color: Colors.textLight, textTransform: 'uppercase', letterSpacing: 1, fontWeight: '600' },
  totalValue: { fontSize: 28, fontWeight: '900', color: Colors.text },
  
  nextButton: { 
    backgroundColor: Colors.primary, paddingHorizontal: 25, paddingVertical: 15, 
    borderRadius: 16, flexDirection: 'row', alignItems: 'center',
    shadowColor: Colors.primary, shadowOpacity: 0.3, shadowRadius: 5, elevation: 5
  },
  btnText: { color: 'white', fontWeight: 'bold', fontSize: 16, marginRight: 8 }
});