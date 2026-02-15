import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery } from "convex/react";
import { useState } from 'react';
import { ActivityIndicator, Alert, Clipboard, KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { api } from "../../convex/_generated/api";
import Colors from '../constants/Colors';

export default function GymBroScreen({ navigation }) {
  const [friendCode, setFriendCode] = useState('');
  const [loading, setLoading] = useState(false);

  const userData = useQuery(api.users.checkUser);
  const gymBroData = useQuery(api.users.getUserById, userData?.gymBroId ? { userId: userData.gymBroId } : "skip");
  const linkGymBro = useMutation(api.gymBro.linkGymBro);
  const unlinkGymBro = useMutation(api.gymBro.unlinkGymBro);

  const handleLinkGymBro = async () => {
    if (!friendCode || friendCode.length !== 6) {
      Alert.alert('Erreur', 'Code invalide. Le code doit contenir 6 caractères.');
      return;
    }

    try {
      setLoading(true);
      await linkGymBro({ gymBroCode: friendCode.toUpperCase() });
      Alert.alert('✅ GymBro lié !', 'Vous êtes maintenant connectés. Motivez-vous mutuellement ! 💪');
      setFriendCode('');
    } catch (error) {
      Alert.alert('Erreur', error.message || 'Impossible de lier le GymBro.');
    } finally {
      setLoading(false);
    }
  };

  const handleUnlink = () => {
    Alert.alert(
      'Délier GymBro',
      'Êtes-vous sûr de vouloir vous délier ? Vous pourrez vous reconnecter plus tard.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Délier',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await unlinkGymBro({});
              Alert.alert('✅ Délié', 'Vous n\'êtes plus connectés.');
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de délier.');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  // 🔥 Copier le code
  const handleCopyCode = () => {
    if (userData?.gymBroCode) {
      Clipboard.setString(userData.gymBroCode);
      Alert.alert('✅ Copié !', 'Ton code a été copié dans le presse-papier');
    }
  };

  if (!userData) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mode Duo 💪</Text>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView 
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >

        {userData.gymBroId && gymBroData ? (
          // 🔥 DÉJÀ LIÉ
          <View style={styles.linkedCard}>
            <View style={styles.linkedHeader}>
              <Ionicons name="people" size={40} color={Colors.primary} />
              <Text style={styles.linkedTitle}>Mode Duo actif !</Text>
            </View>

            <View style={styles.gymBroInfo}>
              <Text style={styles.gymBroName}>{gymBroData.name}</Text>
              <Text style={styles.gymBroEmail}>{gymBroData.email}</Text>
            </View>

            <View style={styles.progressSection}>
              <Text style={styles.progressTitle}>Progression cette semaine</Text>
              
              <ProgressBar label="Toi" days={userData.streakNutrition || 0} />
              <ProgressBar label={gymBroData.name} days={gymBroData.streakNutrition || 0} />
            </View>

            <TouchableOpacity style={styles.unlinkBtn} onPress={handleUnlink}>
              <Ionicons name="unlink" size={20} color={Colors.danger} />
              <Text style={styles.unlinkText}>Se délier</Text>
            </TouchableOpacity>
          </View>
        ) : (
          // 🔥 PAS ENCORE LIÉ
          <View style={styles.linkCard}>
            <View style={styles.infoCard}>
              <Ionicons name="information-circle" size={24} color={Colors.primary} />
              <Text style={styles.infoText}>
                Liez-vous avec un ami pour suivre vos progressions ensemble et vous motiver mutuellement !
              </Text>
            </View>

            <View style={styles.codeSection}>
              <Text style={styles.label}>Ton code GymBro</Text>
              <View style={styles.codeBox}>
                <Text style={styles.codeText}>{userData.gymBroCode}</Text>
                <TouchableOpacity onPress={handleCopyCode} style={styles.copyButton}>
                  <Ionicons name="copy-outline" size={24} color={Colors.primary} />
                </TouchableOpacity>
              </View>
              <Text style={styles.codeHint}>Partage ce code avec ton ami (Messages, WhatsApp, etc.)</Text>
            </View>

            <View style={styles.separator}>
              <View style={styles.line} />
              <Text style={styles.separatorText}>OU</Text>
              <View style={styles.line} />
            </View>

            <View style={styles.inputSection}>
              <Text style={styles.label}>Entre le code de ton ami</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: ABC123"
                value={friendCode}
                onChangeText={(text) => setFriendCode(text.toUpperCase())}
                maxLength={6}
                autoCapitalize="characters"
              />
              <TouchableOpacity 
                style={[styles.linkButton, loading && styles.linkButtonDisabled]} 
                onPress={handleLinkGymBro}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.linkButtonText}>Se lier</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const ProgressBar = ({ label, days }) => (
  <View style={styles.progressBar}>
    <Text style={styles.progressLabel}>{label}</Text>
    <View style={styles.barContainer}>
      {[...Array(7)].map((_, i) => (
        <View key={i} style={[styles.barSegment, i < days && styles.barSegmentFilled]} />
      ))}
    </View>
    <Text style={styles.progressDays}>{days}/7</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
  backBtn: { padding: 8, backgroundColor: 'white', borderRadius: 12 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: Colors.text },
  content: { padding: 20, paddingBottom: 100 },

  linkedCard: { backgroundColor: 'white', borderRadius: 20, padding: 24, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
  linkedHeader: { alignItems: 'center', marginBottom: 20 },
  linkedTitle: { fontSize: 20, fontWeight: 'bold', color: Colors.text, marginTop: 10 },
  gymBroInfo: { alignItems: 'center', marginBottom: 30, padding: 16, backgroundColor: '#F8F9FA', borderRadius: 12 },
  gymBroName: { fontSize: 18, fontWeight: 'bold', color: Colors.text },
  gymBroEmail: { fontSize: 14, color: Colors.textLight, marginTop: 4 },
  progressSection: { marginBottom: 20 },
  progressTitle: { fontSize: 16, fontWeight: 'bold', color: Colors.text, marginBottom: 16 },
  progressBar: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  progressLabel: { fontSize: 14, color: Colors.text, width: 80, fontWeight: '500' },
  barContainer: { flex: 1, flexDirection: 'row', gap: 4, marginHorizontal: 10 },
  barSegment: { flex: 1, height: 8, backgroundColor: '#E5E7EB', borderRadius: 4 },
  barSegmentFilled: { backgroundColor: Colors.primary },
  progressDays: { fontSize: 14, color: Colors.textLight, fontWeight: 'bold', width: 40, textAlign: 'right' },
  unlinkBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 12, gap: 8, marginTop: 10 },
  unlinkText: { color: Colors.danger, fontSize: 14, fontWeight: '600' },

  linkCard: { backgroundColor: 'white', borderRadius: 20, padding: 24, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
  infoCard: { flexDirection: 'row', backgroundColor: '#EFF6FF', padding: 16, borderRadius: 12, marginBottom: 24, gap: 12 },
  infoText: { flex: 1, fontSize: 13, color: '#1E40AF', lineHeight: 18 },
  codeSection: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: 'bold', color: Colors.text, marginBottom: 8 },
  codeBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#F8F9FA', padding: 20, borderRadius: 12, borderWidth: 2, borderColor: '#E5E7EB' },
  codeText: { fontSize: 28, fontWeight: 'bold', color: Colors.primary, letterSpacing: 6 },
  copyButton: { padding: 8, backgroundColor: 'white', borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB' },
  codeHint: { fontSize: 12, color: Colors.textLight, textAlign: 'center', marginTop: 8 },
  separator: { flexDirection: 'row', alignItems: 'center', marginVertical: 24 },
  line: { flex: 1, height: 1, backgroundColor: '#E5E7EB' },
  separatorText: { marginHorizontal: 16, fontSize: 12, color: Colors.textLight, fontWeight: 'bold' },
  inputSection: { marginTop: 4 },
  input: { backgroundColor: '#F8F9FA', padding: 16, borderRadius: 12, fontSize: 16, fontWeight: 'bold', letterSpacing: 2, textAlign: 'center', borderWidth: 2, borderColor: '#E5E7EB', marginBottom: 16 },
  linkButton: { backgroundColor: Colors.primary, padding: 16, borderRadius: 30, alignItems: 'center' },
  linkButtonDisabled: { opacity: 0.5 },
  linkButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
});