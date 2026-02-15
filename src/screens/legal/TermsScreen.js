import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Colors from '../../constants/Colors';

export default function TermsScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Conditions Générales (CGU)</Text>
        <View style={{width: 24}} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.lastUpdate}>Entrée en vigueur : 28 Décembre 2025</Text>
        
        <Text style={styles.intro}>
          L'utilisation de l'application IThelsy implique l'acceptation pleine et entière des présentes Conditions Générales d'Utilisation.
        </Text>

        <Section title="1. Avertissement Médical (DISCLAIMER)">
          <View style={styles.warningBox}>
            <Ionicons name="warning" size={24} color="#C2410C" style={{marginBottom:10}} />
            <Text style={[styles.text, {color:'#9A3412', fontWeight:'bold'}]}>
              IThelsy n'est pas un dispositif médical.
            </Text>
            <Text style={[styles.text, {color:'#9A3412', marginTop:5}]}>
              Les informations, plans nutritionnels et conseils fournis par l'application (y compris via l'IA) sont donnés à titre purement indicatif et éducatif. Ils ne remplacent en aucun cas l'avis, le diagnostic ou le traitement d'un médecin ou d'un professionnel de santé qualifié.
            </Text>
          </View>
          <Text style={styles.text}>
            L'utilisateur reconnaît utiliser l'application sous sa responsabilité exclusive. IThelsy décline toute responsabilité en cas de blessure, malaise, réaction allergique ou tout autre problème de santé survenant suite à l'utilisation des services. En cas de doute, consultez toujours un médecin avant de modifier votre régime alimentaire ou votre activité physique.
          </Text>
        </Section>

        <Section title="2. Accès au service">
          <Text style={styles.text}>
            L'accès à certaines fonctionnalités avancées (IA, Recettes illimitées, Suivi avancé) nécessite un abonnement payant. L'utilisateur doit disposer d'une connexion internet et d'un appareil compatible pour utiliser le service.
          </Text>
        </Section>

        <Section title="3. Abonnements et Paiements">
          <Text style={styles.text}>
            <Text style={styles.bold}>3.1 Essai Gratuit :</Text> Une période d'essai peut être proposée aux nouveaux utilisateurs. À l'issue de cette période, l'abonnement est automatiquement facturé sauf annulation 24h avant l'échéance.{"\n\n"}
            <Text style={styles.bold}>3.2 Renouvellement :</Text> Les abonnements sont reconduits tacitement pour la même durée. La gestion de l'abonnement et l'annulation se font exclusivement via les paramètres de votre compte Apple (App Store) ou Google (Play Store).{"\n\n"}
            <Text style={styles.bold}>3.3 Tarifs :</Text> Les prix sont indiqués dans l'application et peuvent être modifiés. Toute modification de tarif sera notifiée à l'utilisateur avant le renouvellement.
          </Text>
        </Section>

        <Section title="4. Règles d'usage de l'IA">
          <Text style={styles.text}>
            La fonctionnalité d'analyse de photos par IA est soumise à un quota d'utilisation journalier ("Fair Use") pour prévenir les abus et garantir la stabilité du service. Les résultats de l'IA sont des estimations et ne doivent pas être considérés comme des mesures scientifiques exactes.
          </Text>
        </Section>

        <Section title="5. Propriété Intellectuelle">
          <Text style={styles.text}>
            Tous les éléments de l'application (textes, graphismes, logos, logiciels, bases de données) sont la propriété exclusive de l'éditeur. Toute reproduction ou extraction non autorisée est interdite.
          </Text>
        </Section>

        <Section title="6. Modération et Conduite">
          <Text style={styles.text}>
            Dans les espaces communautaires ("Gym Bro"), l'utilisateur s'engage à respecter autrui. Tout contenu haineux, diffamatoire ou illégal entraînera la suppression du compte sans remboursement.
          </Text>
        </Section>

        <Section title="7. Loi applicable">
          <Text style={styles.text}>
            Les présentes conditions sont régies par la loi française. En cas de litige, les tribunaux français seront seuls compétents.
          </Text>
        </Section>

        <View style={{height: 50}} />
      </ScrollView>
    </SafeAreaView>
  );
}

const Section = ({ title, children }) => (
    <View style={styles.section}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {children}
    </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white' },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  backBtn: { padding: 5 },
  title: { fontSize: 18, fontWeight: 'bold', color: Colors.text },
  content: { padding: 20 },
  lastUpdate: { fontSize: 12, color: Colors.textLight, marginBottom: 20, fontStyle: 'italic' },
  intro: { fontSize: 14, color: '#4B5563', lineHeight: 22, marginBottom: 25 },
  section: { marginBottom: 30 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: Colors.text, marginBottom: 10, textTransform: 'uppercase' },
  text: { fontSize: 14, color: '#4B5563', lineHeight: 22, textAlign: 'justify' },
  bold: { fontWeight: 'bold', color: '#1F2937' },
  warningBox: { backgroundColor: '#FFF7ED', padding: 15, borderRadius: 10, borderWidth: 1, borderColor: '#FFEDD5', marginBottom: 15 }
});