import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Colors from '../../constants/Colors';
import { RecipeStore } from '../../data/RecipeStore';

export default function MealEntryScreen({ route, navigation }) {
  // On récupère returnTo pour savoir si on est dans un sous-flow
  const { mealType, returnTo } = route.params || {};

  const handleMethod = (method) => {
    
    if (method === 'scan') {
      // On passe bien returnTo ici aussi
      navigation.navigate('ScanFood', { mealType, returnTo });
    }

    if (method === 'search') {
      navigation.navigate('SearchFood', { mealType, returnTo });
    }

    if (method === 'favorites') {
      navigation.navigate('Favorites', { mealType, returnTo });
    }

    if (method === 'photo') {
       navigation.navigate('PhotoMeal', { mealType, returnTo });
    }
    
    if (method === 'create' && !returnTo) {
      RecipeStore.clear();
      navigation.navigate('ComplexMeal', { mealType });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="close" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>
            {returnTo ? "Ajouter un ingrédient" : `Ajouter : ${mealType}`}
        </Text>
        <View style={{width: 40}} /> 
      </View>

      <ScrollView contentContainerStyle={styles.listContainer}>
        <Text style={styles.subtitle}>Choisis une méthode :</Text>
        
        <MethodRow title="Scanner" subtitle="Code-barres" icon="barcode-scan" color="#8B5CF6" onPress={() => handleMethod('scan')} />
        <MethodRow title="Rechercher" subtitle="Base de données" icon="magnify" color={Colors.primary} onPress={() => handleMethod('search')} />
        <MethodRow title="Favoris" subtitle="Tes habitudes" icon="heart" color="#EC4899" onPress={() => handleMethod('favorites')} />
        
        {/* 👇 ON AFFICHE LA PHOTO SEULEMENT SI ON N'EST PAS DANS UN SOUS-FLOW (pas de returnTo) 👇 */}
        {!returnTo && (
            <MethodRow title="Photo IA" subtitle="Analyse visuelle" icon="camera" color="#F59E0B" onPress={() => handleMethod('photo')} />
        )}

        {/* On cache aussi "Créer un plat" si on est déjà dedans */}
        {!returnTo && (
            <MethodRow title="Créer un plat composé" subtitle="Pour tes plats complexes" icon="chef-hat" color="#EF4444" onPress={() => handleMethod('create')} />
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const MethodRow = ({ title, subtitle, icon, color, onPress }) => (
  <TouchableOpacity style={styles.rowCard} onPress={onPress}>
    <View style={[styles.iconBox, { backgroundColor: color + '15' }]}>
      <MaterialCommunityIcons name={icon} size={26} color={color} />
    </View>
    <View style={{flex: 1}}>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardSubtitle}>{subtitle}</Text>
    </View>
    <Ionicons name="chevron-forward" size={20} color={Colors.textLight} />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  title: { fontSize: 18, fontWeight: 'bold', color: Colors.text },
  backBtn: { padding: 5 },
  listContainer: { padding: 20 },
  subtitle: { color: Colors.textLight, marginBottom: 20, fontWeight: '600' },
  rowCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', padding: 16, borderRadius: 16, marginBottom: 15, borderWidth: 1, borderColor: '#F3F4F6', shadowColor: "#000", shadowOpacity: 0.02, shadowRadius: 5, elevation: 1 },
  iconBox: { width: 50, height: 50, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: Colors.text },
  cardSubtitle: { fontSize: 12, color: Colors.textLight, marginTop: 2 }
});