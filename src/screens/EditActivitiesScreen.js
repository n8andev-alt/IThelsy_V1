import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useMutation, useQuery } from "convex/react";
import { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
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

// 🏋️ LISTE DES SPORTS
const SPORTS_LIST = [
  { id: "musculation", name: "Musculation / Bodybuilding", icon: "dumbbell" },
  { id: "crossfit", name: "CrossFit", icon: "run" },
  { id: "powerlifting", name: "Powerlifting", icon: "dumbbell" },
  { id: "calisthenics", name: "Calisthenics", icon: "human-handsup" },
  { id: "boxe", name: "Boxe", icon: "boxing-glove" },
  { id: "mma", name: "MMA", icon: "karate" },
  { id: "course", name: "Course à pied", icon: "run" },
  { id: "cyclisme", name: "Cyclisme", icon: "bike" },
  { id: "natation", name: "Natation", icon: "swim" },
  { id: "football", name: "Football", icon: "soccer" },
  { id: "basketball", name: "Basketball", icon: "basketball" },
  { id: "yoga", name: "Yoga", icon: "yoga" },
  { id: "tennis", name: "Tennis", icon: "tennis" },
  { id: "autre", name: "Autre", icon: "dots-horizontal" },
];

export default function EditActivitiesScreen({ navigation }) {
  const userData = useQuery(api.users.checkUser);
  const updateProfileAndGoals = useMutation(api.users.updateWeightAndGoals);
  const updateUserData = useMutation(api.users.updateUserData);

  const [formData, setFormData] = useState({
    activityLevel: userData?.activityLevel || "moderate",
    sports: userData?.sports || [],
    performances: userData?.performances || {}
  });

  const [searchSport, setSearchSport] = useState("");
  const [customSportName, setCustomSportName] = useState("");
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

  const updatePerformance = (key, value) => {
    setFormData(prev => ({
      ...prev,
      performances: {
        ...prev.performances,
        [key]: value
      }
    }));
  };

  const addSport = (sport) => {
    if (formData.sports.find((s) => s.id === sport.id)) {
      Alert.alert("Déjà ajouté", "Ce sport est déjà dans ta liste !");
      return;
    }
    const newSport = { id: sport.id, name: sport.name, frequency: "3", level: "intermediate" };
    updateForm("sports", [...formData.sports, newSport]);
    setSearchSport("");
  };

  const removeSport = (sportId) => {
    updateForm("sports", formData.sports.filter((s) => s.id !== sportId));
  };

  const updateSportDetail = (sportId, key, value) => {
    updateForm(
      "sports",
      formData.sports.map((s) => (s.id === sportId ? { ...s, [key]: value } : s))
    );
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // 1. Sauvegarde les sports et performances
      const cleanPerformances = {};
      Object.keys(formData.performances).forEach(key => {
        const val = formData.performances[key];
        if (val && val !== "") {
          cleanPerformances[key] = parseFloat(val.toString().replace(",", "."));
        }
      });

      await updateUserData({
        sports: formData.sports,
        performances: cleanPerformances
      });

      // 2. Recalcul complet du plan avec le nouveau niveau d'activité
      await updateProfileAndGoals({
        newWeight: userData.weight,
        newHeight: userData.height,
        newAge: userData.age,
        newGoal: userData.primaryGoal || userData.goal,
        newActivity: formData.activityLevel,
        newDifficulty: userData.difficulty
      });

      Alert.alert(
        "✅ Plan mis à jour !", 
        "Tes activités ont été sauvegardées et ton plan nutritionnel a été recalculé !"
      );
      navigation.goBack();
    } catch (error) {
      console.error(error);
      Alert.alert("Erreur", "Impossible de sauvegarder");
    } finally {
      setLoading(false);
    }
  };

  const filteredSports = SPORTS_LIST.filter((s) => 
    s.name.toLowerCase().includes(searchSport.toLowerCase())
  );

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
          <Text style={styles.title}>Sport & Activité</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          
          {/* Activité Quotidienne */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>🚶 Activité Quotidienne</Text>
            <Text style={styles.cardSubtitle}>En dehors du sport</Text>
            
            <ActivityCard
              title="Sédentaire"
              subtitle="Bureau, peu de déplacements"
              icon="seat-recline-normal"
              color="#9CA3AF"
              selected={formData.activityLevel === "sedentary"}
              onPress={() => updateForm("activityLevel", "sedentary")}
            />
            <ActivityCard
              title="Légèrement actif"
              subtitle="Déplacements réguliers"
              icon="walk"
              color="#10B981"
              selected={formData.activityLevel === "light"}
              onPress={() => updateForm("activityLevel", "light")}
            />
            <ActivityCard
              title="Modérément actif"
              subtitle="Debout souvent, actif"
              icon="run"
              color="#3B82F6"
              selected={formData.activityLevel === "moderate"}
              onPress={() => updateForm("activityLevel", "moderate")}
            />
            <ActivityCard
              title="Très actif"
              subtitle="Travail physique"
              icon="weight-lifter"
              color="#F59E0B"
              selected={formData.activityLevel === "active"}
              onPress={() => updateForm("activityLevel", "active")}
            />
          </View>

          {/* Mes Sports */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>🏋️ Mes Sports</Text>
            <Text style={styles.cardSubtitle}>Quels sports pratiques-tu ?</Text>
            
            {/* Barre de recherche */}
            <View style={styles.searchBar}>
              <Ionicons name="search" size={18} color={Colors.textLight} />
              <TextInput
                style={styles.searchInput}
                placeholder="Rechercher un sport..."
                value={searchSport}
                onChangeText={setSearchSport}
                placeholderTextColor="#9CA3AF"
              />
              {searchSport.length > 0 && (
                <TouchableOpacity onPress={() => setSearchSport("")}>
                  <Ionicons name="close" size={18} color={Colors.textLight} />
                </TouchableOpacity>
              )}
            </View>

            {/* Sports ajoutés */}
            {formData.sports.length > 0 && (
              <View style={{ marginTop: 10, marginBottom: 16 }}>
                <Text style={styles.subLabel}>✅ Mes sports ({formData.sports.length})</Text>
                {formData.sports.map((sport) => (
                  <View key={sport.id} style={styles.addedSportCard}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.addedSportName}>{sport.name}</Text>

                      <View style={styles.miniRow}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.miniLabel}>Fréquence / sem</Text>
                          <TextInput
                            style={styles.miniInput}
                            value={sport.frequency}
                            onChangeText={(v) => updateSportDetail(sport.id, "frequency", v)}
                            keyboardType="numeric"
                            placeholder="3"
                            placeholderTextColor="#9CA3AF"
                          />
                        </View>

                        <View style={{ flex: 1 }}>
                          <Text style={styles.miniLabel}>Niveau</Text>
                          <View style={styles.levelRow}>
                            {["beginner", "intermediate", "advanced"].map((lvl) => (
                              <TouchableOpacity
                                key={lvl}
                                onPress={() => updateSportDetail(sport.id, "level", lvl)}
                                style={[
                                  styles.levelBtn,
                                  sport.level === lvl && styles.levelBtnActive
                                ]}
                              >
                                <Text style={[
                                  styles.levelBtnText,
                                  sport.level === lvl && styles.levelBtnTextActive
                                ]}>
                                  {lvl === "beginner" ? "D" : lvl === "intermediate" ? "I" : "A"}
                                </Text>
                              </TouchableOpacity>
                            ))}
                          </View>
                        </View>
                      </View>
                    </View>

                    <TouchableOpacity onPress={() => removeSport(sport.id)} style={styles.removeSportBtn}>
                      <Ionicons name="trash-outline" size={20} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {/* Liste des sports disponibles */}
            {searchSport.length > 0 && (
              <View>
                <Text style={styles.subLabel}>➕ Ajouter un sport</Text>

                {filteredSports.slice(0, 5).map((sport) => (
                  <TouchableOpacity 
                    key={sport.id} 
                    style={styles.sportOption} 
                    onPress={() => addSport(sport)}
                  >
                    <View style={styles.sportLeft}>
                      <View style={styles.sportIconWrap}>
                        <MaterialCommunityIcons name={sport.icon} size={22} color={Colors.primary} />
                      </View>
                      <Text style={styles.sportOptionText}>{sport.name}</Text>
                    </View>
                    <Ionicons name="add-circle" size={22} color={Colors.primary} />
                  </TouchableOpacity>
                ))}

                {filteredSports.length === 0 && (
                  <View style={styles.sportOption}>
                    <View style={styles.sportLeft}>
                      <View style={[styles.sportIconWrap, { backgroundColor: "#F3F4F6" }]}>
                        <MaterialCommunityIcons name="dots-horizontal" size={22} color={Colors.textLight} />
                      </View>
                      <TextInput
                        style={styles.customSportInput}
                        placeholder="Nom de ton sport..."
                        value={customSportName}
                        onChangeText={setCustomSportName}
                        placeholderTextColor="#9CA3AF"
                      />
                    </View>
                    <TouchableOpacity
                      onPress={() => {
                        if (customSportName.trim()) {
                          addSport({ 
                            id: Date.now().toString(), 
                            name: customSportName, 
                            icon: "run" 
                          });
                          setCustomSportName("");
                          setSearchSport("");
                        }
                      }}
                    >
                      <Ionicons name="add-circle" size={22} color={Colors.primary} />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}

            {formData.sports.length === 0 && searchSport.length === 0 && (
              <Text style={styles.helperText}>
                Utilise la recherche pour ajouter tes sports 👆
              </Text>
            )}
          </View>

          {/* Performances */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>🏆 Mes Performances</Text>
            <Text style={styles.cardSubtitle}>Optionnel - pour un plan encore plus précis</Text>
            
            <Text style={styles.perfSectionTitle}>🏋️ Force (en kg)</Text>
            <View style={styles.row}>
              <InputField 
                label="Squat" 
                value={formData.performances.squat?.toString() || ""}
                onChange={(t) => updatePerformance("squat", t)}
                placeholder="100"
                keyboardType="numeric"
              />
              <InputField 
                label="Bench Press" 
                value={formData.performances.benchPress?.toString() || ""}
                onChange={(t) => updatePerformance("benchPress", t)}
                placeholder="80"
                keyboardType="numeric"
              />
              <InputField 
                label="Deadlift" 
                value={formData.performances.deadlift?.toString() || ""}
                onChange={(t) => updatePerformance("deadlift", t)}
                placeholder="120"
                keyboardType="numeric"
              />
            </View>

            <Text style={styles.perfSectionTitle}>💪 Poids du corps</Text>
            <View style={styles.row}>
              <InputField 
                label="Tractions (max)" 
                value={formData.performances.pullUps?.toString() || ""}
                onChange={(t) => updatePerformance("pullUps", t)}
                placeholder="10"
                keyboardType="numeric"
              />
              <InputField 
                label="Pompes (max)" 
                value={formData.performances.pushUps?.toString() || ""}
                onChange={(t) => updatePerformance("pushUps", t)}
                placeholder="30"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.row}>
              <InputField 
                label="Planche (sec)" 
                value={formData.performances.plank?.toString() || ""}
                onChange={(t) => updatePerformance("plank", t)}
                placeholder="60"
                keyboardType="numeric"
              />
              <InputField 
                label="Tour taille (cm)" 
                value={formData.performances.waist?.toString() || ""}
                onChange={(t) => updatePerformance("waist", t)}
                placeholder="85"
                keyboardType="numeric"
              />
            </View>

            <Text style={styles.perfSectionTitle}>🏃 Cardio (temps en min)</Text>
            <View style={styles.row}>
              <InputField 
                label="5 km" 
                value={formData.performances.run5k?.toString() || ""}
                onChange={(t) => updatePerformance("run5k", t)}
                placeholder="25"
                keyboardType="numeric"
              />
              <InputField 
                label="10 km" 
                value={formData.performances.run10k?.toString() || ""}
                onChange={(t) => updatePerformance("run10k", t)}
                placeholder="55"
                keyboardType="numeric"
              />
              <InputField 
                label="20 km" 
                value={formData.performances.run20k?.toString() || ""}
                onChange={(t) => updatePerformance("run20k", t)}
                placeholder="120"
                keyboardType="numeric"
              />
            </View>
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
              <>
                <MaterialCommunityIcons name="calculator" size={20} color="white" style={{ marginRight: 8 }} />
                <Text style={styles.saveButtonText}>Recalculer mon plan</Text>
              </>
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

const ActivityCard = ({ title, subtitle, icon, color, selected, onPress }) => (
  <TouchableOpacity
    onPress={onPress}
    style={[
      styles.activityCard,
      selected && { borderColor: color, backgroundColor: color + "0A" },
    ]}
    activeOpacity={0.9}
  >
    <View style={[styles.activityIcon, { backgroundColor: color + "14" }]}>
      <MaterialCommunityIcons name={icon} size={22} color={color} />
    </View>

    <View style={{ flex: 1 }}>
      <Text style={[styles.activityTitle, selected && { color }]}>{title}</Text>
      <Text style={styles.activitySubtitle}>{subtitle}</Text>
    </View>

    {selected && <Ionicons name="checkmark-circle" size={22} color={color} />}
  </TouchableOpacity>
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

  card: { 
    backgroundColor: 'white', 
    borderRadius: 16, 
    padding: 16, 
    marginBottom: 16 
  },
  cardTitle: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    color: Colors.text, 
    marginBottom: 4 
  },
  cardSubtitle: { 
    fontSize: 13, 
    color: Colors.textLight, 
    marginBottom: 16 
  },

  activityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#EEF0F4',
  },
  activityIcon: { 
    width: 44, 
    height: 44, 
    borderRadius: 16, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginRight: 12 
  },
  activityTitle: { 
    fontSize: 15, 
    fontWeight: '900', 
    color: Colors.text 
  },
  activitySubtitle: { 
    fontSize: 12, 
    color: Colors.textLight, 
    marginTop: 2 
  },

  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FBFCFE',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E6E9EF',
  },
  searchInput: { 
    flex: 1, 
    marginLeft: 10, 
    fontSize: 15, 
    color: Colors.text 
  },

  subLabel: { 
    fontSize: 13, 
    fontWeight: '900', 
    color: Colors.text, 
    marginBottom: 10 
  },

  addedSportCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#EEF0F4',
  },
  addedSportName: { 
    fontSize: 16, 
    fontWeight: '900', 
    color: Colors.text 
  },
  miniRow: { 
    flexDirection: 'row', 
    gap: 12, 
    marginTop: 10 
  },
  miniLabel: { 
    fontSize: 11, 
    fontWeight: '800', 
    color: Colors.textLight, 
    marginBottom: 6 
  },
  miniInput: {
    backgroundColor: '#FBFCFE',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 12,
    fontSize: 14,
    textAlign: 'center',
    borderWidth: 1,
    borderColor: '#E6E9EF',
    color: Colors.text,
  },
  levelRow: { flexDirection: 'row', gap: 6 },
  levelBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ECEFF4',
  },
  levelBtnActive: { 
    backgroundColor: Colors.primary, 
    borderColor: Colors.primary 
  },
  levelBtnText: { 
    fontSize: 12, 
    fontWeight: '900', 
    color: Colors.textLight 
  },
  levelBtnTextActive: { color: 'white' },
  removeSportBtn: { padding: 8, marginLeft: 8 },

  sportOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#EEF0F4',
  },
  sportLeft: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    flex: 1 
  },
  sportIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: Colors.primary + "12",
    alignItems: 'center',
    justifyContent: 'center',
  },
  sportOptionText: { 
    marginLeft: 12, 
    fontSize: 15, 
    color: Colors.text, 
    fontWeight: '800', 
    flex: 1 
  },
  customSportInput: { 
    flex: 1, 
    marginLeft: 12, 
    fontSize: 15, 
    color: Colors.text 
  },
  helperText: { 
    textAlign: 'center', 
    color: Colors.textLight, 
    marginTop: 14, 
    fontWeight: '700' 
  },

  perfSectionTitle: { 
    fontSize: 14, 
    fontWeight: '900', 
    color: Colors.text, 
    marginTop: 14, 
    marginBottom: 10 
  },

  row: { flexDirection: 'row', gap: 10 },
  inputContainer: { marginBottom: 14, flex: 1 },
  inputLabel: { 
    fontSize: 11, 
    fontWeight: '700', 
    color: Colors.textLight, 
    marginBottom: 6 
  },
  input: {
    backgroundColor: '#F9FAFB',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 12,
    fontSize: 14,
    color: Colors.text,
    borderWidth: 1,
    borderColor: '#E5E7EB'
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
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center'
  },
  saveButtonText: { 
    color: 'white', 
    fontSize: 16, 
    fontWeight: 'bold' 
  }
});