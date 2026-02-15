import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useMutation } from "convex/react";
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { ActivityIndicator, Alert, Image, Modal, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { api } from "../../../convex/_generated/api";
import Colors from '../../constants/Colors';

export default function RecipeDetailsScreen({ route, navigation }) {
  const { recipe } = route.params || {};
  
  const addMealMutation = useMutation(api.meals.add);
  const deleteRecipe = useMutation(api.recipes.remove);
  const updateRecipe = useMutation(api.recipes.update);

  const [localImage, setLocalImage] = useState(recipe?.image || null);
  const [isUpdatingPhoto, setIsUpdatingPhoto] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handleUseRecipe = () => {
    if (recipe?._id) {
      navigation.navigate('ComplexMeal', { prefilledRecipe: recipe });
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      if (recipe?._id) await deleteRecipe({ id: recipe._id });
      setShowDeleteModal(false);
      setTimeout(() => navigation.goBack(), 300);
    } catch (err) {
      console.error(err);
      Alert.alert("Erreur", "Impossible de supprimer cette recette.");
      setIsDeleting(false);
    }
  };

  const handleEdit = () => {
    navigation.navigate('CreateRecipeFlow', { initialData: recipe });
  };

  // 📸 NOUVELLE FONCTIONNALITÉ : Ajouter/Modifier la photo
  const handleAddPhoto = () => {
    Alert.alert("Photo", "Choisis une option :", [
      { text: "Annuler", style: "cancel" },
      { text: "Appareil Photo 📸", onPress: takePhoto },
      { text: "Galerie 🖼️", onPress: pickFromGallery },
    ]);
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert("Erreur", "Permission caméra refusée.");
      return;
    }
    let result = await ImagePicker.launchCameraAsync({ 
      allowsEditing: true, 
      aspect: [4, 3], 
      quality: 0.5 
    });
    if (!result.canceled) {
      await savePhoto(result.assets[0].uri);
    }
  };

  const pickFromGallery = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({ 
      mediaTypes: ImagePicker.MediaTypeOptions.Images, 
      allowsEditing: true, 
      aspect: [4, 3], 
      quality: 0.5 
    });
    if (!result.canceled) {
      await savePhoto(result.assets[0].uri);
    }
  };

  const savePhoto = async (uri) => {
    setIsUpdatingPhoto(true);
    try {
      // Mise à jour dans la DB
      await updateRecipe({
        id: recipe._id,
        title: recipe.title,
        calories: recipe.calories,
        proteins: recipe.proteins,
        carbs: recipe.carbs,
        fats: recipe.fats,
        prepTime: recipe.prepTime,
        cookTime: recipe.cookTime,
        image: uri, // ✨ Nouvelle image
        instructions: recipe.instructions || [],
        ingredients: recipe.ingredients,
        tags: recipe.tags
      });
      
      setLocalImage(uri);
      Alert.alert("Succès ✨", "Photo mise à jour !");
    } catch (err) {
      console.error(err);
      Alert.alert("Erreur", "Impossible de sauvegarder la photo.");
    } finally {
      setIsUpdatingPhoto(false);
    }
  };

  const steps = recipe.instructions || [];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>{recipe.title}</Text>
        <View style={{flexDirection: 'row'}}>
            <TouchableOpacity onPress={handleEdit} style={{marginRight: 15}}>
                <Ionicons name="pencil-outline" size={24} color={Colors.text} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowDeleteModal(true)}>
                <Ionicons name="trash-outline" size={24} color="red" />
            </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        
        {/* 1. PHOTO (AVEC BOUTON AJOUTER/MODIFIER) */}
        <TouchableOpacity 
          onPress={handleAddPhoto} 
          style={styles.photoContainer}
          activeOpacity={0.8}
        >
          {isUpdatingPhoto ? (
            <View style={styles.imagePlaceholder}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={{color: Colors.textLight, marginTop: 10}}>Sauvegarde...</Text>
            </View>
          ) : localImage ? (
            <>
              <Image source={{ uri: localImage }} style={styles.recipeImage} resizeMode="cover" />
              <View style={styles.photoOverlay}>
                <Ionicons name="camera" size={30} color="white" />
                <Text style={styles.photoOverlayText}>Modifier la photo</Text>
              </View>
            </>
          ) : (
            <View style={styles.imagePlaceholder}>
              <MaterialCommunityIcons name="chef-hat" size={60} color="#9CA3AF" />
              <Text style={styles.addPhotoText}>Ajouter une photo</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Temps */}
        <View style={styles.timeContainer}>
            <View style={styles.timeBadge}>
                <Ionicons name="time-outline" size={16} color={Colors.textLight} />
                <Text style={styles.timeText}>{recipe.prepTime || "-- min"}</Text>
            </View>
        </View>

        {/* 2. VALEURS NUTRITIONNELLES */}
        <View style={styles.macroContainer}>
            <MacroBox label="Calories" val={recipe.calories} unit="kcal" color="#F59E0B" />
            <MacroBox label="Protéines" val={recipe.proteins} unit="g" color="#EF4444" />
            <MacroBox label="Glucides" val={recipe.carbs} unit="g" color="#3B82F6" />
            <MacroBox label="Lipides" val={recipe.fats} unit="g" color="#8B5CF6" />
        </View>

        <View style={styles.divider} />

        {/* 3. LISTE DES INGRÉDIENTS */}
        <Text style={styles.sectionTitle}>Ingrédients</Text>
        {recipe.ingredients && recipe.ingredients.map((ing, index) => (
            <View key={index} style={styles.row}>
                <Text style={styles.ingName}>• {ing.name}</Text>
                <Text style={styles.ingQty}>{ing.quantityLabel}</Text>
            </View>
        ))}

        <View style={styles.divider} />

        {/* 4. ÉTAPES DE PRÉPARATION */}
        <Text style={styles.sectionTitle}>Préparation</Text>
        
        {steps.length > 0 ? (
            <View style={styles.stepsContainer}>
                {steps.map((stepText, index) => (
                    <View key={index} style={styles.stepRow}>
                        <View style={styles.stepNumber}>
                            <Text style={styles.stepNumText}>{index + 1}</Text>
                        </View>
                        <Text style={styles.stepText}>{stepText}</Text>
                    </View>
                ))}
            </View>
        ) : (
            <View style={styles.emptyBox}>
                <Text style={{color: Colors.textLight, fontStyle: 'italic', textAlign: 'center'}}>
                   Pas d'étapes renseignées pour cette recette.
                </Text>
                <TouchableOpacity onPress={handleEdit}>
                    <Text style={{color: Colors.primary, fontWeight: 'bold', marginTop: 10, textAlign: 'center'}}>
                        Modifier pour ajouter les étapes
                    </Text>
                </TouchableOpacity>
            </View>
        )}

      </ScrollView>

      {/* 5. ACTIONS */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.btn} onPress={handleUseRecipe}>
            <Text style={styles.btnText}>Utiliser cette recette</Text>
        </TouchableOpacity>
      </View>

      {/* MODAL DE CONFIRMATION SUPPRESSION */}
      <Modal visible={showDeleteModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalIconBox}>
              <Ionicons name="warning" size={40} color="#F59E0B" />
            </View>
            <Text style={styles.modalTitle}>Supprimer cette recette ?</Text>
            <Text style={styles.modalDesc}>
              Cette action est irréversible. Tu ne pourras plus utiliser cette recette.
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

const MacroBox = ({ label, val, unit, color }) => (
    <View style={{alignItems: 'center'}}>
        <Text style={{fontSize: 18, fontWeight: 'bold', color: color}}>{Math.round(val)}{unit}</Text>
        <Text style={{fontSize: 12, color: Colors.textLight}}>{label}</Text>
    </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  backBtn: { padding: 5 },
  title: { fontSize: 18, fontWeight: 'bold', color: Colors.text, maxWidth: '60%' },
  content: { padding: 20, paddingBottom: 100 },
  
  // 📸 NOUVEAU : Styles pour la photo interactive
  photoContainer: { width: '100%', height: 200, borderRadius: 20, marginBottom: 15, overflow: 'hidden', position: 'relative' },
  recipeImage: { width: '100%', height: '100%' },
  imagePlaceholder: { width: '100%', height: '100%', backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center', borderStyle: 'dashed', borderWidth: 2, borderColor: '#D1D5DB', borderRadius: 20 },
  addPhotoText: { color: Colors.textLight, marginTop: 10, fontWeight: '600' },
  photoOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.6)', padding: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  photoOverlayText: { color: 'white', fontWeight: '600', marginLeft: 8, fontSize: 14 },
  
  timeContainer: { flexDirection: 'row', justifyContent: 'center', marginBottom: 20 },
  timeBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#F3F4F6' },
  timeText: { color: Colors.textLight, marginLeft: 5, fontSize: 13, fontWeight: '600' },
  
  macroContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, backgroundColor: '#F9FAFB', padding: 15, borderRadius: 16 },
  
  sectionTitle: { fontSize: 20, fontWeight: '800', color: Colors.text, marginBottom: 15, marginTop: 5 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  ingName: { fontSize: 16, color: Colors.text, flex: 1 },
  ingQty: { fontSize: 16, fontWeight: '600', color: Colors.textLight },
  
  divider: { height: 8, backgroundColor: '#F9FAFB', marginVertical: 20, borderRadius: 4 },
  
  stepsContainer: { marginTop: 5 },
  stepRow: { flexDirection: 'row', marginBottom: 20 },
  stepNumber: { width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center', marginRight: 15, marginTop: 2 },
  stepNumText: { color: 'white', fontWeight: 'bold', fontSize: 14 },
  stepText: { flex: 1, fontSize: 16, color: Colors.text, lineHeight: 24 },
  
  emptyBox: { padding: 20, alignItems: 'center', backgroundColor: '#F9FAFB', borderRadius: 12 },

  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, borderTopWidth: 1, borderTopColor: '#F3F4F6', backgroundColor: 'white' },
  btn: { backgroundColor: Colors.primary, padding: 18, borderRadius: 16, alignItems: 'center' },
  btnText: { color: 'white', fontWeight: 'bold', fontSize: 18 },

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