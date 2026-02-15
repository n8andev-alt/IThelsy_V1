import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useMutation, useQuery } from "convex/react";
import { useEffect, useState } from 'react';
import { Dimensions, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { api } from "../../convex/_generated/api";
import { AnimatedCard, AnimatedProgressBar } from '../components/AnimatedComponents';
import { SkeletonHeroCard, SkeletonMealCard } from '../components/SkeletonLoader';
import { ConfettiExplosion, Toast } from '../components/SuccessAnimations';
import Colors from '../constants/Colors';

const { width } = Dimensions.get('window');

// --- COMPOSANT BULLE INTELLIGENTE ---
const TutoBubble = ({ text, onNext, top, bottom, arrowAlign = 'center', side = 'top', isLast }) => {
    let alignItems = 'center';
    if (arrowAlign === 'left') alignItems = 'flex-start';
    if (arrowAlign === 'right') alignItems = 'flex-end';

    const arrowMargin = 25; 

    return (
        <View style={[styles.bubbleWrapper, top !== undefined ? { top } : { bottom }]}>
            
            {side === 'top' && (
                <View style={{ alignItems: alignItems, paddingHorizontal: arrowMargin }}>
                    <View style={styles.arrowUp} />
                </View>
            )}

            <View style={styles.bubbleContent}>
                <View style={{flexDirection:'row', alignItems:'flex-start'}}>
                    <Ionicons name="bulb" size={24} color="#F59E0B" style={{marginTop: 2, marginRight: 10}} />
                    <Text style={styles.bubbleText}>{text}</Text>
                </View>
                
                <TouchableOpacity onPress={onNext} style={styles.bubbleBtn}>
                    <Text style={styles.bubbleBtnText}>{isLast ? "Aller aux Recettes 👉" : "Suivant"}</Text>
                </TouchableOpacity>
            </View>

            {side === 'bottom' && (
                <View style={{ alignItems: alignItems, paddingHorizontal: arrowMargin }}>
                    <View style={styles.arrowDown} />
                </View>
            )}
        </View>
    );
};

export default function NutritionScreen({ navigation }) {
  const userData = useQuery(api.users.checkUser);
  
  const [tutoStep, setTutoStep] = useState(0);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
  const [showConfetti, setShowConfetti] = useState(false);

  const today = new Date().toISOString().split('T')[0];
  const dateStr = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
  const todayMeals = useQuery(api.meals.getToday, { date: today }) || [];
  
  const todayStats = useQuery(api.stats.getToday, { date: today });
  const saveWater = useMutation(api.users.logDailyWater);
  const [waterCount, setWaterCount] = useState(0);

  // Initialiser l'eau au chargement
  useEffect(() => {
  if (todayStats) {
    // Si todayStats existe, utilise sa valeur d'eau (même si 0)
    setWaterCount(todayStats.water || 0);
  } else {
    // Si todayStats n'existe pas encore (nouveau jour), reset à 0
    setWaterCount(0);
  }
}, [todayStats]);
  const consumed = {
    calories: todayMeals.reduce((acc, item) => acc + item.calories, 0),
    proteins: todayMeals.reduce((acc, item) => acc + item.proteins, 0),
    carbs: todayMeals.reduce((acc, item) => acc + item.carbs, 0),
    fats: todayMeals.reduce((acc, item) => acc + item.fats, 0),
    water: waterCount
  };

  // Démarrer le tuto si l'utilisateur ne l'a pas vu
  useEffect(() => {
    if (userData && userData.hasSeenTutorial !== true) {
      setTimeout(() => setTutoStep(1), 800);
    }
  }, [userData]);

  const handleNextStep = () => {
    if (tutoStep === 3) {
      // Step 3 : Aller directement aux Recettes
      setTutoStep(0);
      navigation.navigate('Recettes', { startTuto: true });
    } else {
      setTutoStep(tutoStep + 1);
    }
  };

  const glassSize = 250;

  if (!userData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <View style={styles.header}>
            <View>
              <View style={{ width: 150, height: 12, backgroundColor: '#E5E7EB', borderRadius: 4, marginBottom: 8 }} />
              <View style={{ width: 120, height: 28, backgroundColor: '#D1D5DB', borderRadius: 4 }} />
            </View>
            <View style={{ width: 60, height: 40, backgroundColor: '#E5E7EB', borderRadius: 20 }} />
          </View>
          <SkeletonHeroCard />
          <View style={{ width: 100, height: 16, backgroundColor: '#E5E7EB', borderRadius: 4, marginBottom: 12 }} />
          <SkeletonMealCard />
          <SkeletonMealCard />
          <SkeletonMealCard />
          <SkeletonMealCard />
        </View>
      </SafeAreaView>
    );
  }

  const targets = { 
    calories: userData.caloriesGoal || 2000, 
    proteins: userData.proteinsGoal || 150, 
    carbs: userData.carbsGoal || 250, 
    fats: userData.fatsGoal || 70, 
    water: userData.waterGoal || 2000 
  };
  
  const remainingCalories = Math.round(targets.calories - consumed.calories);
  const isOver = remainingCalories < 0;
  const glassesForGoal = Math.ceil(targets.water / glassSize);
  const filledGlasses = Math.min(Math.floor(waterCount / glassSize), glassesForGoal);
  
  const addWater = () => { 
    const n = waterCount + glassSize; 
    setWaterCount(n); 
    saveWater({ amount: n }); 
  };
  
  const removeWater = () => { 
    if (waterCount > 0) { 
      const n = waterCount - glassSize; 
      setWaterCount(n); 
      saveWater({ amount: n }); 
    } 
  };
  
  const handleAddMeal = (mealType) => { 
    navigation.navigate('MealEntry', { mealType }); 
  };
  
  const getMealsByType = (type) => todayMeals.filter(m => m.type === type);

  return (
    <SafeAreaView style={styles.container}>
      
      <ScrollView 
        contentContainerStyle={styles.content} 
        showsVerticalScrollIndicator={false} 
        scrollEnabled={tutoStep === 0}
      >
        
        {/* HEADER */}
        <View style={styles.header}>
          <View>
            <Text style={styles.date}>{dateStr}</Text>
            <Text style={styles.title}>Aujourd'hui</Text>
          </View>
        </View>

        {/* CARTE HERO */}
        <AnimatedCard delay={0} style={styles.heroCard}>
          <View style={styles.heroTop}>
            <View>
              <Text style={styles.calLabel}>{isOver ? 'Dépassement' : 'Calories restantes'}</Text>
              <View style={{flexDirection:'row', alignItems:'flex-end'}}>
                <Text style={[styles.calValue, isOver ? { color: Colors.orange } : null]}>
                  {isOver ? `+${Math.abs(remainingCalories)}` : remainingCalories}
                </Text>
                <Text style={styles.calUnit}>kcal</Text>
              </View>
            </View>
            <View style={[styles.ringContainer, { backgroundColor: '#FFF7ED' }]}>
              <Ionicons name="flame" size={28} color={Colors.orange} />
            </View>
          </View>

          <AnimatedProgressBar 
            progress={Math.min(consumed.calories / targets.calories, 1)}
            color={Colors.orange}
            height={8}
            style={{ marginBottom: 20 }}
          />

          <View style={styles.macroRow}>
            <MacroCapsule label="Protéines" current={consumed.proteins} total={targets.proteins} color={Colors.danger} icon="food-steak" />
            <MacroCapsule label="Glucides" current={consumed.carbs} total={targets.carbs} color={Colors.secondary} icon="barley" />
            <MacroCapsule label="Lipides" current={consumed.fats} total={targets.fats} color="#8B5CF6" icon="water" />
          </View>
        </AnimatedCard>

        {/* TUTO STEP 1 : Bulle sur la carte hero */}
        {tutoStep === 1 && (
          <TutoBubble
            text="Voici ton budget. Il diminue quand tu manges."
            onNext={handleNextStep}
            top={320}
            side="top"
            arrowAlign="center"
          />
        )}

        {/* SECTION REPAS */}
        <Text style={styles.sectionTitle}>Journal</Text>

        {/* TUTO STEP 2 : Bulle sur le bouton + */}
        {tutoStep === 2 && (
          <TutoBubble
            text="Clique sur le '+' pour ajouter ou scanner un repas."
            onNext={handleNextStep}
            top={440}
            side="top"
            arrowAlign="right"
          />
        )}

        <AnimatedCard delay={0}>
          <MealSection
            title="Petit-déjeuner"
            meals={getMealsByType('Petit-déjeuner')}
            onPress={() => handleAddMeal('Petit-déjeuner')}
            navigation={navigation}
            icon="cafe-outline"
            iconColor="#FF9F43"
          />
        </AnimatedCard>

        <AnimatedCard delay={100}>
          <MealSection
            title="Déjeuner"
            meals={getMealsByType('Déjeuner')}
            onPress={() => handleAddMeal('Déjeuner')}
            navigation={navigation}
            icon="sunny"
            iconColor="#FDBF2E"
          />
        </AnimatedCard>

        <AnimatedCard delay={200}>
          <MealSection
            title="Collation"
            meals={getMealsByType('Collation')}
            onPress={() => handleAddMeal('Collation')}
            navigation={navigation}
            icon="nutrition"
            iconColor="#2ECC71"
          />
        </AnimatedCard>

        <AnimatedCard delay={300}>
          <MealSection
            title="Dîner"
            meals={getMealsByType('Dîner')}
            onPress={() => handleAddMeal('Dîner')}
            navigation={navigation}
            icon="moon"
            iconColor="#5F27CD"
          />
        </AnimatedCard>

        {/* HYDRATATION */}
        <Text style={styles.sectionTitle}>Hydratation</Text>

        <AnimatedCard delay={400} style={styles.waterCard}>
          <View style={styles.waterHeader}>
            <View>
              <Text style={styles.waterTitle}>{consumed.water} ml</Text>
              <Text style={styles.waterSub}>Objectif : {targets.water} ml</Text>
            </View>
            <View style={styles.waterIconBox}>
              <Ionicons name="water" size={22} color="#3B82F6" />
            </View>
          </View>
          
          <AnimatedProgressBar 
            progress={Math.min(consumed.water / targets.water, 1)}
            color="#3B82F6"
            height={8}
            style={{ marginBottom: 20 }}
          />
          
          <View style={styles.glassContainer}>
            {Array.from({ length: glassesForGoal }).map((_, i) => (
              <TouchableOpacity 
                key={i} 
                onPress={i < filledGlasses ? removeWater : addWater} 
                style={styles.glassBtn}
              >
                <MaterialCommunityIcons 
                  name={i < filledGlasses ? "cup" : "cup-outline"} 
                  size={26} 
                  color="#3B82F6" 
                />
              </TouchableOpacity>
            ))}
            <TouchableOpacity onPress={addWater} style={styles.addWaterPlus}>
              <Ionicons name="add" size={20} color="white" />
            </TouchableOpacity>
          </View>
        </AnimatedCard>

      </ScrollView>

      {/* TUTO STEP 3 : Bulle finale (HORS ScrollView) */}
      {tutoStep === 3 && (
        <TutoBubble
          text="C'est tout pour l'accueil ! Allons voir tes recettes..."
          onNext={handleNextStep}
          bottom={0}
          side="bottom"
          arrowAlign="center"
          isLast={true}
        />
      )}

      {/* ANIMATIONS */}
      <Toast 
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast({ ...toast, visible: false })}
      />

      {showConfetti && <ConfettiExplosion onComplete={() => setShowConfetti(false)} />}

    </SafeAreaView>
  );
}

