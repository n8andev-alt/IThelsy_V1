import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery } from "convex/react";
import { useMemo } from 'react';
import { ActivityIndicator, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { api } from "../../convex/_generated/api";
import Colors from '../constants/Colors';

// Config Français
LocaleConfig.locales['fr'] = {
  monthNames: ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'],
  monthNamesShort: ['Janv.','Févr.','Mars','Avril','Mai','Juin','Juil.','Août','Sept.','Oct.','Nov.','Déc.'],
  dayNames: ['Dimanche','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'],
  dayNamesShort: ['Dim.','Lun.','Mar.','Mer.','Jeu.','Ven.','Sam.'],
  today: "Aujourd'hui"
};
LocaleConfig.defaultLocale = 'fr';

export default function NutritionCalendarScreen({ navigation }) {
  const userData = useQuery(api.users.checkUser);
  const allMeals = useQuery(api.meals.getAll);

  // --- LOGIQUE DES COULEURS ---
  const markedDates = useMemo(() => {
    if (!allMeals || !userData) return {};

    const history = {}; 
    allMeals.forEach(meal => {
        if (!history[meal.date]) history[meal.date] = { cal: 0, prot: 0 };
        history[meal.date].cal += meal.calories;
        history[meal.date].prot += meal.proteins;
    });

    const calGoal = userData.caloriesGoal || 2000;
    const protGoal = userData.proteinsGoal || 150;
    const marks = {};

    Object.keys(history).forEach(date => {
        const dayData = history[date];
        const success = (dayData.cal >= calGoal * 0.9) && (dayData.prot >= protGoal * 0.9);
        
        // Note: Pour afficher les jours où un gel a été utilisé (bleu),
        // il faudrait stocker l'historique des gels en base de données.
        // Pour l'instant, on affiche Vert (Succès) ou Rouge (Raté).
        
        if (success) {
            marks[date] = {
                customStyles: {
                    container: { backgroundColor: '#ECFDF5', borderRadius: 7 },
                    text: { color: '#047857', fontWeight: 'bold' }
                }
            };
        } else {
             marks[date] = {
                customStyles: {
                    container: { backgroundColor: '#FEF2F2', borderRadius: 7 },
                    text: { color: '#EF4444', fontWeight: 'bold' }
                }
             };
        }
    });

    return marks;
  }, [allMeals, userData]);

  if (!userData) return <SafeAreaView style={styles.loading}><ActivityIndicator color={Colors.primary} /></SafeAreaView>;

  return (
    <SafeAreaView style={styles.container}>
      
      {/* HEADER NAVIGATION */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Calendrier Nutrition</Text>
        <View style={{width: 24}} />
      </View>

      <View style={styles.content}>
        
        {/* BLOC STATS (3 COLONNES) */}
        <View style={styles.statsCard}>
            
            {/* SÉRIE ACTUELLE */}
            <View style={styles.statItem}>
                <Text style={styles.statLabel}>Série</Text>
                <View style={{flexDirection:'row', alignItems:'center'}}>
                    <MaterialCommunityIcons name="apple" size={24} color={Colors.primary} />
                    <Text style={styles.statValue}>{userData.streakNutrition || 0}</Text>
                </View>
            </View>

            <View style={styles.divider} />
            
            {/* MEILLEURE SÉRIE */}
            <View style={styles.statItem}>
                <Text style={styles.statLabel}>Best</Text>
                <View style={{flexDirection:'row', alignItems:'center'}}>
                    <Ionicons name="trophy" size={20} color="#F59E0B" />
                    <Text style={styles.statValue}>{userData.streakNutrition || 0}</Text>
                </View>
            </View>

            <View style={styles.divider} />

            {/* GELS */}
            <View style={styles.statItem}>
                <Text style={styles.statLabel}>Gels</Text>
                <View style={{flexDirection:'row', alignItems:'center'}}>
                    <MaterialCommunityIcons name="snowflake" size={20} color="#3B82F6" />
                    <Text style={[styles.statValue, {color: '#3B82F6'}]}>
                        {userData.streakFreezes !== undefined ? userData.streakFreezes : 3}
                    </Text>
                </View>
            </View>

        </View>

        {/* CALENDRIER */}
        <View style={styles.calendarContainer}>
            <Calendar
                markingType={'custom'}
                markedDates={markedDates}
                theme={{
                    backgroundColor: '#ffffff',
                    calendarBackground: '#ffffff',
                    textSectionTitleColor: '#b6c1cd',
                    selectedDayBackgroundColor: Colors.primary,
                    selectedDayTextColor: '#ffffff',
                    todayTextColor: Colors.primary,
                    dayTextColor: '#2d4150',
                    textDisabledColor: '#d9e1e8',
                    dotColor: '#00adf5',
                    selectedDotColor: '#ffffff',
                    arrowColor: Colors.primary,
                    monthTextColor: Colors.text,
                    indicatorColor: Colors.primary,
                    textDayFontWeight: '600',
                    textMonthFontWeight: 'bold',
                    textDayHeaderFontWeight: '500',
                    textDayFontSize: 16,
                }}
            />
        </View>

    {/* PLUS DE LÉGENDE ICI */}

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  loading: { flex:1, justifyContent:'center', alignItems:'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, alignItems: 'center' },
  backBtn: { padding: 5 },
  title: { fontSize: 18, fontWeight: 'bold', color: Colors.text },
  
  content: { padding: 20 },

  statsCard: { flexDirection: 'row', backgroundColor: 'white', borderRadius: 20, padding: 20, marginBottom: 25, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 10, elevation: 5 },
  statItem: { flex: 1, alignItems: 'center' },
  statLabel: { fontSize: 12, color: Colors.textLight, marginBottom: 5, textTransform: 'uppercase', fontWeight: 'bold' },
  statValue: { fontSize: 20, fontWeight: '900', color: Colors.text, marginLeft: 5 },
  divider: { width: 1, backgroundColor: '#F3F4F6', marginHorizontal: 5 },

  calendarContainer: { backgroundColor: 'white', borderRadius: 20, padding: 10, shadowColor: "#000", shadowOpacity: 0.03, shadowRadius: 10, elevation: 3 },
});