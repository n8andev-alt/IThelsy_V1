import { Ionicons } from '@expo/vector-icons';
import { useMutation } from "convex/react";
import { useState } from 'react';
import { ActivityIndicator, Alert, Modal, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { api } from "../../convex/_generated/api";
import Colors from '../constants/Colors';

export default function MealDetailsScreen({ route, navigation }) {
  const { meal } = route.params || {};
  const deleteMeal = useMutation(api.meals.remove);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteMeal({ id: meal?._id });
      setShowDeleteModal(false);
      // Petit délai pour l'animation
      setTimeout(() => {
        navigation.goBack();
      }, 300);
    } catch (err) {
      console.error(err);
      Alert.alert("Erreur", "Impossible de supprimer ce repas.");
      setIsDeleting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Détails du repas</Text>
        <TouchableOpacity onPress={() => setShowDeleteModal(true)} style={styles.iconBtn}>
          <Ionicons name="trash-outline" size={24} color="#EF4444" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        
        <View style={styles.summaryCard}>
          <Text style={styles.mealName}>{meal?.name || 'Repas'}</Text>
          <Text style={styles.mealTime}>{meal?.type || ''}</Text>
          <View style={styles.divider} />
          <View style={styles.macroRow}>
             <MacroItem label="Calories" value={meal?.calories || 0} unit="kcal" color="#F59E0B" />
             <MacroItem label="Protéines" value={meal?.proteins || 0} unit="g" color="#EF4444" />
             <MacroItem label="Glucides" value={meal?.carbs || 0} unit="g" color="#3B82F6" />
             <MacroItem label="Lipides" value={meal?.fats || 0} unit="g" color="#8B5CF6" />
          </View>
        </View>

        <Text style={styles.sectionTitle}>Ingrédients</Text>
        
        {meal?.ingredients && meal?.ingredients.length > 0 ? (
          meal?.ingredients.map((ing, index) => (
            <View key={index} style={styles.ingredientRow}>
              <View style={{flex: 1}}>
                <Text style={styles.ingName}>{ing?.name || 'Ingrédient'}</Text>
                <Text style={styles.ingQty}>{ing?.quantityLabel || ''}</Text>
              </View>
              <View style={{alignItems: 'flex-end'}}>
                <Text style={styles.ingCal}>{Math.round(ing?.calories || 0)} kcal</Text>
                <Text style={styles.ingMacros}>P:{Math.round(ing?.proteins || 0)} G:{Math.round(ing?.carbs || 0)} L:{Math.round(ing?.fats || 0)}</Text>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.ingredientRow}>
              <View style={{flex: 1}}>
                <Text style={styles.ingName}>{meal?.name || 'Repas'}</Text>
                <Text style={styles.ingQty}>Portion unique</Text>
              </View>
              <View style={{alignItems: 'flex-end'}}>
                <Text style={styles.ingCal}>{meal?.calories || 0} kcal</Text>
              </View>
          </View>
        )}

      </ScrollView>

      {/* MODAL DE CONFIRMATION */}
      <Modal visible={showDeleteModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalIconBox}>
              <Ionicons name="warning" size={40} color="#F59E0B" />
            </View>
            <Text style={styles.modalTitle}>Supprimer ce repas ?</Text>
            <Text style={styles.modalDesc}>
              Cette action est irréversible. Les valeurs nutritionnelles seront retirées de tes totaux du jour.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.cancelBtn} 
                onPress={() => setShowDeleteModal(false)}
                disabled={isDeleting}
              >
                <Text style={styles.cancelBtnText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.deleteBtn} 
                onPress={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.deleteBtnText}>Supprimer</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const MacroItem = ({ label, value, unit, color }) => (
  <View style={{alignItems: 'center'}}>
    <Text style={{fontSize: 18, fontWeight: 'bold', color: color}}>{Math.round(value)}{unit}</Text>
    <Text style={{fontSize: 12, color: Colors.textLight}}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
  title: { fontSize: 18, fontWeight: 'bold', color: Colors.text },
  iconBtn: { padding: 5 },
  content: { padding: 20 },
  summaryCard: { backgroundColor: 'white', padding: 20, borderRadius: 20, marginBottom: 30, shadowColor: "#000", shadowOpacity: 0.03, shadowRadius: 10, elevation: 2 },
  mealName: { fontSize: 22, fontWeight: 'bold', color: Colors.text, textAlign: 'center', marginBottom: 5 },
  mealTime: { fontSize: 14, color: Colors.textLight, textAlign: 'center', marginBottom: 15 },
  divider: { height: 1, backgroundColor: '#F3F4F6', width: '100%', marginBottom: 15 },
  macroRow: { flexDirection: 'row', justifyContent: 'space-between' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: Colors.text, marginBottom: 15 },
  ingredientRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', padding: 15, borderRadius: 16, marginBottom: 10, borderWidth: 1, borderColor: '#F3F4F6' },
  ingName: { fontSize: 16, fontWeight: '600', color: Colors.text },
  ingQty: { fontSize: 13, color: Colors.textLight, marginTop: 2 },
  ingCal: { fontSize: 14, fontWeight: 'bold', color: Colors.orange },
  ingMacros: { fontSize: 10, color: Colors.textLight, marginTop: 2 },

  // MODAL STYLES
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { backgroundColor: 'white', borderRadius: 24, padding: 30, width: '100%', maxWidth: 400, alignItems: 'center' },
  modalIconBox: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#FFF7ED', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 22, fontWeight: 'bold', color: Colors.text, marginBottom: 10, textAlign: 'center' },
  modalDesc: { fontSize: 15, color: Colors.textLight, textAlign: 'center', lineHeight: 22, marginBottom: 30 },
  modalButtons: { flexDirection: 'row', width: '100%', gap: 10 },
  cancelBtn: { flex: 1, backgroundColor: '#F3F4F6', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  cancelBtnText: { fontSize: 16, fontWeight: '600', color: Colors.text },
  deleteBtn: { flex: 1, backgroundColor: '#EF4444', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  deleteBtnText: { fontSize: 16, fontWeight: 'bold', color: 'white' }
});