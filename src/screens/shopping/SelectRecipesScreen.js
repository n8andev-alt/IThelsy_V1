import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery } from "convex/react";
import { useState } from 'react';
import { ActivityIndicator, FlatList, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { api } from "../../../convex/_generated/api";
import Colors from '../../constants/Colors';

export default function SelectRecipesScreen({ navigation }) {
  const allRecipes = useQuery(api.recipes.list);
  
  // On utilise la fonction intelligente d'ajout (celle qui additionne et trie)
  const addSmartList = useMutation(api.shopping.addSmartItems);
  
  // IDs des recettes étendues (pour voir les détails)
  const [expandedRecipes, setExpandedRecipes] = useState([]);
  
  // LE NOUVEAU SYSTÈME : On stocke les IDs des ingrédients cochés
  // Format des clés : "IDRecette_IndexIngrédient" (ex: "jh7..._0")
  const [checkedIngredients, setCheckedIngredients] = useState(new Set());
  
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(false);

  // Déplier / Replier une recette
  const toggleExpand = (id) => {
    if (expandedRecipes.includes(id)) setExpandedRecipes(expandedRecipes.filter(i => i !== id));
    else setExpandedRecipes([...expandedRecipes, id]);
  };

  // Cocher / Décocher TOUS les ingrédients d'une recette
  const toggleRecipeGlobal = (recipe) => {
    const allIds = recipe.ingredients.map((_, idx) => `${recipe._id}_${idx}`);
    
    // Vérifie si TOUT est déjà coché
    const isAllChecked = allIds.every(id => checkedIngredients.has(id));

    const newSet = new Set(checkedIngredients);
    if (isAllChecked) {
        // Si tout est coché -> on décoche tout
        allIds.forEach(id => newSet.delete(id));
    } else {
        // Sinon -> on coche tout (même ceux qui l'étaient déjà)
        allIds.forEach(id => newSet.add(id));
    }
    setCheckedIngredients(newSet);
    
    // Si on coche tout, on ouvre la recette pour montrer ce qu'on a fait (optionnel mais sympa)
    if (!isAllChecked && !expandedRecipes.includes(recipe._id)) {
        setExpandedRecipes([...expandedRecipes, recipe._id]);
    }
  };

  // Cocher / Décocher UN SEUL ingrédient
  const toggleIngredient = (key) => {
    const newSet = new Set(checkedIngredients);
    if (newSet.has(key)) {
        newSet.delete(key);
    } else {
        newSet.add(key);
    }
    setCheckedIngredients(newSet);
  };

  const handleGenerate = async () => {
    // 1. On parcourt tout pour retrouver les ingrédients cochés
    const itemsToSend = [];
    
    if (!allRecipes) return;

    allRecipes.forEach(recipe => {
        recipe.ingredients.forEach((ing, index) => {
            const key = `${recipe._id}_${index}`;
            
            // Si cet ingrédient précis est coché
            if (checkedIngredients.has(key)) {
                itemsToSend.push({
                    name: ing.name,
                    quantityLabel: ing.quantityLabel
                });
            }
        });
    });

    if (itemsToSend.length > 0) {
        setLoading(true);
        // On envoie au backend intelligent qui va additionner et trier
        await addSmartList({ items: itemsToSend });
        setLoading(false);
        navigation.goBack();
    } else {
        alert("Sélectionne au moins un ingrédient !");
    }
  };

  const filteredData = allRecipes ? allRecipes.filter(r => 
    r.title.toLowerCase().includes(searchText.toLowerCase())
  ) : [];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="close" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Planifier</Text>
        <View style={{width: 24}} />
      </View>

      <Text style={styles.subtitle}>Coche les ingrédients dont tu as besoin :</Text>

      <View style={styles.searchSection}>
          <Ionicons name="search" size={20} color={Colors.textLight} />
          <TextInput 
              style={styles.input}
              placeholder="Chercher une recette..."
              value={searchText}
              onChangeText={setSearchText}
          />
      </View>

      {!allRecipes ? (
        <ActivityIndicator color={Colors.primary} style={{marginTop: 50}} />
      ) : (
        <FlatList
          data={filteredData}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{padding: 20, paddingBottom: 100}}
          renderItem={({ item }) => {
            // Calculs pour l'état visuel de la recette (Case à cocher parente)
            const allIds = item.ingredients.map((_, idx) => `${item._id}_${idx}`);
            const checkedCount = allIds.filter(id => checkedIngredients.has(id)).length;
            
            // État visuel : Tout coché ? Rien ? Un peu ?
            const isAllChecked = checkedCount === allIds.length && allIds.length > 0;
            const isNoneChecked = checkedCount === 0;
            const isExpanded = expandedRecipes.includes(item._id);

            // Icône de la case parente
            let parentIconName = "square-outline";
            let parentIconColor = Colors.textLight;
            
            if (isAllChecked) {
                parentIconName = "checkbox";
                parentIconColor = Colors.primary;
            } else if (!isNoneChecked) {
                // "Indéterminé" (un peu coché) -> On met un carré avec un tiret
                parentIconName = "remove-circle-outline"; // Ou "checkbox-indeterminate" si dispo
                parentIconColor = Colors.primary;
            }

            return (
              <View style={[styles.card, !isNoneChecked && styles.cardActive]}>
                
                {/* Header Recette */}
                <TouchableOpacity style={styles.cardHeader} onPress={() => toggleExpand(item._id)}>
                    
                    {/* Zone Checkbox Globale (à gauche) */}
                    <TouchableOpacity onPress={() => toggleRecipeGlobal(item)} style={{padding: 5}}>
                        <Ionicons name={parentIconName} size={24} color={parentIconColor} />
                    </TouchableOpacity>
                    
                    <View style={{flex: 1, marginLeft: 10}}>
                        <Text style={[styles.recipeName, !isNoneChecked && {color: Colors.primary}]}>{item.title}</Text>
                        <Text style={styles.details}>
                            {checkedCount} / {item.ingredients.length} ingrédients sélectionnés
                        </Text>
                    </View>
                    
                    {/* Chevron (à droite) */}
                    <Ionicons name={isExpanded ? "chevron-up" : "chevron-down"} size={20} color={Colors.textLight} />
                </TouchableOpacity>

                {/* Liste Ingrédients (Si étendu) */}
                {isExpanded && (
                    <View style={styles.ingList}>
                        {item.ingredients.map((ing, idx) => {
                            const key = `${item._id}_${idx}`;
                            const isChecked = checkedIngredients.has(key);
                            return (
                                <TouchableOpacity 
                                    key={key} 
                                    style={styles.ingRow} 
                                    onPress={() => toggleIngredient(key)}
                                    activeOpacity={0.7}
                                >
                                    <Ionicons 
                                        name={isChecked ? "checkbox" : "square-outline"} 
                                        size={20} 
                                        color={isChecked ? Colors.primary : Colors.textLight} 
                                        style={{marginRight: 10}} 
                                    />
                                    <Text style={[styles.ingText, isChecked && {color: Colors.text, fontWeight:'600'}]}>
                                        {ing.name} <Text style={{color:Colors.textLight, fontWeight:'normal'}}>({ing.quantityLabel})</Text>
                                    </Text>
                                </TouchableOpacity>
                            )
                        })}
                    </View>
                )}
              </View>
            );
          }}
        />
      )}

      <View style={styles.footer}>
        <TouchableOpacity 
            style={[styles.btn, (checkedIngredients.size === 0 || loading) && {backgroundColor: '#D1D5DB'}]} 
            onPress={handleGenerate}
            disabled={checkedIngredients.size === 0 || loading}
        >
            <Text style={styles.btnText}>
                {loading ? "Ajout..." : `Ajouter ${checkedIngredients.size} articles`}
            </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white' },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, alignItems: 'center' },
  backBtn: { padding: 5 },
  title: { fontSize: 18, fontWeight: 'bold', color: Colors.text },
  subtitle: { paddingHorizontal: 20, color: Colors.textLight, marginBottom: 10 },
  
  searchSection: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', marginHorizontal: 20, borderRadius: 10, paddingHorizontal: 10, height: 45 },
  input: { flex: 1, marginLeft: 10, fontSize: 16, color: Colors.text },

  card: { marginBottom: 10, borderRadius: 12, backgroundColor: 'white', borderWidth: 1, borderColor: '#F3F4F6', overflow: 'hidden', shadowColor: "#000", shadowOpacity: 0.02, shadowRadius: 3, elevation: 1 },
  cardActive: { borderColor: Colors.primary, backgroundColor: '#F0FDF4' },
  
  cardHeader: { flexDirection: 'row', alignItems: 'center', padding: 15 },
  recipeName: { fontWeight: 'bold', fontSize: 16, color: Colors.text },
  details: { color: Colors.textLight, fontSize: 12 },
  
  ingList: { backgroundColor: '#F9FAFB', padding: 10, paddingLeft: 15, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  ingRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  ingText: { fontSize: 14, color: Colors.textLight, flex: 1 },

  footer: { padding: 20, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  btn: { backgroundColor: Colors.primary, padding: 18, borderRadius: 16, alignItems: 'center' },
  btnText: { color: 'white', fontWeight: 'bold', fontSize: 18 }
});