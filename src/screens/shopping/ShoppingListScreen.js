import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useMutation, useQuery } from "convex/react";
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, SafeAreaView, SectionList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { api } from "../../../convex/_generated/api";
import Colors from '../../constants/Colors';

export default function ShoppingListScreen({ navigation }) {
  const rawList = useQuery(api.shopping.list);
  const toggleItem = useMutation(api.shopping.toggle);
  const addManual = useMutation(api.shopping.addManual);
  const clearList = useMutation(api.shopping.clear);
  const removeItem = useMutation(api.shopping.removeOne); // Pour la suppression unitaire

  const [newItem, setNewItem] = useState("");
  const [searchText, setSearchText] = useState("");

  const listToDisplay = rawList ? rawList.filter(item => 
      item && item.text && item.text.toLowerCase().includes(searchText.toLowerCase())
  ) : [];

  const sections = [];
  if (listToDisplay.length > 0) {
      const grouped = listToDisplay.reduce((acc, item) => {
          const cat = item.category || "Divers";
          if (!acc[cat]) acc[cat] = [];
          acc[cat].push(item);
          return acc;
      }, {});
      
      const order = ["Fruits & Légumes", "Viandes & Poissons", "Frais & Laitages", "Épicerie", "Divers"];
      order.forEach(cat => {
          if (grouped[cat] && grouped[cat].length > 0) sections.push({ title: cat, data: grouped[cat] });
      });
      Object.keys(grouped).forEach(cat => {
          if (!order.includes(cat)) sections.push({ title: cat, data: grouped[cat] });
      });
  }

  const handleManualAdd = () => {
    if (newItem.trim()) { addManual({ text: newItem }); setNewItem(""); }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Ma Liste</Text>
        <TouchableOpacity onPress={() => clearList()} style={styles.trashBtn}>
            <Ionicons name="trash-outline" size={22} color={Colors.danger} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.addRecipesBtn} onPress={() => navigation.navigate('SelectRecipes')}>
        <View style={styles.iconBox}>
            <MaterialCommunityIcons name="chef-hat" size={20} color="white" />
        </View>
        <View style={{flex:1}}>
            <Text style={styles.addRecipesTitle}>Ajouter depuis mes recettes</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="white" />
      </TouchableOpacity>

      <SectionList
        sections={sections}
        keyExtractor={(item) => item._id}
        contentContainerStyle={{paddingBottom: 100, paddingHorizontal: 20}}
        renderSectionHeader={({ section: { title } }) => (
            <Text style={styles.sectionHeader}>{title}</Text>
        )}
        renderItem={({ item }) => (
          <View style={styles.itemRow}>
            <TouchableOpacity 
                style={styles.itemContent} 
                onPress={() => toggleItem({ id: item._id })}
                activeOpacity={0.7}
            >
                <View style={[styles.checkBox, item.isChecked && styles.checkBoxChecked]}>
                    {item.isChecked && <Ionicons name="checkmark" size={14} color="white" />}
                </View>
                <Text style={[styles.itemText, item.isChecked && styles.itemTextChecked]}>
                    {item.text}
                </Text>
            </TouchableOpacity>
            
            {/* Bouton Poubelle Individuel */}
            <TouchableOpacity onPress={() => removeItem({ id: item._id })} style={{padding: 10}}>
                <Ionicons name="close" size={18} color="#D1D5DB" />
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
            <View style={{alignItems:'center', marginTop:50}}>
                <Text style={{color: Colors.textLight}}>Liste vide.</Text>
            </View>
        }
      />

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <View style={styles.inputContainer}>
        <TextInput style={styles.input} placeholder="Ajouter un article..." value={newItem} onChangeText={setNewItem} onSubmitEditing={handleManualAdd} />
        <TouchableOpacity onPress={handleManualAdd} style={styles.sendBtn}><Ionicons name="arrow-up" size={24} color="white" /></TouchableOpacity>
      </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' }, // Fond Profil
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, alignItems: 'center' },
  backBtn: { padding: 5 },
  title: { fontSize: 22, fontWeight: 'bold', color: Colors.text },
  trashBtn: { padding: 5 },

  addRecipesBtn: { flexDirection:'row', backgroundColor: Colors.primary, marginHorizontal: 20, padding: 15, borderRadius: 16, alignItems: 'center', shadowColor: Colors.primary, shadowOpacity: 0.3, shadowRadius: 5, elevation: 3, marginBottom: 10 },
  iconBox: { width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent:'center', alignItems:'center', marginRight: 15 },
  addRecipesTitle: { color: 'white', fontWeight: 'bold', fontSize: 16 },

  sectionHeader: { fontSize: 13, fontWeight: '800', color: Colors.textLight, marginTop: 20, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  
  // DESIGN CARTE BLANCHE (STYLE PROFIL)
  itemRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', borderRadius: 16, marginBottom: 8, paddingLeft: 15, paddingRight: 5, shadowColor: "#000", shadowOpacity: 0.02, shadowRadius: 3, elevation: 1 },
  itemContent: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingVertical: 16 },
  
  checkBox: { width: 22, height: 22, borderRadius: 8, borderWidth: 2, borderColor: '#E5E7EB', marginRight: 15, justifyContent: 'center', alignItems: 'center' },
  checkBoxChecked: { backgroundColor: Colors.textLight, borderColor: Colors.textLight },
  itemText: { fontSize: 16, color: Colors.text, fontWeight: '600' },
  itemTextChecked: { color: Colors.textLight, textDecorationLine: 'line-through' },
  
  inputContainer: { flexDirection: 'row', padding: 15, backgroundColor: 'white', borderTopWidth: 1, borderTopColor: '#E5E7EB' },
  input: { flex: 1, backgroundColor: '#F9FAFB', borderRadius: 25, paddingHorizontal: 20, height: 50, fontSize: 16 },
  sendBtn: { width: 50, height: 50, borderRadius: 25, backgroundColor: Colors.text, justifyContent:'center', alignItems:'center', marginLeft: 10 },
});