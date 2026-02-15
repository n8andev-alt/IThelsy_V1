import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery } from "convex/react";
import { useState } from 'react';
import { ActivityIndicator, FlatList, Keyboard, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { api } from "../../../convex/_generated/api";
import Colors from '../../constants/Colors';

export default function FavoritesScreen({ route, navigation }) {
    const { mealType, returnTo } = route.params || {};
  const favorites = useQuery(api.favorites.list);
  const removeFavorite = useMutation(api.favorites.remove);

  // Etat pour la recherche
  const [searchText, setSearchText] = useState("");

  const handleSelect = (fav) => {
    navigation.navigate('FoodQuantity', { 
        product: fav.originalData, 
        mealType,
        returnTo
    });
  };

  const handleDelete = async (id) => {
    await removeFavorite({ id });
  };

  // --- LOGIQUE DE TRI ET FILTRE ---
  // 1. On attend que les favoris soient chargés
  // 2. On filtre selon le texte
  // 3. On trie par date de création inversée (plus récent en haut)
  const filteredFavorites = favorites
    ? favorites
        .filter((item) => item && item?.name && item.name.toLowerCase().includes(searchText.toLowerCase()))
        .sort((a, b) => (b?._creationTime || 0) - (a?._creationTime || 0)) // Tri : Récent -> Ancien
    : [];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="arrow-back" size={24} color={Colors.text} /></TouchableOpacity>
        <Text style={styles.title}>Mes Favoris</Text>
        <View style={{width: 24}} />
      </View>

      {/* BARRE DE RECHERCHE */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={Colors.textLight} />
        <TextInput 
            style={styles.input}
            placeholder="Rechercher dans mes favoris..."
            placeholderTextColor={Colors.textLight}
            value={searchText}
            onChangeText={setSearchText}
        />
        {searchText.length > 0 && (
            <TouchableOpacity onPress={() => {setSearchText(""); Keyboard.dismiss()}}>
                <Ionicons name="close-circle" size={20} color={Colors.textLight} />
            </TouchableOpacity>
        )}
      </View>

      {!favorites ? (
        <ActivityIndicator size="large" color={Colors.primary} style={{marginTop: 50}} />
      ) : favorites.length === 0 ? (
        <View style={styles.emptyState}>
            <Ionicons name="heart-outline" size={50} color="#E5E7EB" />
            <Text style={styles.emptyText}>Aucun favori pour l'instant.</Text>
            <Text style={styles.emptySub}>Ajoute-en depuis le résumé d'un aliment !</Text>
        </View>
      ) : filteredFavorites.length === 0 ? (
        <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Aucun résultat pour "{searchText}"</Text>
        </View>
      ) : (
        <FlatList
          data={filteredFavorites}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{padding: 20}}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.favCard} onPress={() => handleSelect(item)}>
              <View style={{flex: 1}}>
                <Text style={styles.favName}>{item?.name || 'Favori'}</Text>
                <Text style={styles.favMacros}>{Math.round(item?.calories || 0)} kcal • P:{Math.round(item?.proteins || 0)}</Text>
              </View>
              <TouchableOpacity onPress={() => handleDelete(item?._id)} style={{padding: 10}}>
                 <Ionicons name="trash-outline" size={20} color={Colors.textLight} />
              </TouchableOpacity>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white' },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, alignItems: 'center' },
  title: { fontSize: 18, fontWeight: 'bold', color: Colors.text },
  
  // Style Barre de recherche
  searchContainer: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F3F4F6', marginHorizontal: 20, marginBottom: 10,
    paddingHorizontal: 15, paddingVertical: 10, borderRadius: 12
  },
  input: { flex: 1, marginLeft: 10, fontSize: 16, color: Colors.text },

  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { marginTop: 10, fontSize: 16, fontWeight: 'bold', color: Colors.textLight },
  emptySub: { fontSize: 12, color: Colors.textLight },
  
  favCard: { flexDirection: 'row', alignItems: 'center', padding: 15, backgroundColor: '#F9FAFB', borderRadius: 12, marginBottom: 10 },
  favName: { fontSize: 16, fontWeight: '600', color: Colors.text },
  favMacros: { fontSize: 12, color: Colors.textLight, marginTop: 4 }
});