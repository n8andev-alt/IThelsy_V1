import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  SafeAreaView,
  StyleSheet,
  Text, TextInput, TouchableOpacity,
  View
} from 'react-native';
import Colors from '../../constants/Colors';
// On garde ta super liste (j'espère que tu as gardé la version longue avec les 100 aliments !)
import { COMMON_FOODS } from '../../data/CommonFoods';

export default function SearchFoodScreen({ route, navigation }) {
  const { mealType, returnTo } = route.params; 

  const [query, setQuery] = useState('');
  // On sépare les résultats locaux et internet pour l'affichage progressif
  const [localResults, setLocalResults] = useState([]);
  const [apiResults, setApiResults] = useState([]);
  const [loading, setLoading] = useState(false);

  // --- 1. RECHERCHE INSTANTANÉE (LOCALE) ---
  // Cette fonction s'exécute à chaque lettre tapée ou validation
  const updateLocalResults = (text) => {
    if (!text || text.length < 2) {
        setLocalResults([]);
        return;
    }
    const searchLower = text.toLowerCase();
    
    // Algorithme de tri local
    const matches = COMMON_FOODS.filter(food => 
        food.name.toLowerCase().includes(searchLower)
    ).sort((a, b) => {
        // Si ça commence par le mot, c'est mieux
        const startA = a.name.toLowerCase().startsWith(searchLower);
        const startB = b.name.toLowerCase().startsWith(searchLower);
        if (startA && !startB) return -1;
        if (!startA && startB) return 1;
        return 0;
    }).map(item => ({ ...item, isGeneric: true })); // On marque comme local

    setLocalResults(matches);
  };

  // --- 2. RECHERCHE INTERNET (Lente mais complète) ---
  const searchOnline = async () => {
    if (query.length < 2) return;
    
    Keyboard.dismiss();
    setLoading(true);
    setApiResults([]); // On vide les vieux résultats internet

    try {
      // API OpenFoodFacts (Optimisée)
      const response = await fetch(
        `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${query}&search_simple=1&action=process&json=1&page_size=10&fields=product_name,product_name_fr,brands,nutriments,_id,unique_scans_n`,
        { headers: { 'User-Agent': 'IThelsyApp - Android - 1.0' } }
      );

      const data = await response.json();
      
      let products = [];
      if (data.products) {
          products = data.products.map(product => {
            const name = product.product_name_fr || product.product_name;
            const cal = product.nutriments?.["energy-kcal_100g"] || product.nutriments?.["energy-kcal"];
            
            // FILTRE DRASTIQUE : Si pas de nom, pas de calories ou nom trop long (> 40 chars = souvent du bruit), on jette
            if (!name || !cal || name.length > 50) return null;

            return {
                id: product._id,
                name: name.trim(),
                brand: product.brands || "",
                calories: cal,
                proteins: product.nutriments?.proteins_100g || 0,
                carbs: product.nutriments?.carbohydrates_100g || 0,
                fats: product.nutriments?.fat_100g || 0,
                isGeneric: false,
            };
          }).filter(item => item !== null);
      }

      // TRI : On privilégie les noms courts (souvent les produits les plus simples)
      products.sort((a, b) => a.name.length - b.name.length);

      setApiResults(products);

    } catch (err) {
      console.log("Erreur API (pas grave, on a le local)");
    } finally {
      setLoading(false);
    }
  };

  // Déclenché quand on tape
  const handleTextChange = (text) => {
      setQuery(text);
      updateLocalResults(text); // ✨ INSTANTANÉ !
  };

  const handleSelectProduct = (product) => {
    navigation.navigate('FoodQuantity', { 
        product, 
        mealType,
        returnTo 
    });
  };

  // Fusion pour l'affichage (Local d'abord, puis Internet)
  const displayList = [...localResults, ...apiResults];

  return (
    <SafeAreaView style={styles.container}>
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>
            {returnTo ? "Ajouter ingrédient" : "Rechercher aliment"}
        </Text>
        <View style={{width: 40}} /> 
      </View>

      <View style={styles.searchContainer}>
        <TextInput 
          style={styles.input}
          placeholder="Pomme, Riz, Oeuf..." 
          value={query}
          onChangeText={handleTextChange} // Met à jour le local direct
          onSubmitEditing={searchOnline} // Lance internet si on fait Entrée
          placeholderTextColor="#9CA3AF"
          autoFocus
        />
        <TouchableOpacity onPress={searchOnline} style={styles.searchButton}>
           {/* Si ça charge, on montre le spinner, MAIS on laisse la liste locale visible dessous */}
           {loading ? (
             <ActivityIndicator size="small" color="white" />
           ) : (
             <Ionicons name="search" size={20} color="white" />
           )}
        </TouchableOpacity>
      </View>

      <FlatList
        data={displayList}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{padding: 20}}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
            // Message seulement si on ne charge pas ET qu'on a rien trouvé
            !loading && query.length > 2 && displayList.length === 0 && (
                <View style={{alignItems:'center', marginTop: 50}}>
                    <Text style={{color:Colors.textLight}}>Aucun résultat.</Text>
                    <Text style={{color:Colors.textLight, fontSize:12, marginTop:5}}>Appuie sur la loupe pour chercher en ligne.</Text>
                </View>
            )
        }
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.productCard} onPress={() => handleSelectProduct(item)}>
            <View style={{flex: 1}}>
              <View style={{flexDirection: 'row', alignItems: 'center'}}>
                {item.isGeneric ? (
                   <MaterialCommunityIcons name="sprout" size={16} color={Colors.primary} style={{marginRight: 6}} />
                ) : (
                   <MaterialCommunityIcons name="cloud-search-outline" size={16} color={Colors.textLight} style={{marginRight: 6}} />
                )}
                <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
              </View>
              <Text style={styles.productBrand} numberOfLines={1}>
                {item.isGeneric ? "Aliment de base" : item.brand}
              </Text>
            </View>
            <View style={{alignItems: 'flex-end', minWidth: 70}}>
               <Text style={styles.calories}>{Math.round(item.calories)} kcal</Text>
               <Text style={styles.macros}>
                 P:{Math.round(item.proteins)} G:{Math.round(item.carbs)} L:{Math.round(item.fats)}
               </Text>
            </View>
            <Ionicons name="add-circle" size={28} color={Colors.primary} style={{marginLeft: 10}} />
          </TouchableOpacity>
        )}
      />

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  backBtn: { padding: 8 },
  title: { fontSize: 18, fontWeight: 'bold', color: Colors.text },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', margin: 20, borderRadius: 12, paddingLeft: 15, paddingRight: 5, paddingVertical: 5 },
  input: { flex: 1, fontSize: 16, color: Colors.text, height: 40 },
  searchButton: { backgroundColor: Colors.primary, width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginLeft: 10 },
  productCard: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  productName: { fontSize: 16, fontWeight: '600', color: Colors.text, marginBottom: 2 },
  productBrand: { fontSize: 12, color: Colors.textLight },
  calories: { fontSize: 14, fontWeight: 'bold', color: '#F59E0B' },
  macros: { fontSize: 10, color: Colors.textLight, marginTop: 2 }
});