import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useMutation } from "convex/react";
import * as ImagePicker from 'expo-image-picker';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Image, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { api } from "../../../convex/_generated/api";
import Colors from '../../constants/Colors';
import { RecipeStore } from '../../data/RecipeStore';

export default function CreateRecipeFlow({ route, navigation }) {
  const { initialData } = route.params || {};
  const isEditing = !!initialData;

  const createRecipe = useMutation(api.recipes.add);
  const updateRecipe = useMutation(api.recipes.update);

  const [step, setStep] = useState(1);
  const [title, setTitle] = useState("");
  const [prepTime, setPrepTime] = useState("");
  const [cookTime, setCookTime] = useState("");
  const [goalTag, setGoalTag] = useState("Maintien");
  const [image, setImage] = useState(null);
  
  // ID pour l'édition
  const [editingId, setEditingId] = useState(null);

  const [ingredients, setIngredients] = useState([]);
  const [prepSteps, setPrepSteps] = useState([""]);
  const [totals, setTotals] = useState({ cal: 0, p: 0, c: 0, f: 0 });

  // 1. INITIALISATION
  useEffect(() => {
    if (initialData && step === 1 && ingredients.length === 0) {
        RecipeStore.clear(); 
        
        (initialData.ingredients || []).forEach(ing => {
            RecipeStore.addIngredient({
                ...ing,
                finalCalories: ing.calories,
                finalProteins: ing.proteins,
                finalCarbs: ing.carbs,
                finalFats: ing.fats,
                baseCal: ing.calories, 
                weight: ing.quantityLabel 
            });
        });

        RecipeStore.updateMetadata({
            title: initialData.title,
            prepTime: initialData.prepTime,
            cookTime: initialData.cookTime || "", 
            tags: initialData.tags,
            image: initialData.image,
            editingId: initialData._id
        });
        
        if (initialData.instructions && initialData.instructions.length > 0) {
             setPrepSteps(initialData.instructions);
        }
    }
  }, [initialData]);

  // 2. LECTURE DU STORE
  useFocusEffect(
    useCallback(() => {
      const meta = RecipeStore.getMetadata();
      const ingData = RecipeStore.getIngredients();

      setTitle(meta.title);
      setPrepTime(meta.prepTime || "");
      setCookTime(meta.cookTime || "");
      setGoalTag(meta.tags ? meta.tags[0] : "Maintien");
      setImage(meta.image);
      setEditingId(meta.editingId);

      if (meta.currentStep) setStep(meta.currentStep);
      setIngredients(ingData);
    }, [])
  );

  // 3. SAUVEGARDE LOCALE
  const updateLocalAndStore = (field, value) => {
      if (field === 'title') setTitle(value);
      if (field === 'prepTime') setPrepTime(value);
      if (field === 'cookTime') setCookTime(value);
      if (field === 'tag') setGoalTag(value);
      if (field === 'image') setImage(value);
      if (field === 'step') setStep(value);

      const updates = {};
      if (field === 'tag') updates.tags = [value];
      else if (field === 'step') updates.currentStep = value;
      else updates[field] = value;
      RecipeStore.updateMetadata(updates);
  };

  // 4. CALCUL DES TOTAUX
  useEffect(() => {
    let t = { cal: 0, p: 0, c: 0, f: 0 };
    ingredients.forEach(ing => {
      t.cal += ing.finalCalories ?? ing.calories ?? 0;
      t.p += ing.finalProteins ?? ing.proteins ?? 0;
      t.c += ing.finalCarbs ?? ing.carbs ?? 0;
      t.f += ing.finalFats ?? ing.fats ?? 0;
    });
    setTotals(t);
  }, [ingredients]);

  // --- ACTIONS ---

  const handleImagePick = () => {
    Alert.alert("Photo", "Choisis une option :", [
        { text: "Annuler", style: "cancel" },
        { text: "Appareil Photo 📸", onPress: takePhoto },
        { text: "Galerie 🖼️", onPress: pickFromGallery },
    ]);
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') return Alert.alert("Erreur", "Permission refusée");
    let result = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [4, 3], quality: 0.5 });
    if (!result.canceled) updateLocalAndStore('image', result.assets[0].uri);
  };

  const pickFromGallery = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [4, 3], quality: 0.5 });
    if (!result.canceled) updateLocalAndStore('image', result.assets[0].uri);
  };

  // 👇 C'EST ICI LA MODIFICATION POUR L'ÉTAPE 2 👇
  const handleAddIngredient = () => {
    updateLocalAndStore('step', 2);
    // On va vers le MENU (MealEntry) au lieu de la recherche directe
    navigation.navigate('MealEntry', { mealType: 'Recette', returnTo: 'CreateRecipeFlow' });
  };

  const handleEditIngredient = (ingredient, index) => {
    updateLocalAndStore('step', 2);
    navigation.navigate('FoodQuantity', { 
        product: ingredient, 
        mealType: 'Recette', 
        returnTo: 'CreateRecipeFlow',
        editIndex: index 
    });
  };

  const removeIngredient = (index) => {
    RecipeStore.removeIngredient(index);
    setIngredients(RecipeStore.getIngredients());
  };

  const updateStepText = (text, index) => {
    const newSteps = [...prepSteps];
    newSteps[index] = text;
    setPrepSteps(newSteps);
  };

  const addStepLine = () => setPrepSteps([...prepSteps, ""]);
  const removeStepLine = (index) => {
      const newSteps = [...prepSteps];
      newSteps.splice(index, 1);
      setPrepSteps(newSteps);
  };

  const handleSave = async () => {
    if (title.trim() === "") { Alert.alert("Oups", "Donne un nom à ta recette !"); return; }
    if (ingredients.length === 0) { Alert.alert("Vide", "Ajoute au moins un ingrédient."); return; }

    const recipeData = {
        title: title,
        prepTime: prepTime || undefined,
        cookTime: cookTime || undefined,
        image: image || undefined,
        tags: [goalTag],
        calories: Math.round(totals.cal),
        proteins: Math.round(totals.p),
        carbs: Math.round(totals.c),
        fats: Math.round(totals.f),
        ingredients: ingredients.map(ing => ({
            name: ing.name,
            quantityLabel: ing.quantityLabel,
            calories: Math.round(ing.finalCalories ?? ing.calories),
            proteins: Math.round(ing.finalProteins ?? ing.proteins),
            carbs: Math.round(ing.finalCarbs ?? ing.carbs),
            fats: Math.round(ing.finalFats ?? ing.fats),
        })),
        instructions: prepSteps.filter(s => s.trim() !== ""),
    };

    try {
        if (editingId) {
            console.log("📝 UPDATE recette :", editingId);
            const updateData = { ...recipeData, id: editingId };
            if (!updateData.image) delete updateData.image; 
            await updateRecipe(updateData);
            Alert.alert("Succès", "Recette modifiée !");
        } else {
            console.log("✨ CREATE recette");
            await createRecipe(recipeData);
            Alert.alert("Succès", "Recette créée !");
        }
        RecipeStore.clear();
        navigation.navigate('Tabs', { screen: 'Recettes' });
    } catch (err) {
        console.error(err);
        Alert.alert("Erreur", "Sauvegarde impossible : " + err.message);
    }
  };

  const changeStep = (newStep) => updateLocalAndStore('step', newStep);

  // --- RENDU UI ---

  const renderStep1 = () => (
    <View>
        <Text style={styles.stepTitle}>Infos de base</Text>
        <Text style={styles.label}>Nom de la recette</Text>
        <TextInput style={styles.input} placeholder="Ex: Pâtes Bolo" value={title} onChangeText={(t) => updateLocalAndStore('title', t)} />
        
        <Text style={styles.label}>Objectif</Text>
        <View style={{flexDirection:'row', justifyContent:'space-between', marginBottom:20}}>
            {['Sèche', 'Maintien', 'Masse'].map(tag => (
                <TouchableOpacity key={tag} onPress={() => updateLocalAndStore('tag', tag)} 
                    style={[styles.tagBtn, goalTag === tag && {backgroundColor: Colors.primary, borderColor: Colors.primary}]}>
                    <Text style={[styles.tagText, goalTag === tag && {color:'white'}]}>{tag}</Text>
                </TouchableOpacity>
            ))}
        </View>

        <View style={{flexDirection:'row', justifyContent:'space-between', marginBottom: 20}}>
             <View style={{width:'48%'}}>
                <Text style={styles.label}>Préparation</Text>
                <TextInput style={styles.input} placeholder="10 min" value={prepTime} onChangeText={(t) => updateLocalAndStore('prepTime', t)} />
             </View>
             <View style={{width:'48%'}}>
                <Text style={styles.label}>Cuisson</Text>
                <TextInput style={styles.input} placeholder="20 min" value={cookTime} onChangeText={(t) => updateLocalAndStore('cookTime', t)} />
             </View>
        </View>

        <Text style={styles.label}>Photo du plat</Text>
        <TouchableOpacity style={styles.photoBox} onPress={handleImagePick}>
            {image ? <Image source={{uri:image}} style={styles.photo} /> : (
                <View style={{alignItems:'center'}}>
                    <Ionicons name="camera" size={40} color={Colors.textLight} />
                    <Text style={{color:Colors.textLight, marginTop: 5}}>Choisir / Prendre photo</Text>
                </View>
            )}
        </TouchableOpacity>
    </View>
  );

  const renderStep2 = () => (
    <View>
        <Text style={styles.stepTitle}>Ingrédients</Text>
        {ingredients.length === 0 && <Text style={{textAlign:'center', color:Colors.textLight, marginBottom:20}}>Aucun ingrédient ajouté.</Text>}
        {ingredients.map((ing, index) => (
            <TouchableOpacity 
                key={index} 
                style={styles.ingCard}
                onPress={() => handleEditIngredient(ing, index)}
            >
                <View style={{flex:1}}>
                    <Text style={{fontWeight:'bold', fontSize:16}}>{ing.name}</Text>
                    <Text style={{color:Colors.textLight}}>
                        {ing.quantityLabel} • {Math.round(ing.finalCalories ?? ing.calories)} kcal
                    </Text>
                </View>
                <TouchableOpacity onPress={() => removeIngredient(index)} style={{padding:5}}>
                    <Ionicons name="trash-outline" size={20} color="#EF4444" />
                </TouchableOpacity>
            </TouchableOpacity>
        ))}
        
        {/* BOUTON AJOUTER QUI OUVRE LE MENU */}
        <TouchableOpacity style={styles.addBtn} onPress={handleAddIngredient}>
            <Text style={styles.addBtnText}>+ Ajouter un ingrédient</Text>
        </TouchableOpacity>
    </View>
  );

  const renderStep3 = () => (
    <View>
        <Text style={styles.stepTitle}>Préparation</Text>
        {prepSteps.map((stepText, index) => (
            <View key={index} style={{marginBottom: 10}}>
                <Text style={styles.label}>Étape {index + 1}</Text>
                <View style={{flexDirection:'row', alignItems:'center'}}>
                    <TextInput style={[styles.input, {flex:1, marginBottom:0}]} multiline value={stepText} onChangeText={t => updateStepText(t, index)} placeholder="Décris cette étape..." />
                    {index > 0 && (
                        <TouchableOpacity onPress={() => removeStepLine(index)} style={{marginLeft:10}}>
                            <Ionicons name="close-circle" size={24} color="#EF4444" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        ))}
        <TouchableOpacity style={styles.addBtn} onPress={addStepLine}>
            <Text style={styles.addBtnText}>+ Ajouter une étape</Text>
        </TouchableOpacity>
    </View>
  );

  const renderStep4 = () => (
    <View>
        <Text style={styles.stepTitle}>Résumé Nutritionnel</Text>
        <View style={styles.macroGrid}>
            <MacroCard label="Calories" val={totals.cal} unit="kcal" color="#F59E0B" />
            <MacroCard label="Protéines" val={totals.p} unit="g" color="#EF4444" />
            <MacroCard label="Glucides" val={totals.c} unit="g" color="#3B82F6" />
            <MacroCard label="Lipides" val={totals.f} unit="g" color="#8B5CF6" />
        </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="close" size={24} color={Colors.text} /></TouchableOpacity>
        <Text style={styles.title}>{editingId ? "Modifier" : "Créer"} Recette ({step}/4)</Text>
        <View style={{width: 24}} />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        {step === 4 && renderStep4()}
      </ScrollView>
      <View style={styles.footer}>
        {step > 1 && (
            <TouchableOpacity style={styles.backButton} onPress={() => changeStep(step - 1)}>
                <Ionicons name="arrow-back" size={24} color={Colors.text} />
            </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.nextButton} onPress={() => step < 4 ? changeStep(step + 1) : handleSave()}>
            <Text style={styles.nextText}>{step === 4 ? (editingId ? "Enregistrer Modifs" : "Enregistrer Recette") : "Continuer"}</Text>
            {step < 4 && <Ionicons name="arrow-forward" size={20} color="white" style={{marginLeft:10}} />}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const MacroCard = ({ label, val, unit, color }) => (
    <View style={[styles.macroCard, {borderColor: color}]}>
        <Text style={{fontSize:18, fontWeight:'bold', color}}>{Math.round(val)}{unit}</Text>
        <Text style={{fontSize:12, color:Colors.textLight}}>{label}</Text>
    </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white' },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  title: { fontSize: 16, fontWeight: 'bold' },
  content: { padding: 20, paddingBottom: 100 },
  stepTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 20, color: Colors.primary },
  label: { fontWeight: '600', marginBottom: 5, color: Colors.text },
  input: { backgroundColor: '#F9FAFB', padding: 15, borderRadius: 12, marginBottom: 20, fontSize: 16 },
  tagBtn: { padding: 10, borderRadius: 20, borderWidth: 1, borderColor: '#E5E7EB', width:'30%', alignItems:'center' },
  tagText: { fontWeight: '600', color: Colors.textLight },
  photoBox: { height: 150, backgroundColor: '#F3F4F6', borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginBottom: 20, borderStyle: 'dashed', borderWidth: 1, borderColor: '#D1D5DB' },
  photo: { width: '100%', height: '100%', borderRadius: 15 },
  ingCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', padding: 15, borderRadius: 12, marginBottom: 10 },
  addBtn: { padding: 15, alignItems: 'center', borderStyle: 'dashed', borderWidth: 1, borderColor: Colors.primary, borderRadius: 12, marginTop: 10 },
  addBtnText: { color: Colors.primary, fontWeight: 'bold' },
  macroGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  macroCard: { width: '48%', backgroundColor: 'white', padding: 15, borderRadius: 12, alignItems: 'center', marginBottom: 15, borderWidth: 1, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
  footer: { flexDirection: 'row', padding: 20, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  backButton: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  nextButton: { flex: 1, backgroundColor: Colors.primary, borderRadius: 15, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', height: 50 },
  nextText: { color: 'white', fontWeight: 'bold', fontSize: 16 }
});