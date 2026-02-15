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

// 🎯 OBJECTIFS DISPONIBLES
const GOALS_OPTIONS = [
  { id: "lose_weight", title: "Perdre du poids", subtitle: "5-10 kg", icon: "scale-bathroom", color: "#EF4444" },
  { id: "build_muscle", title: "Prendre du muscle", subtitle: "Masse propre", icon: "arm-flex", color: "#F59E0B" },
  { id: "get_stronger", title: "Gagner en force", subtitle: "Perfs aux lifts", icon: "dumbbell", color: "#8B5CF6" },
  { id: "get_lean", title: "Être plus sec", subtitle: "Définition musculaire", icon: "human", color: "#3B82F6" },
  { id: "improve_endurance", title: "Améliorer endurance", subtitle: "Cardio & perf", icon: "run-fast", color: "#10B981" },
  { id: "maintain", title: "Se maintenir", subtitle: "Stabilité", icon: "scale-balance", color: "#6B7280" },
  { id: "health", title: "Santé globale", subtitle: "Bien-être", icon: "heart-pulse", color: "#EC4899" },
];

export default function EditGoalsScreen({ navigation }) {
  const userData = useQuery(api.users.checkUser);
  const updateProfileAndGoals = useMutation(api.users.updateWeightAndGoals);
  const updateUserData = useMutation(api.users.updateUserData);

  const [formData, setFormData] = useState({
    primaryGoal: userData?.primaryGoal || userData?.goal || "",
    secondaryGoals: userData?.secondaryGoals || [],
    weightGoal: userData?.weightGoal?.toString() || "",
    difficulty: userData?.difficulty || "normal"
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

  const toggleGoal = (goalId) => {
    if (formData.primaryGoal === goalId) {
      updateForm("primaryGoal", "");
    } else {
      updateForm("primaryGoal", goalId);
    }
  };

  const toggleSecondary = (goalId) => {
    if (formData.secondaryGoals.includes(goalId)) {
      updateForm(
        "secondaryGoals",
        formData.secondaryGoals.filter((g) => g !== goalId)
      );
    } else if (formData.secondaryGoals.length < 2) {
      updateForm("secondaryGoals", [...formData.secondaryGoals, goalId]);
    } else {
      Alert.alert("Maximum 2", "Tu peux choisir max 2 objectifs secondaires.");
    }
  };

  const handleSave = async () => {
    if (!formData.primaryGoal) {
      Alert.alert("Oups", "Choisis au moins un objectif principal !");
      return;
    }

    setLoading(true);
    try {
      // 1. Sauvegarde les objectifs
      await updateUserData({
        primaryGoal: formData.primaryGoal,
        secondaryGoals: formData.secondaryGoals,
        weightGoal: parseFloat(formData.weightGoal) || userData.weightGoal,
        difficulty: formData.difficulty
      });

      // 2. Recalcul complet du plan avec les nouveaux paramètres
      await updateProfileAndGoals({
        newWeight: userData.weight,
        newHeight: userData.height,
        newAge: userData.age,
        newGoal: formData.primaryGoal,
        newActivity: userData.activityLevel,
        newDifficulty: formData.difficulty
      });

      Alert.alert(
        "✅ Plan mis à jour !", 
        "Tes objectifs ont été sauvegardés et ton plan nutritionnel a été recalculé !"
      );
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
          <Text style={styles.title}>Mes Objectifs</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          
          {/* Objectif Principal */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>🎯 Objectif Principal</Text>
            <Text style={styles.cardSubtitle}>Choisis ton objectif principal</Text>
            
            {GOALS_OPTIONS.map((goal) => (
              <GoalCard
                key={goal.id}
                {...goal}
                selected={formData.primaryGoal === goal.id}
                onPress={() => toggleGoal(goal.id)}
                badge="Principal"
              />
            ))}
          </View>

          {/* Objectifs Secondaires */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>➕ Objectifs Secondaires</Text>
            <Text style={styles.cardSubtitle}>Max 2 objectifs (optionnel)</Text>
            
            {GOALS_OPTIONS.filter((g) => g.id !== formData.primaryGoal).map((goal) => (
              <GoalCard
                key={goal.id}
                {...goal}
                selected={formData.secondaryGoals.includes(goal.id)}
                onPress={() => toggleSecondary(goal.id)}
                isSecondary
              />
            ))}
          </View>

          {/* Poids Cible */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>⚖️ Poids Cible</Text>
            <InputField 
              label="Objectif de poids (kg)" 
              value={formData.weightGoal}
              onChange={(t) => updateForm("weightGoal", t)}
              placeholder="75"
              keyboardType="numeric"
            />
          </View>

          {/* Difficulté */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>🔥 Intensité</Text>
            <Text style={styles.cardSubtitle}>Choisis ton rythme</Text>
            
            <DifficultyCard 
              title="Cool 😌" 
              subtitle="Changements progressifs" 
              description="• Déficit calorique modéré (-200 kcal)\n• Protéines : 1.6g/kg\n• Progression douce et durable"
              selected={formData.difficulty === 'cool'} 
              onPress={() => updateForm('difficulty', 'cool')} 
              color="#10B981"
            />
            
            <DifficultyCard 
              title="Normal 💪" 
              subtitle="Équilibre classique" 
              description="• Déficit calorique standard (-500 kcal)\n• Protéines : 2.0g/kg\n• Résultats réguliers et solides"
              selected={formData.difficulty === 'normal'} 
              onPress={() => updateForm('difficulty', 'normal')} 
              color="#3B82F6"
            />
            
            <DifficultyCard 
              title="Guerrier 🔥" 
              subtitle="Mode hardcore" 
              description="• Déficit calorique intense (-800 kcal)\n• Protéines : 2.4g/kg\n• Résultats rapides et exigeants"
              selected={formData.difficulty === 'guerrier'} 
              onPress={() => updateForm('difficulty', 'guerrier')} 
              color="#EF4444"
            />
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

const GoalCard = ({ title, subtitle, icon, color, selected, onPress, badge, isSecondary }) => (
  <TouchableOpacity
    onPress={onPress}
    style={[
      styles.goalCard,
      selected && { borderColor: color, backgroundColor: color + "0A" },
    ]}
    activeOpacity={0.9}
  >
    <View style={[styles.goalIcon, { backgroundColor: color + "14" }]}>
      <MaterialCommunityIcons name={icon} size={26} color={color} />
    </View>

    <View style={{ flex: 1 }}>
      <Text style={[styles.goalTitle, selected && { color }]}>{title}</Text>
      <Text style={styles.goalSubtitle}>{subtitle}</Text>
    </View>

    {selected && (
      <View style={[styles.goalBadge, { backgroundColor: color }]}>
        <Text style={styles.goalBadgeText}>{badge || (isSecondary ? "Secondaire" : "✓")}</Text>
      </View>
    )}
  </TouchableOpacity>
);

const DifficultyCard = ({ title, subtitle, description, selected, onPress, color }) => (
  <TouchableOpacity
    onPress={onPress}
    style={[
      styles.difficultyCard,
      selected && { borderColor: color, backgroundColor: color + "0A" },
    ]}
    activeOpacity={0.9}
  >
    <View style={{ flex: 1 }}>
      <Text style={[styles.difficultyTitle, selected && { color }]}>{title}</Text>
      <Text style={styles.difficultySubtitle}>{subtitle}</Text>
      <Text style={styles.difficultyDescription}>{description}</Text>
    </View>

    {selected && <Ionicons name="checkmark-circle" size={24} color={color} />}
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

  inputContainer: { marginBottom: 8 },
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

  goalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#EEF0F4',
  },
  goalIcon: { 
    width: 48, 
    height: 48, 
    borderRadius: 16, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginRight: 14 
  },
  goalTitle: { 
    fontSize: 16, 
    fontWeight: '900', 
    color: Colors.text, 
    letterSpacing: -0.1 
  },
  goalSubtitle: { 
    fontSize: 13, 
    color: Colors.textLight, 
    marginTop: 2 
  },
  goalBadge: { 
    paddingHorizontal: 10, 
    paddingVertical: 6, 
    borderRadius: 999 
  },
  goalBadgeText: { 
    color: 'white', 
    fontSize: 11, 
    fontWeight: '900' 
  },

  difficultyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#EEF0F4',
  },
  difficultyTitle: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    color: Colors.text 
  },
  difficultySubtitle: { 
    fontSize: 13, 
    color: Colors.textLight, 
    marginTop: 2,
    marginBottom: 8
  },
  difficultyDescription: { 
    fontSize: 12, 
    color: Colors.textLight, 
    lineHeight: 18 
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