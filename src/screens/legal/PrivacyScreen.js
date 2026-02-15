import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Colors from '../../constants/Colors';

export default function PrivacyScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Politique de Confidentialité</Text>
        <View style={{width: 24}} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.lastUpdate}>Dernière mise à jour : 28 Décembre 2025</Text>
        
        <Text style={styles.intro}>
            Nous prenons votre vie privée très au sérieux. Cette politique décrit comment IThelsy ("nous") collecte, utilise et partage vos informations personnelles.
        </Text>

        <Section title="1. Collecte des informations">
          <Text style={styles.text}>
            Nous collectons les informations suivantes pour assurer le bon fonctionnement du service :{"\n\n"}
            <Text style={styles.bold}>A. Informations que vous fournissez :</Text>{"\n"}
            • Données d'identité : Nom, prénom, adresse email (via Google/Clerk).{"\n"}
            • Données physiques : Poids, taille, âge, sexe (pour le calcul métabolique).{"\n"}
            • Données d'activité : Niveau sédentaire/actif, objectifs (perte de poids, prise de masse).{"\n"}
            • Contenu utilisateur : Photos de repas, recettes créées, historique alimentaire.{"\n\n"}
            <Text style={styles.bold}>B. Informations techniques :</Text>{"\n"}
            • Modèle de l'appareil, version du système d'exploitation, identifiants uniques pour les notifications push.
          </Text>
        </Section>

        <Section title="2. Utilisation des données">
          <Text style={styles.text}>
            Vos données sont traitées pour les finalités suivantes :{"\n"}
            • <Text style={styles.bold}>Service principal :</Text> Calculer vos besoins caloriques, suivre votre progression, générer vos listes de courses.{"\n"}
            • <Text style={styles.bold}>Intelligence Artificielle :</Text> Analyser vos photos de repas pour estimer les macronutriments.{"\n"}
            • <Text style={styles.bold}>Amélioration :</Text> Analyser les bugs et optimiser les performances de l'application.{"\n"}
            • <Text style={styles.bold}>Communication :</Text> Vous envoyer des rappels ou des notifications importantes (que vous pouvez désactiver).
          </Text>
        </Section>

        <Section title="3. Partage avec des tiers">
          <Text style={styles.text}>
            Nous ne vendons JAMAIS vos données personnelles. Elles sont partagées uniquement avec nos sous-traitants techniques dans le strict cadre du service :{"\n"}
            • <Text style={styles.bold}>Convex :</Text> Hébergement sécurisé de la base de données (USA/EU).{"\n"}
            • <Text style={styles.bold}>Clerk :</Text> Gestion sécurisée de l'authentification et des mots de passe.{"\n"}
            • <Text style={styles.bold}>OpenAI :</Text> Analyse d'images (les images sont envoyées de manière sécurisée et ne sont pas utilisées pour l'entraînement public).
          </Text>
        </Section>

        <Section title="4. Sécurité des données">
          <Text style={styles.text}>
            Nous mettons en œuvre des mesures de sécurité techniques (chiffrement SSL/TLS, accès restreints) pour protéger vos données contre l'accès non autorisé, la perte ou l'altération.
          </Text>
        </Section>

        <Section title="5. Vos droits (RGPD)">
          <Text style={styles.text}>
            Conformément au Règlement Général sur la Protection des Données, vous disposez des droits suivants :{"\n"}
            • Droit d'accès et de portabilité de vos données.{"\n"}
            • Droit de rectification des données inexactes.{"\n"}
            • Droit à l'effacement ("Droit à l'oubli").{"\n"}
            • Droit d'opposition au traitement.{"\n\n"}
            Pour exercer ces droits, contactez-nous à l'adresse ci-dessous.
          </Text>
        </Section>

        <Section title="6. Conservation des données">
          <Text style={styles.text}>
            Vos données sont conservées tant que votre compte est actif. En cas de suppression de compte, vos données personnelles sont effacées de nos serveurs actifs sous 30 jours, sauf obligation légale de conservation.
          </Text>
        </Section>

        <Section title="Contact">
          <Text style={styles.text}>
            Pour toute question relative à la confidentialité :{"\n"}
            <Text style={{color:Colors.primary, fontWeight:'bold'}}>ithelsy.contact@gmail.com</Text>
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
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: Colors.text, marginBottom: 10 },
  text: { fontSize: 14, color: '#4B5563', lineHeight: 22, textAlign: 'justify' },
  bold: { fontWeight: 'bold', color: '#1F2937' }
});