// --- SOUS-COMPOSANTS ---
const MacroCapsule = ({ label, current, total, color, icon }) => (
  <View style={[styles.macroCapsule, { backgroundColor: color + '10', borderColor: color + '30', borderWidth: 1 }]}>
    <View style={{flexDirection:'row', alignItems:'center', marginBottom:4}}>
      <MaterialCommunityIcons name={icon} size={16} color={color} style={{marginRight: 4}} />
      <Text style={[styles.macroLabel, {color: color}]}>{label}</Text>
    </View>
    <Text style={styles.macroValue}>
      {Math.round(current)}
      <Text style={{fontSize:12, fontWeight:'normal', color:Colors.textLight}}>/{total}g</Text>
    </Text>
    
    <AnimatedProgressBar 
      progress={Math.min(current / total, 1)}
      color={color}
      height={4}
    />
  </View>
);

const MealSection = ({ title, meals, onPress, navigation, icon, iconColor }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const totalKcal = meals.reduce((acc, m) => acc + m.calories, 0);

  return (
    <View style={styles.mealCard}>
      <TouchableOpacity
        style={styles.mealHeader}
        onPress={() => setIsExpanded(!isExpanded)}
        activeOpacity={0.7}
      >
        <View style={[styles.mealIconBox, { backgroundColor: iconColor + '15' }]}>
          <Ionicons name={icon} size={20} color={iconColor} />
        </View>
        <View style={{flex:1}}>
          <Text style={styles.mealTitle}>{title}</Text>
          {meals.length > 0 ? (
            <Text style={styles.mealSub}>{Math.round(totalKcal)} kcal</Text>
          ) : (
            <Text style={styles.mealEmpty}>Ajouter un repas</Text>
          )}
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={onPress}>
          <Ionicons name="add" size={20} color="white" />
        </TouchableOpacity>
      </TouchableOpacity>
      
      {isExpanded && meals.length > 0 && (
        <View style={styles.mealContent}>
          <View style={styles.divider} />
          {meals.map((item, index) => (
            <TouchableOpacity 
              key={index} 
              style={styles.foodRow} 
              onPress={() => navigation.navigate('MealDetails', { meal: item })}
            >
              <Text style={styles.foodName}>{item.name}</Text>
              <Text style={styles.foodKcal}>{Math.round(item.calories)}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  content: { padding: 20, paddingBottom: 90 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  date: { textTransform: 'uppercase', color: Colors.textLight, fontSize: 12, fontWeight: '700', marginBottom: 2 },
  title: { fontSize: 28, fontWeight: '800', color: Colors.text },
  
  heroCard: { backgroundColor: 'white', borderRadius: 24, padding: 20, marginBottom: 25, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 15 },
  calLabel: { fontSize: 14, color: Colors.textLight, fontWeight: '600', marginBottom: 5 },
  calValue: { fontSize: 40, fontWeight: '900', color: Colors.text, letterSpacing: -1 },
  calUnit: { fontSize: 16, color: Colors.textLight, fontWeight: '600', marginBottom: 6, marginLeft: 5 },
  ringContainer: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#FFF7ED', justifyContent: 'center', alignItems: 'center' },
  macroRow: { flexDirection: 'row', justifyContent: 'space-between' },
  macroCapsule: { width: '31%', borderRadius: 16, padding: 12 },
  macroLabel: { fontSize: 11, fontWeight: '700' },
  macroValue: { fontSize: 16, fontWeight: 'bold', color: Colors.text, marginVertical: 4 },
  
  sectionTitle: { fontSize: 15, fontWeight: '800', color: Colors.text, marginBottom: 12, marginTop: 5, textTransform: 'uppercase', letterSpacing: 0.5 },
  
  mealCard: { backgroundColor: 'white', borderRadius: 20, marginBottom: 15, shadowColor: "#000", shadowOpacity: 0.02, shadowRadius: 5, elevation: 1 },
  mealHeader: { flexDirection: 'row', alignItems: 'center', padding: 15 },
  mealIconBox: { width: 40, height: 40, borderRadius: 14, justifyContent:'center', alignItems:'center', marginRight: 15 },
  mealTitle: { fontSize: 16, fontWeight: '700', color: Colors.text },
  mealSub: { fontSize: 13, color: Colors.primary, fontWeight:'600' },
  mealEmpty: { fontSize: 12, color: Colors.textLight, fontStyle:'italic' },
  addBtn: { marginLeft:'auto', width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.primary, justifyContent:'center', alignItems:'center' },
  mealContent: { paddingHorizontal: 15, paddingBottom: 15 },
  divider: { height: 1, backgroundColor: '#F3F4F6', marginBottom: 10 },
  foodRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderTopWidth: 1, borderTopColor: '#F9FAFB' },
  foodName: { fontSize: 14, color: Colors.text, fontWeight:'500' },
  foodKcal: { fontSize: 14, fontWeight: '700', color: Colors.textLight },
  
  waterCard: { backgroundColor: 'white', borderRadius: 20, padding: 20, marginTop: 5, shadowColor: "#000", shadowOpacity: 0.03, shadowRadius: 8, elevation: 2 },
  waterHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  waterIconBox: { width: 40, height: 40, borderRadius: 14, backgroundColor: '#EFF6FF', justifyContent:'center', alignItems:'center' },
  waterTitle: { fontSize: 20, fontWeight: '800', color: Colors.text },
  waterSub: { fontSize: 13, color: Colors.textLight, fontWeight: '600' },
  glassContainer: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' },
  glassBtn: { marginRight: 12, marginBottom: 10 },
  addWaterPlus: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#3B82F6', justifyContent: 'center', alignItems: 'center', marginBottom: 10 },

  bubbleWrapper: { position: 'absolute', width: width - 40, left: 20, zIndex: 999 },
  bubbleContent: { backgroundColor: 'white', borderRadius: 16, padding: 15, shadowColor: "#000", shadowOpacity: 0.3, shadowRadius: 15, elevation: 20, borderWidth: 1, borderColor: '#F3F4F6' },
  bubbleText: { fontSize: 15, color: '#374151', lineHeight: 22, flex: 1, fontWeight: '500' },
  bubbleBtn: { marginTop: 10, backgroundColor: Colors.primary, paddingVertical: 10, paddingHorizontal: 20, borderRadius: 25, alignSelf: 'flex-end', flexDirection: 'row', alignItems: 'center' },
  bubbleBtnText: { color: 'white', fontWeight: 'bold', fontSize: 14 },
  arrowUp: { width: 0, height: 0, borderLeftWidth: 12, borderRightWidth: 12, borderBottomWidth: 12, borderStyle: 'solid', backgroundColor: 'transparent', borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: 'white', marginBottom: -1, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 2 },
  arrowDown: { width: 0, height: 0, borderLeftWidth: 12, borderRightWidth: 12, borderTopWidth: 12, borderStyle: 'solid', backgroundColor: 'transparent', borderLeftColor: 'transparent', borderRightColor: 'transparent', borderTopColor: 'white', marginTop: -1, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 2 }
});