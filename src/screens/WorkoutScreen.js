import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Colors from '../constants/Colors'; // <--- IMPORT SIMPLE

export default function WorkoutScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>Entraînement</Text>
              <Text style={styles.headerSubtitle}>Programme : PPL</Text>
            </View>
            <TouchableOpacity style={styles.streakBadge}>
              <MaterialCommunityIcons name="fire" size={20} color="#F59E0B" />
              <Text style={styles.streakText}> 3</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.sectionTitle}>Mes séances</Text>
          <SessionCard title="Push Day A" subtitle="Pecs, Épaules" duration="60 min" kcal="450" />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const SessionCard = ({ title, subtitle, duration, kcal }) => (
  <TouchableOpacity style={styles.sessionCard}>
    <View>
      <Text style={styles.sessionTitle}>{title}</Text>
      <Text style={styles.sessionSubtitle}>{subtitle}</Text>
    </View>
    <Ionicons name="play" size={24} color={Colors.primary} />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25 },
  headerTitle: { fontSize: 28, fontWeight: '800', color: Colors.text },
  headerSubtitle: { fontSize: 14, color: Colors.textLight },
  streakBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF7ED', padding: 8, borderRadius: 20 },
  streakText: { fontWeight: 'bold', color: '#F59E0B' },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: Colors.text, marginBottom: 15 },
  sessionCard: { flexDirection:'row', justifyContent:'space-between', alignItems:'center', backgroundColor: Colors.white, padding: 20, borderRadius: 16, marginBottom: 15 },
  sessionTitle: { fontSize: 16, fontWeight: 'bold', color: Colors.text },
  sessionSubtitle: { fontSize: 12, color: Colors.textLight }
});