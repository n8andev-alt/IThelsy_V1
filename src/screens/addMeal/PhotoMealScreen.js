import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { ActivityIndicator, Alert, Image, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Colors from '../../constants/Colors';

export default function PhotoMealScreen({ route, navigation }) {
  const { mealType, returnTo } = route.params || {};
  
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [description, setDescription] = useState("");

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') return Alert.alert("Erreur", "Permission caméra refusée.");
    let result = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.5 });
    if (!result.canceled) setImage(result.assets[0].uri);
  };

  const analyzeImage = async () => {
    if (!image) return;
    setLoading(true);

    try {
      const base64 = await FileSystem.readAsStringAsync(image, { encoding: 'base64' });
      const apiKey = process.env.EXPO_PUBLIC_OPENAI_KEY;
      if (!apiKey) { Alert.alert("Erreur", "Clé API manquante"); setLoading(false); return; }

      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: "gpt-4o", 
          messages: [
            {
              role: "system",
              content: `Tu es un nutritionniste expert. Tu DOIS retourner UNIQUEMENT un objet JSON valide, sans texte avant ou après, sans markdown, sans backticks.

Format EXACT attendu (ADAPTE LES QUANTITÉS selon la photo) :
{
  "dishName": "Nom du plat",
  "ingredients": [
    {
      "name": "Nom ingrédient",
      "quantityLabel": "180g",
      "calories": 324,
      "proteins": 54,
      "carbs": 0,
      "fats": 9
    }
  ]
}

RÈGLES CRITIQUES :
1. ESTIME LA VRAIE QUANTITÉ visible (NE METS PAS 100g par défaut !)
2. Viande/poisson : généralement 120-200g
3. Pâtes/riz cuits : généralement 150-250g
4. Légumes : 80-150g
5. Pain : 30-80g
6. Fruit entier : poids réel (pomme 150g, banane 120g)
7. Les valeurs nutritionnelles DOIVENT correspondre à la quantité estimée
8. RETOURNE UNIQUEMENT LE JSON, RIEN D'AUTRE (pas de texte explicatif)`
            },
            {
              role: "user",
              content: [
                { type: "text", text: description ? `Info supplémentaire : ${description}. Réponds UNIQUEMENT avec le JSON, sans texte.` : "Analyse cette image. Réponds UNIQUEMENT avec le JSON, sans texte." },
                { type: "image_url", image_url: { url: `data:image/jpeg;base64,${base64}` } }
              ]
            }
          ],
          max_tokens: 1000,
          temperature: 0.3, // 🔥 Plus bas = plus précis
        }),
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error.message);

      let content = data.choices[0].message.content;
      
      // 🔥 NETTOYAGE ROBUSTE DU JSON
      console.log("Réponse brute IA:", content); // Pour debug
      
      // Enlève les backticks markdown
      content = content.replace(/```json/g, "").replace(/```/g, "").trim();
      
      // Cherche le premier { et le dernier }
      const firstBrace = content.indexOf('{');
      const lastBrace = content.lastIndexOf('}');
      
      if (firstBrace === -1 || lastBrace === -1) {
        throw new Error("Aucun JSON trouvé dans la réponse");
      }
      
      const jsonStr = content.substring(firstBrace, lastBrace + 1);
      console.log("JSON extrait:", jsonStr); // Pour debug
      
      const resultData = JSON.parse(jsonStr);

      // 🔥 VALIDATION : Vérifie que les données sont bien là
      if (!resultData.dishName || !resultData.ingredients || !Array.isArray(resultData.ingredients)) {
        throw new Error("Format de réponse invalide");
      }

      // 🔥 NETTOYER LES INGRÉDIENTS
      const cleanedIngredients = resultData.ingredients.map(ing => ({
        name: ing.name,
        quantityLabel: ing.quantityLabel || "100g",
        calories: parseFloat(ing.calories) || 0,
        proteins: parseFloat(ing.proteins) || 0,
        carbs: parseFloat(ing.carbs) || 0,
        fats: parseFloat(ing.fats) || 0,
      }));

      navigation.replace('PhotoIngredientsScreen', { 
        dishName: resultData.dishName, 
        ingredients: cleanedIngredients,
        mealType,
        returnTo 
      });

    } catch (err) {
      console.error("Erreur analyse IA:", err);
      Alert.alert("Erreur", `L'analyse IA a échoué : ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="close" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Photo IA</Text>
        <View style={{width: 40}} /> 
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <TouchableOpacity onPress={takePhoto} style={styles.photoContainer}>
          {image ? (
            <Image source={{ uri: image }} style={styles.image} />
          ) : (
            <View style={styles.placeholder}>
              <Ionicons name="camera" size={60} color={Colors.primary} />
              <Text style={styles.placeholderText}>Toucher pour prendre une photo</Text>
            </View>
          )}
        </TouchableOpacity>

        <Text style={styles.label}>Description (optionnelle) :</Text>
        <TextInput 
          style={styles.input}
          placeholder="Ex: Sauce soja, cuit au beurre..."
          placeholderTextColor="#9CA3AF"
          value={description}
          onChangeText={setDescription}
          multiline
        />

        <TouchableOpacity 
          style={[styles.analyzeButton, (!image || loading) && styles.disabledBtn]} 
          onPress={analyzeImage}
          disabled={!image || loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <Ionicons name="sparkles" size={24} color="white" style={{marginRight: 10}} />
              <Text style={styles.btnText}>Analyser</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
  title: { fontSize: 18, fontWeight: 'bold', color: Colors.text },
  backBtn: { padding: 5 },
  content: { padding: 20 },
  photoContainer: { width: '100%', height: 300, borderRadius: 20, overflow: 'hidden', backgroundColor: '#F3F4F6', marginBottom: 20, borderStyle: 'dashed', borderWidth: 2, borderColor: '#E5E7EB' },
  image: { width: '100%', height: '100%' },
  placeholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  placeholderText: { marginTop: 10, color: Colors.textLight, fontWeight: '600' },
  label: { fontSize: 14, color: Colors.textLight, marginBottom: 8, fontWeight: '600' },
  input: { backgroundColor: '#F9FAFB', padding: 15, borderRadius: 12, fontSize: 16, color: Colors.text, height: 80, textAlignVertical: 'top', marginBottom: 30 },
  analyzeButton: { backgroundColor: Colors.primary, padding: 18, borderRadius: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', shadowColor: Colors.primary, shadowOpacity: 0.3, elevation: 5 },
  disabledBtn: { backgroundColor: '#D1D5DB', shadowOpacity: 0 },
  btnText: { color: 'white', fontWeight: 'bold', fontSize: 18 }
});