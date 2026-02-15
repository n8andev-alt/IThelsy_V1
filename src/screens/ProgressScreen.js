import { Ionicons } from '@expo/vector-icons';
import { useQuery } from "convex/react";
import { useState } from 'react';
import { ActivityIndicator, Dimensions, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LineChart } from "react-native-chart-kit";
import { api } from "../../convex/_generated/api";
import Colors from '../constants/Colors';

const { width } = Dimensions.get("window");

export default function ProgressScreen({ navigation }) {
  const [range, setRange] = useState(7);
  const [metric, setMetric] = useState('Calories');

  const stats = useQuery(api.stats.getStats, { days: range });
  const userData = useQuery(api.users.checkUser);

  if (!stats || !userData) {
      return (
          <SafeAreaView style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.primary} />
          </SafeAreaView>
      );
  }

  // 🎯 OBJECTIFS
  let goalValue = 0;
  if (metric === 'Calories') goalValue = userData.caloriesGoal || 2000;
  if (metric === 'Protéines') goalValue = userData.proteinsGoal || 150;
  if (metric === 'Eau') goalValue = userData.waterGoal || 2000;
  if (metric === 'Poids') goalValue = userData.weightGoal || 70;

  // 🔍 VÉRIFIER S'IL Y A DES DONNÉES VALIDES
  const hasValidData = stats.some(d => {
      if (metric === 'Calories') return d.calories > 0;
      if (metric === 'Protéines') return d.proteins > 0;
      if (metric === 'Eau') return d.water > 0;
      if (metric === 'Poids') return d.weight > 0;
      return false;
  });

  let dataValues = [];
  let dataLabels = [];

  if (hasValidData) {
      // 📊 EXTRACTION DES DONNÉES
      dataValues = stats.map(d => {
          let value = 0;
          if (metric === 'Calories') value = d.calories || 0;
          if (metric === 'Protéines') value = d.proteins || 0;
          if (metric === 'Eau') value = d.water || 0;
          if (metric === 'Poids') value = d.weight || 0;
          
          return (value && isFinite(value) && value > 0) ? value : 0;
      });

      // 🏷️ LABELS SIMPLIFIÉS
      dataLabels = stats.map((d, i) => {
          if (range === 7) return d.date; // "Lun", "Mar", etc. (déjà formaté par Convex)
          if (range === 30 && i % 6 === 0) return d.date;
          return ""; 
      });

  } else {
      // Pas de données : graphique d'exemple
      dataValues = [goalValue * 0.95, goalValue, goalValue * 1.05];
      dataLabels = ['Début', 'Aujourd\'hui', 'Objectif'];
  }

  // 🛡️ SÉCURITÉ : Au moins 2 points
  if (dataValues.length < 2) {
    // On ajoute un point à 0 avant pour avoir 2 points minimum
    dataValues = [0, ...dataValues];
    dataLabels = ['', ...dataLabels];
}

  // 🔥 CORRECTION CRITIQUE : Remplacer les 0 pour le poids
  const validDataValues = dataValues;
  const getMetricColor = () => {
      if (metric === 'Calories') return Colors.orange;
      if (metric === 'Protéines') return Colors.danger;
      if (metric === 'Eau') return Colors.secondary;
      return Colors.primary;
  };

  const getUnit = () => {
      if (metric === 'Calories') return 'kcal';
      if (metric === 'Eau') return 'ml';
      if (metric === 'Poids') return 'kg';
      return 'g';
  }

  // 📊 VALEUR RÉSUMÉ (en haut du graphique)
  let summaryValue = 0;
  let summaryLabel = 'Moyenne par jour';

  if (metric === 'Poids') {
      summaryValue = userData.weight || goalValue;
      summaryLabel = 'Poids actuel';
  } else {
      const validValues = dataValues.filter(v => v > 0);
      const total = validValues.reduce((a, b) => a + b, 0);
      summaryValue = validValues.length > 0 ? Math.round(total / validValues.length) : 0;
      summaryLabel = 'Moyenne par jour';
  }

  return (
    <SafeAreaView style={styles.container}>
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Analyses</Text>
        <View style={{width: 24}} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        
        <View style={styles.rangeWrapper}>
            <View style={styles.rangeSelector}>
                <RangeButton label="Semaine" active={range === 7} onPress={() => setRange(7)} />
                <RangeButton label="Mois" active={range === 30} onPress={() => setRange(30)} />
            </View>
        </View>

        <View style={styles.summaryBox}>
            <Text style={styles.summaryLabel}>{summaryLabel}</Text>
            <View style={{flexDirection:'row', alignItems:'flex-end'}}>
                <Text style={[styles.summaryValue, {color: getMetricColor()}]}>
                    {metric === 'Poids' ? summaryValue.toFixed(1) : Math.round(summaryValue)}
                </Text>
                <Text style={styles.summaryUnit}>{getUnit()}</Text>
            </View>
            <View style={styles.goalBadge}>
                <Text style={styles.goalText}>
                    Objectif : {metric === 'Poids' ? goalValue.toFixed(1) : goalValue} {getUnit()}
                </Text>
            </View>
        </View>

        {!hasValidData && (
            <View style={styles.noDataCard}>
                <Ionicons name="information-circle-outline" size={40} color={Colors.textLight} />
                <Text style={styles.noDataTitle}>Pas encore de données</Text>
                <Text style={styles.noDataText}>
                    Commence à enregistrer
                </Text>
            </View>
        )}

        <View style={styles.chartCard}>
            <LineChart
                data={{
                    labels: dataLabels,
                    datasets: [{ 
                        data: validDataValues,
                    }]
                }}
                width={width - 50} 
                height={220}
                yAxisSuffix=""
                withInnerLines={true}
                withOuterLines={false}
                chartConfig={{
                    backgroundColor: "#fff",
                    backgroundGradientFrom: "#fff",
                    backgroundGradientTo: "#fff",
                    decimalPlaces: metric === 'Poids' ? 1 : 0,
                    color: (opacity = 1) => getMetricColor(),
                    labelColor: (opacity = 1) => `rgba(0, 0, 0, 0.4)`,
                    style: { borderRadius: 16 },
                    propsForDots: { r: "4", strokeWidth: "2", stroke: "#fff" },
                    propsForBackgroundLines: { stroke: "#F0F0F0", strokeDasharray: "" } 
                }}
                bezier
                style={{ marginVertical: 8, borderRadius: 16 }}
            />
        </View>

        <Text style={styles.sectionTitle}>Indicateurs</Text>
        <View style={styles.metricsGrid}>
            <MetricButton title="Calories" icon="flame" color={Colors.orange} active={metric === 'Calories'} onPress={() => setMetric('Calories')} />
            <MetricButton title="Protéines" icon="restaurant" color={Colors.danger} active={metric === 'Protéines'} onPress={() => setMetric('Protéines')} />
            <MetricButton title="Eau" icon="water" color={Colors.secondary} active={metric === 'Eau'} onPress={() => setMetric('Eau')} />
            <MetricButton title="Poids" icon="scale" color={Colors.primary} active={metric === 'Poids'} onPress={() => setMetric('Poids')} />
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const RangeButton = ({ label, active, onPress }) => (
    <TouchableOpacity style={[styles.rangeBtn, active && styles.activeRange]} onPress={onPress}>
        <Text style={[styles.rangeText, active && styles.activeRangeText]}>{label}</Text>
    </TouchableOpacity>
);

const MetricButton = ({ title, icon, color, active, onPress }) => (
    <TouchableOpacity 
        style={[styles.metricBtn, active && {backgroundColor: color + '15', borderColor: color}]} 
        onPress={onPress}
    >
        <Ionicons name={icon} size={20} color={active ? color : Colors.textLight} />
        <Text style={[styles.metricText, active && {color: color}]}>{title}</Text>
    </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, alignItems: 'center' },
  title: { fontSize: 18, fontWeight: 'bold', color: Colors.text },
  backBtn: { padding: 5, backgroundColor: 'white', borderRadius: 12 },
  content: { padding: 20, paddingBottom: 50 },
  
  rangeWrapper: { alignItems:'center', marginBottom: 20 },
  rangeSelector: { flexDirection: 'row', backgroundColor: '#E5E7EB', padding: 3, borderRadius: 20 },
  rangeBtn: { paddingVertical: 6, paddingHorizontal: 20, borderRadius: 16 },
  activeRange: { backgroundColor: 'white', shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 2, elevation: 1 },
  rangeText: { fontSize: 13, fontWeight: '600', color: Colors.textLight },
  activeRangeText: { color: Colors.text },

  summaryBox: { alignItems: 'center', marginBottom: 20 },
  summaryLabel: { color: Colors.textLight, fontSize: 12, textTransform: 'uppercase', fontWeight: 'bold', marginBottom: 5 },
  summaryValue: { fontSize: 32, fontWeight: '900' },
  summaryUnit: { fontSize: 16, fontWeight: '600', color: Colors.textLight, marginLeft: 4, marginBottom: 6 },
  goalBadge: { backgroundColor: '#E5E7EB', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, marginTop: 8 },
  goalText: { color: Colors.textLight, fontSize: 12, fontWeight:'600' },

  noDataCard: { 
    backgroundColor: '#FEF3C7', 
    padding: 20, 
    borderRadius: 16, 
    alignItems: 'center', 
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#FCD34D'
  },
  noDataTitle: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    color: '#92400E', 
    marginTop: 10 
  },
  noDataText: { 
    fontSize: 13, 
    color: '#92400E', 
    textAlign: 'center', 
    marginTop: 5,
    opacity: 0.8
  },

  chartCard: { backgroundColor: 'white', borderRadius: 24, padding: 10, alignItems: 'center', shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 10, elevation: 3, marginBottom: 30 },
  
  sectionTitle: { fontSize: 14, fontWeight: 'bold', color: Colors.textLight, marginBottom: 15, textTransform:'uppercase' },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  metricBtn: { width: '48%', backgroundColor: 'white', padding: 15, borderRadius: 16, marginBottom: 10, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: 'transparent', shadowColor: "#000", shadowOpacity: 0.02, shadowRadius: 5, elevation: 1 },
  metricText: { marginLeft: 10, fontWeight: '600', color: Colors.textLight }
});