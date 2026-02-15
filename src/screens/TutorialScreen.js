import { Ionicons } from '@expo/vector-icons';
import { useRef, useState } from 'react';
import { Dimensions, FlatList, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Colors from '../constants/Colors'; // Assure-toi que le chemin est bon vers tes couleurs

const { width } = Dimensions.get('window');

const SLIDES = [
  {
    id: '1',
    title: "Nutrition IA",
    description: "Ne compte plus tes calories à la main. On le fait à ta place instantanément.",
    icon: "scan-circle",
    color: "#10B981"
  },
  {
    id: '2',
    title: "Mode GymBro",
    description: "Associe-toi avec un pote et motivez vous mutuellement !",
    icon: "people",
    color: "#4F46E5"
  },
  {
    id: '3',
    title: "Résultats Rapides",
    description: "Un plan sur-mesure qui s'adapte à ton métabolisme chaque semaine. Fini la stagnation.",
    icon: "trophy",
    color: "#F59E0B"
  }
];

export default function TutorialScreen({ onDone }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef(null);

  const handleNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current.scrollToIndex({ index: currentIndex + 1 });
    } else {
      onDone(); // Fin du tuto -> On lance la création de profil
    }
  };

  const handleSkip = () => {
    onDone();
  };

  return (
    <SafeAreaView style={styles.container}>
      
      {/* BOUTON PASSER */}
      <TouchableOpacity onPress={handleSkip} style={styles.skipBtn}>
        <Text style={styles.skipText}>Passer</Text>
      </TouchableOpacity>

      {/* SLIDER */}
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        onScroll={(e) => {
          const x = e.nativeEvent.contentOffset.x;
          // Petit calcul pour savoir sur quelle slide on est
          setCurrentIndex(Math.round(x / width));
        }}
        renderItem={({ item }) => (
          <View style={styles.slide}>
            <View style={[styles.iconCircle, { backgroundColor: item.color + '15' }]}>
                <Ionicons name={item.icon} size={80} color={item.color} />
            </View>
            <Text style={[styles.title, { color: item.color }]}>{item.title}</Text>
            <Text style={styles.desc}>{item.description}</Text>
          </View>
        )}
      />

      {/* FOOTER */}
      <View style={styles.footer}>
        
        {/* Points de pagination */}
        <View style={styles.pagination}>
          {SLIDES.map((_, index) => (
            <View 
                key={index} 
                style={[
                    styles.dot, 
                    currentIndex === index ? { backgroundColor: Colors.primary, width: 20 } : { backgroundColor: '#E5E7EB' }
                ]} 
            />
          ))}
        </View>

        {/* Bouton Suivant */}
        <TouchableOpacity style={styles.btn} onPress={handleNext}>
            <Text style={styles.btnText}>
                {currentIndex === SLIDES.length - 1 ? "C'est parti ! 🚀" : "Suivant"}
            </Text>
        </TouchableOpacity>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white' },
  skipBtn: { alignSelf: 'flex-end', padding: 20, marginTop: 10 },
  skipText: { color: '#9CA3AF', fontWeight: '600', fontSize: 16 },
  
  slide: { width: width, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  iconCircle: { width: 160, height: 160, borderRadius: 80, justifyContent: 'center', alignItems: 'center', marginBottom: 40 },
  title: { fontSize: 32, fontWeight: '900', marginBottom: 15, textAlign: 'center' },
  desc: { fontSize: 17, color: '#6B7280', textAlign: 'center', lineHeight: 26, paddingHorizontal: 10 },

  footer: { padding: 30, paddingBottom: 50 },
  pagination: { flexDirection: 'row', justifyContent: 'center', marginBottom: 30 },
  dot: { height: 8, width: 8, borderRadius: 4, marginHorizontal: 4 },
  
  btn: { backgroundColor: Colors.primary, paddingVertical: 18, borderRadius: 30, alignItems: 'center', shadowColor: Colors.primary, shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 },
  btnText: { color: 'white', fontSize: 18, fontWeight: 'bold' }
});