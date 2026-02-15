import { useUser } from "@clerk/clerk-expo";
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useMutation, useQuery } from "convex/react";
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { api } from "../../convex/_generated/api";
import Colors from '../constants/Colors';

// Liste des allergies communes
const COMMON_ALLERGIES = [
  "Lactose", "Gluten", "Fruits à coque", "Œufs", 
  "Poisson", "Soja", "Crustacés", "Arachides"
];

const MOTIVATIONS = [
  { id: "health", label: "Santé", icon: "heart-pulse" },
  { id: "aesthetics", label: "Esthétique", icon: "medal" },
  { id: "performance", label: "Performance", icon: "weight-lifter" },
  { id: "lifestyle", label: "Lifestyle", icon: "yoga" }
];

export default function EditProfileInfoScreen({ navigation }) {
  const { user } = useUser();
  const userData = useQuery(api.users.checkUser);
  const updateUser = useMutation(api.users.updateUserData);
const updateProfileAndGoals = useMutation(api.users.updateWeightAndGoals);
  const [formData, setFormData] = useState({
    name: userData?.name || "",
    age: userData?.age?.toString() || "",
    weight: userData?.weight?.toString() || "",
    height: userData?.height?.toString() || "",
    sleepHours: userData?.sleepHours?.toString() || "7",
    bedTime: userData?.bedTime || "23:00",
    wakeTime: userData?.wakeTime || "07:00",
    allergies: userData?.allergies || [],
    motivation: userData?.motivation || ""
  });

  const [loading, setLoading] = useState(false);

  if (!userData) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </SafeAreaView>
    );
  }

  const updateForm = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const toggleAllergy = (allergy) => {
    if (formData.allergies.includes(allergy)) {
      updateForm("allergies", formData.allergies.filter(a => a !== allergy));
    } else {
      updateForm("allergies", [...formData.allergies, allergy]);
    }
  };

  const handleSave = async () => {
  setLoading(true);
  try {
    // 1️⃣ Sauvegarder les infos de base
    await updateUser({
      name: formData.name,
      sleepHours: parseFloat(formData.sleepHours) || 7,
      bedTime: formData.bedTime,
      wakeTime: formData.wakeTime,
      allergies: formData.allergies,
      motivation: formData.motivation
    });

    // 2️⃣ Si poids, âge ou taille ont changé → RECALCULER LE PLAN
    const weightChanged = parseFloat(formData.weight) !== userData.weight;
    const heightChanged = parseInt(formData.height) !== userData.height;
    const ageChanged = parseInt(formData.age) !== userData.age;

    if (weightChanged || heightChanged || ageChanged) {
      await updateProfileAndGoals({
        newWeight: parseFloat(formData.weight) || userData.weight,
        newHeight: parseInt(formData.height) || userData.height,
        newAge: parseInt(formData.age) || userData.age,
        newGoal: userData.primaryGoal || userData.goal,
        newActivity: userData.activityLevel,
        newDifficulty: userData.difficulty
      });
      Alert.alert("✅ Plan recalculé !", "Tes infos et ton plan nutritionnel ont été mis à jour !");
    } else {
      Alert.alert("✅ Sauvegardé", "Tes informations ont été mises à jour !");
    }

    navigation.goBack();
  } catch (error) {
    console.error(error);
    Alert.alert("Erreur", "Impossible de sauvegarder");
  } finally {
    setLoading(false);
  }
};

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"} 
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Mes Infos</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          
          {/* Photo de profil */}
          <View style={styles.profileSection}>
            <Image 
              source={{ uri: user?.imageUrl || "https://via.placeholder.com/100" }} 
              style={styles.profileImage}
            />
            <Text style={styles.userName}>{formData.name}</Text>
            <Text style={styles.userEmail}>{user?.primaryEmailAddress?.emailAddress}</Text>
          </View>

          {/* Infos de base */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>📋 Informations de base</Text>
            
            <InputField 
              label="Prénom / Surnom" 
              value={formData.name}
              onChange={(t) => updateForm("name", t)}
              placeholder="Alex"
            />

            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <InputField 
                  label="Âge" 
                  value={formData.age}
                  onChange={(t) => updateForm("age", t)}
                  placeholder="25"
                  keyboardType="numeric"
                />
              </View>
              <View style={{ flex: 1 }}>
                <InputField 
                  label="Poids (kg)" 
                  value={formData.weight}
                  onChange={(t) => updateForm("weight", t)}
                  placeholder="75"
                  keyboardType="numeric"
                />
              </View>
              <View style={{ flex: 1 }}>
                <InputField 
                  label="Taille (cm)" 
                  value={formData.height}
                  onChange={(t) => updateForm("height", t)}
                  placeholder="180"
                  keyboardType="numeric"
                />
              </View>
            </View>
          </View>

          {/* Sommeil */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>😴 Sommeil</Text>
            
            <InputField 
              label="Heures de sommeil / nuit" 
              value={formData.sleepHours}
              onChange={(t) => updateForm("sleepHours", t)}
              placeholder="7"
              keyboardType="numeric"
            />

            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <InputField 
                  label="Coucher (ex: 23:00)" 
                  value={formData.bedTime}
                  onChange={(t) => updateForm("bedTime", t)}
                  placeholder="23:00"
                />
              </View>
              <View style={{ flex: 1 }}>
                <InputField 
                  label="Lever (ex: 07:00)" 
                  value={formData.wakeTime}
                  onChange={(t) => updateForm("wakeTime", t)}
                  placeholder="07:00"
                />
              </View>
            </View>
          </View>

          {/* Allergies */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>🚫 Allergies / Intolérances</Text>
            <View style={styles.chipsWrap}>
              {COMMON_ALLERGIES.map((allergy) => (
                <TouchableOpacity
                  key={allergy}
                  onPress={() => toggleAllergy(allergy)}
                  style={[
                    styles.allergyChip,
                    formData.allergies.includes(allergy) && styles.allergyChipActive
                  ]}
                >
                  <Text style={[
                    styles.allergyChipText,
                    formData.allergies.includes(allergy) && styles.allergyChipTextActive
                  ]}>
                    {allergy}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Motivation */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>🎯 Motivation principale</Text>
            {MOTIVATIONS.map((m) => (
              <TouchableOpacity
                key={m.id}
                onPress={() => updateForm("motivation", m.id)}
                style={[
                  styles.motivationCard,
                  formData.motivation === m.id && styles.motivationCardActive
                ]}
              >
                <MaterialCommunityIcons 
                  name={m.icon} 
                  size={22} 
                  color={formData.motivation === m.id ? Colors.primary : Colors.textLight} 
                />
                <Text style={[
                  styles.motivationText,
                  formData.motivation === m.id && styles.motivationTextActive
                ]}>
                  {m.label}
                </Text>
                {formData.motivation === m.id && (
                  <Ionicons name="checkmark-circle" size={22} color={Colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* Boutons de navigation vers autres écrans */}
          <View style={styles.navButtons}>
            <TouchableOpacity 
              style={styles.navButton}
              onPress={() => navigation.navigate('EditGoals')}
            >
              <MaterialCommunityIcons name="target" size={24} color={Colors.primary} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.navButtonTitle}>Objectifs</Text>
                <Text style={styles.navButtonSubtitle}>Objectifs, difficulté, poids cible</Text>
              </View>
              <Ionicons name="chevron-forward" size={22} color={Colors.textLight} />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.navButton}
              onPress={() => navigation.navigate('EditActivities')}
            >
              <MaterialCommunityIcons name="dumbbell" size={24} color={Colors.primary} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.navButtonTitle}>Sport & Activité</Text>
                <Text style={styles.navButtonSubtitle}>Activité, sports, performances</Text>
              </View>
              <Ionicons name="chevron-forward" size={22} color={Colors.textLight} />
            </TouchableOpacity>
          </View>

        </ScrollView>

        {/* Footer avec bouton Save */}
        <View style={styles.footer}>
          <TouchableOpacity 
            style={styles.saveButton}
            onPress={handleSave}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.saveButtonText}>Sauvegarder</Text>
            )}
          </TouchableOpacity>
        </View>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const InputField = ({ label, value, onChange, placeholder, keyboardType = "default" }) => (
  <View style={styles.inputContainer}>
    <Text style={styles.inputLabel}>{label}</Text>
    <TextInput
      style={styles.input}
      value={value}
      onChangeText={onChange}
      placeholder={placeholder}
      keyboardType={keyboardType}
      placeholderTextColor="#9CA3AF"
    />
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    padding: 20, 
    alignItems: 'center',
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0'
  },
  backBtn: { padding: 5 },
  title: { fontSize: 18, fontWeight: 'bold', color: Colors.text },
  content: { padding: 20, paddingBottom: 100 },

  profileSection: { 
    alignItems: 'center', 
    marginBottom: 24,
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 16
  },
  profileImage: { 
    width: 80, 
    height: 80, 
    borderRadius: 40, 
    marginBottom: 12 
  },
  userName: { 
    fontSize: 20, 
    fontWeight: 'bold', 
    color: Colors.text 
  },
  userEmail: { 
    fontSize: 14, 
    color: Colors.textLight, 
    marginTop: 4 
  },

  card: { 
    backgroundColor: 'white', 
    borderRadius: 16, 
    padding: 16, 
    marginBottom: 16 
  },
  cardTitle: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    color: Colors.text, 
    marginBottom: 16 
  },

  row: { flexDirection: 'row', gap: 10 },
  inputContainer: { marginBottom: 16 },
  inputLabel: { 
    fontSize: 12, 
    fontWeight: '700', 
    color: Colors.textLight, 
    marginBottom: 8 
  },
  input: {
    backgroundColor: '#F9FAFB',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 12,
    fontSize: 16,
    color: Colors.text,
    borderWidth: 1,
    borderColor: '#E5E7EB'
  },

  chipsWrap: { 
    flexDirection: 'row', 
    flexWrap: 'wrap' 
  },
  allergyChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E6E9EF'
  },
  allergyChipActive: { 
    backgroundColor: Colors.primary, 
    borderColor: Colors.primary 
  },
  allergyChipText: { 
    fontSize: 13, 
    fontWeight: '800', 
    color: Colors.textLight 
  },
  allergyChipTextActive: { color: 'white' },

  motivationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB'
  },
  motivationCardActive: {
    backgroundColor: Colors.primary + '10',
    borderColor: Colors.primary
  },
  motivationText: { 
    flex: 1, 
    marginLeft: 12, 
    fontSize: 15, 
    fontWeight: '700', 
    color: Colors.textLight 
  },
  motivationTextActive: { color: Colors.primary },

  navButtons: { marginTop: 10 },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB'
  },
  navButtonTitle: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    color: Colors.text 
  },
  navButtonSubtitle: { 
    fontSize: 13, 
    color: Colors.textLight, 
    marginTop: 2 
  },

  footer: { 
    padding: 16, 
    backgroundColor: 'white', 
    borderTopWidth: 1, 
    borderTopColor: '#F0F0F0' 
  },
  saveButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center'
  },
  saveButtonText: { 
    color: 'white', 
    fontSize: 16, 
    fontWeight: 'bold' 
  }
});