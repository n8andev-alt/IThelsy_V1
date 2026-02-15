import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useQuery } from "convex/react";
import { useCallback, useState } from 'react';
import { Dimensions, Image, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { api } from "../../convex/_generated/api";
import { SkeletonRecipeCard } from '../components/SkeletonLoader';
import Colors from '../constants/Colors';
import { RecipeStore } from '../data/RecipeStore';

const { width } = Dimensions.get('window');

// --- COMPOSANT BULLE ---
const TutoBubble = ({ text, onNext, top, bottom, arrowAlign = 'center', side = 'top', isLast }) => {
    let alignItems = 'center';
    if (arrowAlign === 'left') alignItems = 'flex-start';
    if (arrowAlign === 'right') alignItems = 'flex-end';
    const arrowMargin = 25; 

    return (
        <View style={[styles.bubbleWrapper, top !== undefined ? { top } : { bottom }]}>
            {side === 'top' && <View style={{ alignItems, paddingHorizontal: arrowMargin }}><View style={styles.arrowUp} /></View>}
            <View style={styles.bubbleContent}>
                <View style={{flexDirection:'row', alignItems:'flex-start'}}>
                    <Ionicons name="bulb" size={24} color="#F59E0B" style={{marginTop: 2, marginRight: 10}} />
                    <Text style={styles.bubbleText}>{text}</Text>
                </View>
                <TouchableOpacity onPress={onNext} style={styles.bubbleBtn}>
                    <Text style={styles.bubbleBtnText}>{isLast ? "Vers le Profil 👉" : "Suivant"}</Text>
                </TouchableOpacity>
            </View>
            {side === 'bottom' && <View style={{ alignItems, paddingHorizontal: arrowMargin }}><View style={styles.arrowDown} /></View>}
        </View>
    );
};

export default function RecipesScreen({ navigation, route }) {
  const [searchText, setSearchText] = useState('');
  const [activeFilter, setActiveFilter] = useState('Tous');
  
  const [tutoStep, setTutoStep] = useState(0);

  useFocusEffect(
    useCallback(() => {
      if (route.params?.startTuto) {
          setTimeout(() => setTutoStep(1), 500);
          navigation.setParams({ startTuto: undefined });
      }
    }, [route.params?.startTuto])
  );

  const handleNextStep = () => {
      if (tutoStep === 3) {
          setTutoStep(0);
          navigation.navigate('Profil', { startTuto: true });
      } else {
          setTutoStep(tutoStep + 1);
      }
  };

  const allRecipes = useQuery(api.recipes.list);

  const colorSeche = '#F59E0B';    
  const colorMasse = '#EF4444';    
  const colorMaintien = '#3B82F6'; 

  const getTagColor = (tag) => {
    if (!tag) return Colors.textLight;
    if (tag.includes('Sèche')) return colorSeche;
    if (tag.includes('Masse')) return colorMasse;
    return colorMaintien;
  };

  const filteredRecipes = allRecipes ? allRecipes.filter(recipe => {
    const matchesSearch = recipe.title.toLowerCase().includes(searchText.toLowerCase());
    let matchesTag = true;
    if (activeFilter !== 'Tous') {
        matchesTag = recipe.tags && recipe.tags.some(t => t.includes(activeFilter));
        if (activeFilter === 'Masse') {
             matchesTag = recipe.tags && recipe.tags.some(t => t.includes('Masse') || t.includes('Prise de masse'));
        }
    }
    return matchesSearch && matchesTag;
  }) : [];

  const handleCreateRecipe = () => {
    RecipeStore.clear();
    navigation.navigate('CreateRecipeFlow');
  };

  const handleOpenRecipe = (recipe) => {
    navigation.navigate('RecipeDetails', { recipe });
  };

  // 🎨 SKELETON LOADING
  if (!allRecipes) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={{ width: 120, height: 28, backgroundColor: '#D1D5DB', borderRadius: 4 }} />
            <View style={{ width: 40, height: 40, backgroundColor: '#E5E7EB', borderRadius: 20 }} />
          </View>

          {/* Search Bar Skeleton */}
          <View style={[styles.searchBar, { backgroundColor: '#F3F4F6', marginBottom: 20 }]}>
            <View style={{ width: 150, height: 16, backgroundColor: '#D1D5DB', borderRadius: 4 }} />
          </View>

          {/* Filter Chips Skeleton */}
          <View style={{ flexDirection: 'row', marginBottom: 25, height: 40 }}>
            {[1, 2, 3, 4].map(i => (
              <View 
                key={i} 
                style={{ 
                  width: 70, 
                  height: 36, 
                  backgroundColor: '#E5E7EB', 
                  borderRadius: 20, 
                  marginRight: 10 
                }} 
              />
            ))}
          </View>

          {/* Recipe Cards Skeletons */}
          <SkeletonRecipeCard />
          <SkeletonRecipeCard />
          <SkeletonRecipeCard />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      
      {/* BULLE 2 : PANIER (Haut Droite) */}
      {tutoStep === 2 && (
          <TutoBubble 
              text="Ta liste de courses intelligente est ici. Ajoute des recettes pour la remplir !" 
              onNext={handleNextStep}
              top={100} side="top" arrowAlign="right"
          />
      )}

      {/* BULLE 3 : PROFIL (Bas Droite) */}
      {tutoStep === 3 && (
          <TutoBubble 
              text="Dernière étape : Ton profil pour voir ta progression." 
              onNext={handleNextStep}
              bottom={10} side="bottom" arrowAlign="right" isLast={true}
          />
      )}

      <View style={styles.content}>
        
        <View style={styles.header}>
          <Text style={styles.title}>Recettes</Text>
          <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate('ShoppingList')}>
            <Ionicons name="cart-outline" size={28} color={Colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.searchSection}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color={Colors.textLight} />
            <TextInput
              style={styles.input}
              placeholder="Rechercher une recette..."
              value={searchText}
              onChangeText={setSearchText}
            />
          </View>
        </View>

        <View style={styles.filterContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{paddingRight: 20}}>
              <FilterChip label="Tous" active={activeFilter === 'Tous'} onPress={() => setActiveFilter('Tous')} />
              <FilterChip label="Sèche" color={colorSeche} active={activeFilter === 'Sèche'} onPress={() => setActiveFilter('Sèche')} />
              <FilterChip label="Maintien" color={colorMaintien} active={activeFilter === 'Maintien'} onPress={() => setActiveFilter('Maintien')} />
              <FilterChip label="Masse" color={colorMasse} active={activeFilter === 'Masse'} onPress={() => setActiveFilter('Masse')} />
            </ScrollView>
        </View>

        {filteredRecipes.length === 0 ? (
            <View style={styles.emptyState}>
                <Ionicons name="book-outline" size={50} color="#E5E7EB" />
                <Text style={styles.emptyText}>Aucune recette trouvée.</Text>
            </View>
        ) : (
            <ScrollView style={styles.recipeList} contentContainerStyle={{paddingBottom: 100}} showsVerticalScrollIndicator={false} scrollEnabled={tutoStep === 0}>
            {filteredRecipes.map((recipe, index) => (
                <RecipeCard 
                    key={index} 
                    title={recipe.title} 
                    image={recipe.image}
                    macros={`${Math.round(recipe.calories)} kcal • ${Math.round(recipe.proteins)}g P`} 
                    time={recipe.prepTime || "15 min"}
                    tag={recipe.tags ? recipe.tags[0] : "Perso"} 
                    tagColor={getTagColor(recipe.tags ? recipe.tags[0] : "")}
                    onPress={() => handleOpenRecipe(recipe)}
                />
            ))}
            </ScrollView>
        )}
      </View>

      <TouchableOpacity style={styles.fab} onPress={handleCreateRecipe}>
        <Ionicons name="add" size={32} color="white" />
      </TouchableOpacity>

      {/* BULLE 1 : CRÉER (Bas Droite, au dessus du FAB) */}
      {tutoStep === 1 && (
          <TutoBubble 
              text="Crée tes propres recettes pour les réutiliser facilement !" 
              onNext={handleNextStep}
              bottom={90} side="bottom" arrowAlign="right"
          />
      )}

    </SafeAreaView>
  );
}

