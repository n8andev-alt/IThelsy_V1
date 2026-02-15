import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { LayoutAnimation, Linking, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, UIManager, View } from 'react-native';
import Colors from '../../constants/Colors';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const FAQ_DATA = [
  {
    category: "🍎 Nutrition & Suivi",
    items: [
      {
        q: "Comment sont calculés mes objectifs caloriques ?",
        a: "Nous utilisons l'équation de Mifflin-St Jeor, reconnue comme la plus fiable par les diététiciens. Elle prend en compte votre sexe, âge, taille, poids et surtout votre niveau d'activité physique pour déterminer votre Métabolisme de Base et votre Dépense Énergétique Totale."
      },
      {
        q: "L'IA a mal reconnu mon plat, que faire ?",
        a: "L'intelligence artificielle est très performante mais peut faire des erreurs sur des plats complexes (ex: savoir ce qu'il y a dans une tourte fermée). Vous pouvez toujours modifier manuellement les ingrédients ou les quantités sur l'écran de vérification après la photo."
      },
      {
        q: "Dois-je peser mes aliments crus ou cuits ?",
        a: "Par défaut, les valeurs nutritionnelles des aliments bruts (riz, pâtes, viande) sont données pour le poids CRU. Si vous pesez cuit, divisez le poids par environ 3 pour les féculents."
      },
      {
        q: "Je ne trouve pas un aliment dans la recherche.",
        a: "Notre base de données est connectée à OpenFoodFacts. Si un produit manque, vous pouvez le créer manuellement via 'Créer une recette' ou utiliser un aliment générique équivalent (ex: 'Pain' au lieu de 'Pain Marque X')."
      }
    ]
  },
  {
    category: "💳 Abonnement & Paiement",
    items: [
      {
        q: "Comment fonctionne l'essai gratuit ?",
        a: "Vous bénéficiez de 7 jours d'accès complet sans être débité. Si vous annulez avant la fin du 7ème jour, rien ne vous sera facturé. Sinon, l'abonnement annuel s'active automatiquement."
      },
      {
        q: "Comment annuler mon abonnement ?",
        a: "Les abonnements sont gérés par Apple (App Store) ou Google (Play Store). Allez dans les réglages de votre téléphone > Abonnements > IThelsy > Annuler. Nous ne pouvons pas annuler à votre place."
      },
      {
        q: "Puis-je me faire rembourser ?",
        a: "Toute demande de remboursement doit être effectuée directement auprès du store (Apple ou Google) qui a traité le paiement. Leurs conditions générales s'appliquent."
      }
    ]
  },
  {
    category: "🏋️‍♂️ Sport & Gym Bro",
    items: [
      {
        q: "À quoi sert le mode Gym Bro ?",
        a: "C'est un système de responsabilité. En liant votre compte à un ami, vous voyez si l'autre a validé sa journée (Nutrition & Sport). C'est prouvé : on lâche moins quand quelqu'un nous regarde !"
      },
      {
        q: "Mes données sont-elles visibles par mon Gym Bro ?",
        a: "Non. Votre ami voit seulement si vous avez atteint vos objectifs (succès/échec) et votre série (streak). Il ne voit pas votre poids, vos photos ou le détail de vos repas."
      }
    ]
  },
  {
    category: "⚙️ Technique & Compte",
    items: [
      {
        q: "L'application fonctionne-t-elle sans internet ?",
        a: "Une connexion est requise pour la recherche d'aliments, l'IA photo et la sauvegarde dans le Cloud. Cependant, l'affichage de vos données déjà chargées peut fonctionner hors ligne."
      },
      {
        q: "Comment supprimer mon compte ?",
        a: "Vous pouvez demander la suppression définitive de toutes vos données en envoyant un email à notre support via le bouton en bas de cette page. Cette action est irréversible."
      }
    ]
  }
];

export default function FAQScreen({ navigation }) {
  const [openSection, setOpenSection] = useState(null); // format "catIndex-itemIndex"

  const toggleItem = (catIndex, itemIndex) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const key = `${catIndex}-${itemIndex}`;
    setOpenSection(openSection === key ? null : key);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Aide & FAQ</Text>
        <View style={{width: 24}} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.intro}>
            Une question ? La réponse est sûrement ici.
        </Text>

        {FAQ_DATA.map((section, catIndex) => (
            <View key={catIndex} style={styles.sectionContainer}>
                <Text style={styles.categoryTitle}>{section.category}</Text>
                
                {section.items.map((item, itemIndex) => {
                    const isOpen = openSection === `${catIndex}-${itemIndex}`;
                    return (
                        <TouchableOpacity 
                            key={itemIndex} 
                            style={[styles.item, isOpen && styles.itemOpen]} 
                            onPress={() => toggleItem(catIndex, itemIndex)} 
                            activeOpacity={0.9}
                        >
                            <View style={styles.questionRow}>
                                <Text style={[styles.question, isOpen && {color: Colors.primary}]}>{item.q}</Text>
                                <Ionicons name={isOpen ? "chevron-up" : "chevron-down"} size={20} color={isOpen ? Colors.primary : Colors.textLight} />
                            </View>
                            {isOpen && (
                                <View style={styles.answerContainer}>
                                    <Text style={styles.answer}>{item.a}</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    );
                })}
            </View>
        ))}

        <View style={styles.contactBox}>
            <Text style={styles.contactText}>Tu ne trouves pas ta réponse ?</Text>
            <TouchableOpacity style={styles.contactBtn} onPress={() => Linking.openURL('mailto:contact.ithelsy@gmail.com')}>
                <Text style={styles.contactBtnText}>Contacter le support</Text>
            </TouchableOpacity>
        </View>

        <View style={{height: 50}} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white' },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  title: { fontSize: 18, fontWeight: 'bold', color: Colors.text },
  content: { padding: 20 },
  intro: { fontSize: 14, color: Colors.textLight, marginBottom: 20, textAlign: 'center' },
  
  sectionContainer: { marginBottom: 25 },
  categoryTitle: { fontSize: 14, fontWeight: '800', color: Colors.text, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1, marginLeft: 5 },
  
  item: { marginBottom: 10, backgroundColor: '#F9FAFB', borderRadius: 12, padding: 15, borderWidth: 1, borderColor: '#F3F4F6' },
  itemOpen: { backgroundColor: 'white', borderColor: Colors.primary, shadowColor: Colors.primary, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  
  questionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  question: { fontSize: 15, fontWeight: '600', color: Colors.text, flex: 1, marginRight: 10 },
  
  answerContainer: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  answer: { fontSize: 14, color: '#4B5563', lineHeight: 22 },

  contactBox: { marginTop: 20, alignItems: 'center', padding: 30, backgroundColor: '#EFF6FF', borderRadius: 20, borderWidth: 1, borderColor: '#BFDBFE' },
  contactText: { color: Colors.primary, marginBottom: 10, fontWeight: '600' },
  contactBtn: { backgroundColor: Colors.primary, paddingHorizontal: 25, paddingVertical: 12, borderRadius: 20 },
  contactBtnText: { color: 'white', fontWeight: 'bold' }
});