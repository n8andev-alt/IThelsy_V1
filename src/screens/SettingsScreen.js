import { useAuth } from "@clerk/clerk-expo";
import { Ionicons } from '@expo/vector-icons';
import { useMutation } from "convex/react";
import { Alert, Linking, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { api } from "../../convex/_generated/api";
import Colors from '../constants/Colors';

export default function SettingsScreen({ navigation }) {
  const { signOut } = useAuth();

  const deleteAccountMutation = useMutation(api.users.deleteAccount);

  const handleLogout = () => {
    Alert.alert("Se déconnecter", "Veux-tu vraiment te déconnecter ?", [
        { text: "Annuler", style: "cancel" },
        { text: "Se déconnecter", style: "destructive", onPress: () => signOut() }
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Supprimer mon compte ?",
      "Attention, cette action est irréversible. Toutes tes données seront effacées.\n\n⚠️ Important : Cela n'annule pas ton abonnement Apple/Google. Tu dois le faire manuellement dans les réglages de ton téléphone.",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer définitivement",
          style: "destructive",
          onPress: async () => {
            try {
                await deleteAccountMutation();
                await signOut();
            } catch (error) {
                Alert.alert("Erreur", "Impossible de supprimer le compte.");
            }
          }
        }
      ]
    );
  };

  const contactSupport = () => Linking.openURL('mailto:ithelsy.contact@gmail.com');

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Paramètres</Text>
        <View style={{width: 24}} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>

        <Text style={styles.sectionTitle}>Préférences</Text>
        <SettingRow
            icon="notifications-outline"
            title="Notifications"
            color="#F59E0B"
            onPress={() => Linking.openSettings()}
        />

        <Text style={styles.sectionTitle}>Support & Légal</Text>
        <SettingRow 
            icon="star-outline" 
            title="Noter l'application" 
            color="#EC4899" 
            onPress={() => Alert.alert("Merci !", "La page du store s'ouvrira ici.")} 
        />
        <SettingRow 
            icon="help-circle-outline" 
            title="Aide & FAQ" 
            color={Colors.secondary} 
            onPress={() => navigation.navigate('FAQ')} 
        />
        <SettingRow 
            icon="mail-outline" 
            title="Contacter le support" 
            color={Colors.secondary} 
            onPress={contactSupport} 
        />
        <SettingRow 
            icon="document-text-outline" 
            title="Conditions Générales" 
            color={Colors.text} 
            onPress={() => navigation.navigate('Terms')} 
        />
        <SettingRow 
            icon="lock-closed-outline" 
            title="Confidentialité" 
            color={Colors.text} 
            onPress={() => navigation.navigate('Privacy')} 
        />

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Text style={styles.logoutText}>Se déconnecter</Text>
            <Ionicons name="log-out-outline" size={20} color="#EF4444" style={{marginLeft: 10}} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.deleteBtn} onPress={handleDeleteAccount}>
            <Text style={styles.deleteText}>Supprimer mon compte</Text>
        </TouchableOpacity>

        <Text style={styles.version}>Version 1.0.0 • IThelsy</Text>
        <View style={{height: 40}} />
      </ScrollView>

    </SafeAreaView>
  );
}

const SettingRow = ({ icon, title, value, color, onPress }) => (
    <TouchableOpacity style={styles.row} onPress={onPress}>
        <View style={[styles.iconBox, { backgroundColor: color + '15' }]}>
            <Ionicons name={icon} size={22} color={color} />
        </View>
        <Text style={styles.rowTitle}>{title}</Text>
        {value && <Text style={styles.rowValue}>{value}</Text>}
        <Ionicons name="chevron-forward" size={20} color={Colors.textLight} />
    </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white' },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  backBtn: { padding: 5 },
  title: { fontSize: 18, fontWeight: 'bold', color: Colors.text },
  content: { padding: 20 },
  sectionTitle: { fontSize: 13, fontWeight: '800', color: Colors.textLight, marginBottom: 15, marginTop: 10, textTransform: 'uppercase', letterSpacing: 1 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, marginBottom: 5 },
  iconBox: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  rowTitle: { flex: 1, fontSize: 16, color: Colors.text, fontWeight: '500' },
  rowValue: { fontSize: 14, color: Colors.textLight, marginRight: 10 },
  
  logoutBtn: { marginTop: 30, backgroundColor: '#F9FAFB', padding: 18, borderRadius: 16, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', borderWidth: 1, borderColor: '#E5E7EB' },
  logoutText: { color: '#EF4444', fontWeight: 'bold', fontSize: 16 },
  
  deleteBtn: { marginTop: 15, padding: 10, alignItems: 'center' },
  deleteText: { color: '#9CA3AF', fontSize: 13, textDecorationLine: 'underline' },

  version: { textAlign: 'center', color: Colors.textLight, marginTop: 10, fontSize: 12 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '85%', backgroundColor: 'white', borderRadius: 24, padding: 25, shadowColor: "#000", shadowOpacity: 0.25, shadowRadius: 10, elevation: 10 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, color: Colors.text, textAlign: 'center' },
  optionRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  optionText: { fontSize: 16, color: Colors.text }
});