const FilterChip = ({ label, active, color, onPress }) => (
  <TouchableOpacity onPress={onPress} style={[
    styles.chip, 
    active && { backgroundColor: color || Colors.text }, 
    active && !color && { backgroundColor: Colors.text },
    color && !active && { borderColor: color, borderWidth: 1 }
  ]}>
    <Text style={[
      styles.chipText, 
      active && { color: Colors.white },
      color && !active && { color: color, fontWeight: 'bold' }
    ]}>{label}</Text>
  </TouchableOpacity>
);

const RecipeCard = ({ title, macros, time, tag, tagColor, onPress, image }) => (
  <TouchableOpacity style={styles.card} onPress={onPress}>
    {image ? (
        <Image source={{ uri: image }} style={styles.cardImage} resizeMode="cover" />
    ) : (
        <View style={styles.cardImagePlaceholder}>
            <MaterialCommunityIcons name="chef-hat" size={40} color="#9CA3AF" />
        </View>
    )}
    
    <View style={styles.cardContent}>
      <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start'}}>
        <Text style={styles.cardTitle} numberOfLines={1}>{title}</Text>
        <View style={{flexDirection: 'row', alignItems: 'center'}}>
           <Ionicons name="time-outline" size={14} color={Colors.textLight} />
           <Text style={{fontSize: 12, color: Colors.textLight, marginLeft: 4}}>{time}</Text>
        </View>
      </View>
      <View style={{flexDirection: 'row', alignItems: 'center', marginTop: 6}}>
        <View style={{backgroundColor: tagColor, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginRight: 8}}>
            <Text style={{color: 'white', fontSize: 10, fontWeight: 'bold'}}>{tag.toUpperCase()}</Text>
        </View>
        <Text style={styles.cardMacros}>{macros}</Text>
      </View>
    </View>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { flex: 1, paddingHorizontal: 20, paddingTop: 10 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 28, fontWeight: 'bold', color: Colors.text },
  iconButton: { padding: 5 },
  searchSection: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  searchBar: { flex: 1, flexDirection: 'row', backgroundColor: Colors.white, padding: 12, borderRadius: 14, alignItems: 'center', marginRight: 12, shadowColor: "#000", shadowOpacity: 0.03, shadowRadius: 5, elevation: 2 },
  input: { marginLeft: 10, flex: 1, fontSize: 16, color: Colors.text },
  filterContainer: { height: 40, marginBottom: 25 }, 
  chip: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 25, backgroundColor: Colors.white, marginRight: 10, justifyContent: 'center', shadowColor: "#000", shadowOpacity: 0.02, shadowRadius: 3 },
  chipText: { fontSize: 14, color: Colors.textLight, fontWeight: '500' },
  card: { backgroundColor: Colors.white, borderRadius: 20, marginBottom: 18, overflow: 'hidden', shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 10, elevation: 2 },
  
  cardImage: { height: 140, width: '100%' },
  cardImagePlaceholder: { height: 140, backgroundColor: '#E5E7EB', justifyContent: 'center', alignItems: 'center' },
  
  cardContent: { padding: 16 },
  cardTitle: { fontSize: 17, fontWeight: '700', color: Colors.text, flex: 1, marginRight: 10 },
  cardMacros: { fontSize: 13, color: Colors.textLight },
  emptyState: { alignItems: 'center', marginTop: 50 },
  emptyText: { marginTop: 10, fontSize: 18, fontWeight: 'bold', color: Colors.text },
  fab: { position: 'absolute', bottom: 20, right: 20, backgroundColor: Colors.primary, width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', shadowColor: Colors.primary, shadowOpacity: 0.4, shadowRadius: 8, elevation: 5 },
  recipeList: { flex: 1 },

  // --- STYLES TUTO BULLE ---
  bubbleWrapper: { position: 'absolute', width: width - 40, left: 20, zIndex: 999 },
  bubbleContent: { backgroundColor: 'white', padding: 15, borderRadius: 16, width: '100%', shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 10, elevation: 10, borderWidth: 1, borderColor: '#F3F4F6' },
  bubbleText: { fontSize: 15, color: '#374151', lineHeight: 22, flex: 1, fontWeight: '500' },
  bubbleBtn: { marginTop: 10, backgroundColor: Colors.primary, paddingVertical: 10, paddingHorizontal: 20, borderRadius: 25, alignSelf: 'flex-end', flexDirection: 'row', alignItems: 'center' },
  bubbleBtnText: { color: 'white', fontWeight: 'bold', fontSize: 14 },
  arrowUp: { width: 0, height: 0, borderLeftWidth: 12, borderRightWidth: 12, borderBottomWidth: 12, borderStyle: 'solid', backgroundColor: 'transparent', borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: 'white', marginBottom: -1, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 2 },
  arrowDown: { width: 0, height: 0, borderLeftWidth: 12, borderRightWidth: 12, borderTopWidth: 12, borderStyle: 'solid', backgroundColor: 'transparent', borderLeftColor: 'transparent', borderRightColor: 'transparent', borderTopColor: 'white', marginTop: -1, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 2 }
});