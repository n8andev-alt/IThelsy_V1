import { useAuth, useUser } from "@clerk/clerk-expo";
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useMutation, useQuery } from "convex/react";
import * as ImagePicker from 'expo-image-picker';
import { useCallback, useState } from 'react';
import { Dimensions, Image, KeyboardAvoidingView, Modal, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { api } from "../../convex/_generated/api";
import { AnimatedCheckmark, Toast } from '../components/SuccessAnimations';
import Colors from '../constants/Colors';

const { width } = Dimensions.get('window');

// --- COMPOSANT BULLE ---
const TutoBubble = ({ text, onNext, top, bottom, arrowAlign = 'center', side = 'top', isLast }) => {
    let alignItems = 'center';
    if (arrowAlign === 'left') alignItems = 'flex-start';
    if (arrowAlign === 'right') alignItems = 'flex-end';
    const arrowMargin = 25; 

    return (
        <View style={[styles.bubbleWrapper, top !== undefined ? { top } : { bottom }]}>
            {side === 'top' && <View style={{ alignItems, paddingHorizontal: arrowMargin }}><View style={styles.arrowUp} /></View>}
            <View style={styles.bubbleContent}>
                <View style={{flexDirection:'row', alignItems:'flex-start'}}>
                    <Ionicons name="bulb" size={24} color="#F59E0B" style={{marginTop: 2, marginRight: 10}} />
                    <Text style={styles.bubbleText}>{text}</Text>
                </View>
                <TouchableOpacity onPress={onNext} style={styles.bubbleBtn}>
                    <Text style={styles.bubbleBtnText}>{isLast ? "C'est fini ! 🎉" : "Suivant"}</Text>
                </TouchableOpacity>
            </View>
            {side === 'bottom' && <View style={{ alignItems, paddingHorizontal: arrowMargin }}><View style={styles.arrowDown} /></View>}
        </View>
    );
};

export default function ProfileScreen({ navigation, route }) {
  const { signOut } = useAuth();
  const { user } = useUser();
  const userData = useQuery(api.users.checkUser);
  
  // 👇 ICI : ON DÉCLARE TOUTES LES MUTATIONS
  const updateProfileAndGoals = useMutation(api.users.updateWeightAndGoals);
  const logWeightMutation = useMutation(api.users.logWeight);
  const updateUserData = useMutation(api.users.updateUserData);
  const completeTutorial = useMutation(api.users.completeTutorial);

  // 🎉 ÉTATS POUR LES ANIMATIONS
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
  const [showCheckmark, setShowCheckmark] = useState(false);

  // GESTION DU TUTO
  const [tutoStep, setTutoStep] = useState(0);

  useFocusEffect(
    useCallback(() => {
      if (route.params?.startTuto) {
          setTimeout(() => setTutoStep(1), 500);
          navigation.setParams({ startTuto: undefined });
      }
    }, [route.params?.startTuto])
  );

  const handleNextStep = () => {
      if (tutoStep === 3) {
          setTutoStep(0);
          if (userData) completeTutorial(); 
          // 🎉 TOAST AU LIEU D'ALERT
          setToast({
            visible: true,
            message: 'Bravo ! Tu connais maintenant l\'app 🎓',
            type: 'success'
          });
      } else {
          setTutoStep(tutoStep + 1);
      }
  };

  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);
  
  const [formInfo, setFormInfo] = useState({ 
      name: '', weight: '', height: '', age: '', picture: null, weightGoal: '',
      goal: 'se maintenir', activity: 'modéré', difficulty: 'normal'
  });
  const [formGoal, setFormGoal] = useState({ cal: '', p: '', c: '', f: '', water: '' });

  const openInfoModal = () => {
    if (userData) {
      setFormInfo({
        name: userData.name || '',
        weight: userData.weight ? String(userData.weight) : '',
        height: userData.height ? String(userData.height) : '',
        age: userData.age ? String(userData.age) : '',
        picture: userData.picture || user?.imageUrl,
        weightGoal: userData.weightGoal ? String(userData.weightGoal) : '',
        goal: userData.goal || 'se maintenir',
        activity: userData.activityLevel || 'modéré',
        difficulty: userData.difficulty || 'normal'
      });
      setShowInfoModal(true);
    }
  };

  const openGoalModal = () => {
    if (userData) {
      setFormGoal({
        cal: userData.caloriesGoal ? String(userData.caloriesGoal) : '',
        p: userData.proteinsGoal ? String(userData.proteinsGoal) : '',
        c: userData.carbsGoal ? String(userData.carbsGoal) : '',
        f: userData.fatsGoal ? String(userData.fatsGoal) : '',
        water: userData.waterGoal ? String(userData.waterGoal) : ''
      });
      setShowGoalModal(true);
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.5,
    });
    if (!result.canceled) setFormInfo({ ...formInfo, picture: result.assets[0].uri });
  };

  // 👇 LA FONCTION INTELLIGENTE AVEC ANIMATIONS
  const saveInfos = async () => {
    try {
        const newWeight = parseFloat(formInfo.weight);
        
        await updateUserData({
            id: userData._id,
            name: formInfo.name,
            picture: formInfo.picture,
            weightGoal: parseFloat(formInfo.weightGoal)
        });

        const shouldRecalculate = 
            newWeight !== userData.weight ||
            formInfo.goal !== userData.goal || 
            formInfo.activity !== userData.activityLevel ||
            formInfo.difficulty !== userData.difficulty ||
            parseFloat(formInfo.height) !== userData.height ||
            parseFloat(formInfo.age) !== userData.age;

        if (shouldRecalculate) {
            await updateProfileAndGoals({
                newWeight: newWeight,
                newHeight: parseFloat(formInfo.height),
                newAge: parseFloat(formInfo.age),
                newGoal: formInfo.goal,
                newActivity: formInfo.activity,
                newDifficulty: formInfo.difficulty
            });
            
            // 🎉 ANIMATION DE SUCCÈS
            setShowInfoModal(false);
            setShowCheckmark(true);
            
            // Le checkmark se cache tout seul après son animation
            setTimeout(() => {
              setToast({
                visible: true,
                message: 'Plan recalculé avec succès ! 💪',
                type: 'success'
              });
            }, 1200);
        } else {
            // 🔔 TOAST SIMPLE
            setShowInfoModal(false);
            setToast({
              visible: true,
              message: 'Profil mis à jour ✅',
              type: 'success'
            });
        }

    } catch (err) {
        console.error(err);
        // 🔔 TOAST D'ERREUR
        setToast({
          visible: true,
          message: 'Erreur lors de la sauvegarde',
          type: 'error'
        });
    }
  };

  const saveGoals = async () => {
    try {
        await updateUserData({
            id: userData._id,
            caloriesGoal: parseFloat(formGoal.cal),
            proteinsGoal: parseFloat(formGoal.p),
            carbsGoal: parseFloat(formGoal.c),
            fatsGoal: parseFloat(formGoal.f),
            waterGoal: parseFloat(formGoal.water)
        });
        
        setShowGoalModal(false);

        // 🔔 TOAST DE SUCCÈS
        setToast({
          visible: true,
          message: 'Objectifs mis à jour ! 🎯',
          type: 'success'
        });
    } catch (err) {
      // 🔔 TOAST D'ERREUR
      setToast({
        visible: true,
        message: 'Erreur lors de la sauvegarde',
        type: 'error'
      });
    }
  };

  if (!userData) return null;
  const displayImage = userData.picture || user?.imageUrl;

  return (
    <SafeAreaView style={styles.container}>
      
      {/* BULLE 1 : SETTINGS */}
      {tutoStep === 1 && (
          <TutoBubble
              text={"Ici, accède aux réglages, contacte le support ou gère ton abonnement."}
              onNext={handleNextStep}
              top={110} side="top" arrowAlign="right"
          />
      )}

      {/* BULLE 2 : MES INFOS */}
      {tutoStep === 2 && (
          <TutoBubble
              text={"Clique ici pour modifier ton poids, ton âge ou ton objectif et voir ta progression."}
              onNext={handleNextStep}
              top={330} side="bottom" arrowAlign="center"
          />
      )}

      {/* BULLE 3 : GYMBRO */}
      {tutoStep === 3 && (
          <TutoBubble
              text={"Et enfin, l'espace GymBro pour défier tes amis !"}
              onNext={handleNextStep}
              bottom={30} side="bottom" arrowAlign="left" isLast={true}
          />
      )}

      <View style={styles.header}>
         <Text style={styles.headerTitle}>Mon Profil</Text>
         <TouchableOpacity onPress={() => navigation.navigate('Settings')} style={styles.settingsBtn}>
            <Ionicons name="settings-sharp" size={22} color={Colors.text} />
         </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} scrollEnabled={tutoStep === 0}>
        
        <View style={styles.profileSection}>
            <TouchableOpacity onPress={() => navigation.navigate('EditProfileInfo')} activeOpacity={0.9} style={styles.avatarWrapper}>
                {displayImage ? (
                    <Image source={{ uri: displayImage }} style={styles.avatar} />
                ) : (
                    <View style={styles.avatarPlaceholder}><Text style={styles.avatarLetter}>{userData.name?.charAt(0)}</Text></View>
                )}
                <View style={styles.editIconContainer}><Ionicons name="pencil" size={12} color="white" /></View>
            </TouchableOpacity>
            
            <Text style={styles.name}>{userData.name}</Text>
            <View style={styles.goalTag}>
                <Ionicons name="flame" size={14} color={Colors.orange} />
                <Text style={styles.goalText}>{userData.caloriesGoal || 0} kcal</Text>
            </View>
        </View>

        <View style={styles.statsContainer}>
            <StatBox label={"Poids"} value={userData.weight} unit="kg" icon="scale-outline" color="#3B82F6" />
            <StatBox label={"Objectif"} value={userData.weightGoal} unit="kg" icon="flag-outline" color="#10B981" />
            <StatBox label={"Activité"} value={userData.activityLevel} unit="" icon="walk-outline" color="#F59E0B" />
        </View>

        <Text style={styles.sectionTitle}>PARAMÈTRES</Text>
        <View style={styles.menuContainer}>
             <MenuRow icon="stats-chart" title={"Voir ma progression"} onPress={() => navigation.navigate('Progress')} color="#8B5CF6" />
             <View style={styles.divider} />
             <MenuRow
               icon="person-outline"
               title={"Modifier mes infos & Plan"}
               onPress={() => navigation.navigate('EditProfileInfo')}
               color={Colors.secondary}
             />
             <View style={styles.divider} />
             <MenuRow icon="calculator-outline" title={"Ajuster Objectifs (Manuel)"} onPress={openGoalModal} color={Colors.orange} />
        </View>

        <Text style={styles.sectionTitle}>COMMUNAUTÉ</Text>
        <TouchableOpacity style={styles.gymBroCard} onPress={() => navigation.navigate('GymBro')} activeOpacity={0.9}>
             <View style={styles.gymBroIconBox}><MaterialCommunityIcons name="arm-flex" size={24} color="white" /></View>
             <View style={{flex: 1, marginLeft: 15}}>
                 <Text style={styles.gymBroTitle}>Espace Gym Bro</Text>
                 <Text style={styles.gymBroSubtitle}>Défie tes amis & progresse !</Text>
             </View>
             <Ionicons name="chevron-forward" size={22} color="#D1D5DB" />
        </TouchableOpacity>
      </ScrollView>

      {/* --- MODALES --- */}
      <Modal visible={showInfoModal} transparent animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalOverlay}>
            <View style={styles.modalContent}>
                <ScrollView showsVerticalScrollIndicator={false}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Modifier mon Plan</Text>
                        <TouchableOpacity onPress={() => setShowInfoModal(false)} style={styles.closeModalBtn}>
                            <Ionicons name="close" size={20} color={Colors.textLight}/>
                        </TouchableOpacity>
                    </View>
                    <TouchableOpacity onPress={pickImage} style={styles.modalAvatarBox}>
                        {formInfo.picture ? <Image source={{uri:formInfo.picture}} style={styles.modalAvatar} /> : <Ionicons name="camera" size={35} color={Colors.primary} />}
                        <Text style={styles.changePhotoText}>Changer photo</Text>
                    </TouchableOpacity>
                    <Text style={styles.label}>Infos Perso</Text>
                    <TextInput style={styles.input} placeholder={"Nom"} value={formInfo.name} onChangeText={t=>setFormInfo({...formInfo, name:t})} />
                    <View style={{flexDirection:'row', justifyContent:'space-between'}}>
                        <View style={{width:'32%'}}><Text style={styles.subLabel}>Poids (kg)</Text><TextInput style={styles.input} keyboardType="numeric" value={formInfo.weight} onChangeText={t=>setFormInfo({...formInfo, weight:t})} /></View>
                        <View style={{width:'32%'}}><Text style={styles.subLabel}>Taille (cm)</Text><TextInput style={styles.input} keyboardType="numeric" value={formInfo.height} onChangeText={t=>setFormInfo({...formInfo, height:t})} /></View>
                        <View style={{width:'32%'}}><Text style={styles.subLabel}>Âge</Text><TextInput style={styles.input} keyboardType="numeric" value={formInfo.age} onChangeText={t=>setFormInfo({...formInfo, age:t})} /></View>
                    </View>
                    <Text style={[styles.label, {marginTop: 10}]}>Objectif Principal</Text>
                    <View style={styles.selectRow}>
                        <SelectBtn title={"Perdre"} val="perdre du poids" current={formInfo.goal} onSelect={v => setFormInfo({...formInfo, goal: v})} />
                        <SelectBtn title={"Maintenir"} val="se maintenir" current={formInfo.goal} onSelect={v => setFormInfo({...formInfo, goal: v})} />
                        <SelectBtn title={"Masse"} val="prendre de la masse" current={formInfo.goal} onSelect={v => setFormInfo({...formInfo, goal: v})} />
                    </View>
                    <Text style={[styles.label, {marginTop: 10}]}>Difficulté</Text>
                    <View style={styles.selectRow}>
                        <SelectBtn title={"Cool"} val="cool" current={formInfo.difficulty} onSelect={v => setFormInfo({...formInfo, difficulty: v})} />
                        <SelectBtn title={"Normal"} val="normal" current={formInfo.difficulty} onSelect={v => setFormInfo({...formInfo, difficulty: v})} />
                        <SelectBtn title={"Guerrier"} val="guerrier" current={formInfo.difficulty} onSelect={v => setFormInfo({...formInfo, difficulty: v})} />
                    </View>
                    <Text style={[styles.label, {marginTop: 10}]}>Activité</Text>
                    <View style={{flexDirection: 'row', flexWrap: 'wrap', justifyContent:'space-between'}}>
                        <SelectBtn title={"Sédentaire"} val="sédentaire" current={formInfo.activity} onSelect={v => setFormInfo({...formInfo, activity: v})} wide />
                        <SelectBtn title={"Léger"} val="léger" current={formInfo.activity} onSelect={v => setFormInfo({...formInfo, activity: v})} wide />
                        <SelectBtn title={"Modéré"} val="modéré" current={formInfo.activity} onSelect={v => setFormInfo({...formInfo, activity: v})} wide />
                        <SelectBtn title={"Intense"} val="intense" current={formInfo.activity} onSelect={v => setFormInfo({...formInfo, activity: v})} wide />
                    </View>
                    <View style={{marginTop: 10}}>
                        <Text style={styles.subLabel}>Poids Cible</Text>
                        <TextInput style={styles.input} keyboardType="numeric" value={formInfo.weightGoal} onChangeText={t=>setFormInfo({...formInfo, weightGoal:t})} />
                    </View>
                    <TouchableOpacity onPress={saveInfos} style={styles.saveBtn}><Text style={styles.saveBtnText}>Valider et Recalculer</Text></TouchableOpacity>
                    <View style={{height: 40}} />
                </ScrollView>
            </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={showGoalModal} transparent animationType="fade">
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalOverlay}>
            <View style={[styles.modalContent, {height: 'auto'}]}>
                <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Ajustement Manuel</Text>
                    <TouchableOpacity onPress={() => setShowGoalModal(false)} style={styles.closeModalBtn}><Ionicons name="close" size={20} color={Colors.textLight}/></TouchableOpacity>
                </View>
                <View style={{flexDirection:'row', justifyContent:'space-between'}}>
                    <View style={{width:'48%'}}><Text style={styles.label}>Calories</Text><TextInput style={styles.input} keyboardType="numeric" value={formGoal.cal} onChangeText={t=>setFormGoal({...formGoal, cal:t})} /></View>
                    <View style={{width:'48%'}}><Text style={styles.label}>Eau (ml)</Text><TextInput style={styles.input} keyboardType="numeric" value={formGoal.water} onChangeText={t=>setFormGoal({...formGoal, water:t})} /></View>
                </View>
                <Text style={styles.label}>Macros (P / G / L)</Text>
                <View style={{flexDirection:'row', justifyContent:'space-between'}}>
                    <TextInput style={[styles.input, {width:'30%', textAlign:'center'}]} placeholder="P" keyboardType="numeric" value={formGoal.p} onChangeText={t=>setFormGoal({...formGoal, p:t})} />
                    <TextInput style={[styles.input, {width:'30%', textAlign:'center'}]} placeholder="G" keyboardType="numeric" value={formGoal.c} onChangeText={t=>setFormGoal({...formGoal, c:t})} />
                    <TextInput style={[styles.input, {width:'30%', textAlign:'center'}]} placeholder="L" keyboardType="numeric" value={formGoal.f} onChangeText={t=>setFormGoal({...formGoal, f:t})} />
                </View>
                <TouchableOpacity onPress={saveGoals} style={styles.saveBtn}><Text style={styles.saveBtnText}>Enregistrer</Text></TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* 🎉 ANIMATIONS */}
      <Toast 
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast({ ...toast, visible: false })}
      />

      {showCheckmark && (
        <View style={styles.checkmarkOverlay}>
          <AnimatedCheckmark 
            size={120} 
            color="#10B981"
            onComplete={() => setShowCheckmark(false)} 
          />
        </View>
      )}

    </SafeAreaView>
  );
}

// --- SOUS COMPOSANTS ---
const SelectBtn = ({ title, val, current, onSelect, wide }) => {
    const isSelected = current.toLowerCase() === val.toLowerCase();
    return (
        <TouchableOpacity 
            onPress={() => onSelect(val)} 
            style={[
                styles.selectBtn, 
                wide ? {width: '48%', marginBottom: 8} : {flex: 1, marginHorizontal: 4},
                isSelected ? {backgroundColor: Colors.primary, borderColor: Colors.primary} : {backgroundColor: 'white', borderColor: '#E5E7EB'}
            ]}
        >
            <Text style={[styles.selectBtnText, isSelected ? {color: 'white'} : {color: Colors.text}]}>{title}</Text>
        </TouchableOpacity>
    );
};

const StatBox = ({ label, value, unit, icon, color }) => (
    <View style={styles.statBox}>
        <View style={[styles.statIconCircle, {backgroundColor: color + '15'}]}><Ionicons name={icon} size={18} color={color} /></View>
        <Text style={styles.statValue} numberOfLines={1}>{value || '-'} <Text style={{fontSize:12, fontWeight:'500', color:Colors.textLight}}>{unit}</Text></Text>
        <Text style={styles.statLabel}>{label}</Text>
    </View>
);

const MenuRow = ({ icon, title, onPress, color }) => (
    <TouchableOpacity style={styles.menuRow} onPress={onPress}>
        <View style={[styles.menuIconBox, { backgroundColor: color + '15' }]}><Ionicons name={icon} size={20} color={color} /></View>
        <Text style={styles.menuText}>{title}</Text>
        <Ionicons name="chevron-forward" size={18} color="#D1D5DB" />
    </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 25, paddingTop: 15, paddingBottom: 10 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: Colors.text },
  settingsBtn: { padding: 10, backgroundColor: 'white', borderRadius: 14, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 100 },
  profileSection: { alignItems: 'center', marginTop: 20, marginBottom: 25 },
  avatarWrapper: { marginBottom: 15, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 },
  avatar: { width: 100, height: 100, borderRadius: 50, borderWidth: 4, borderColor: 'white' },
  avatarPlaceholder: { width: 100, height: 100, borderRadius: 50, backgroundColor: Colors.primary, justifyContent:'center', alignItems:'center', borderWidth: 4, borderColor: 'white' },
  avatarLetter: { fontSize: 40, fontWeight:'bold', color: 'white' },
  editIconContainer: { position: 'absolute', bottom: 0, right: 0, backgroundColor: Colors.text, padding: 8, borderRadius: 20, borderWidth: 3, borderColor: 'white' },
  name: { fontSize: 24, fontWeight: 'bold', color: Colors.text, marginBottom: 6 },
  goalTag: { marginTop: 8, backgroundColor: '#FFF7ED', paddingHorizontal: 15, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#FFEDD5', flexDirection:'row', alignItems:'center' },
  goalText: { fontSize: 13, color: '#C2410C', fontWeight: '700' },
  statsContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 },
  statBox: { width: '31%', backgroundColor: 'white', paddingVertical: 15, borderRadius: 18, alignItems: 'center', shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 10, elevation: 3, paddingHorizontal: 5 },
  statIconCircle: { width: 34, height: 34, borderRadius: 17, justifyContent:'center', alignItems:'center', marginBottom: 8 },
  statValue: { fontSize: 16, fontWeight: 'bold', color: Colors.text, textAlign:'center' },
  statLabel: { fontSize: 11, color: Colors.textLight, marginTop: 2, fontWeight:'600' },
  sectionTitle: { fontSize: 13, fontWeight: '800', color: Colors.textLight, marginBottom: 12, marginLeft: 5, textTransform: 'uppercase', letterSpacing: 0.5 },
  menuContainer: { backgroundColor: 'white', borderRadius: 18, marginBottom: 25, shadowColor: "#000", shadowOpacity: 0.02, shadowRadius: 5, elevation: 2 },
  menuRow: { flexDirection: 'row', alignItems: 'center', padding: 18 },
  menuIconBox: { width: 38, height: 38, borderRadius: 12, justifyContent:'center', alignItems:'center', marginRight: 15 },
  menuText: { flex: 1, fontSize: 16, fontWeight: '600', color: Colors.text },
  divider: { height: 1, backgroundColor: '#F3F4F6', marginLeft: 70 },
  gymBroCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', padding: 12, paddingRight: 20, borderRadius: 20, marginBottom: 20, shadowColor: "#4F46E5", shadowOpacity: 0.1, shadowRadius: 10, elevation: 3, borderWidth: 1, borderColor: '#EEF2FF' },
  gymBroIconBox: { width: 50, height: 50, borderRadius: 16, backgroundColor: '#4F46E5', justifyContent:'center', alignItems:'center', marginRight: 15 },
  gymBroTitle: { fontSize: 16, fontWeight: '800', color: '#1E1B4B' },
  gymBroSubtitle: { fontSize: 13, color: '#6366F1', marginTop: 2, fontWeight: '500' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: 'white', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 25, paddingBottom: 40, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: Colors.text },
  closeModalBtn: { padding: 6, backgroundColor: '#F3F4F6', borderRadius: 20 },
  label: { fontSize: 13, fontWeight: '700', color: Colors.textLight, marginBottom: 8 },
  subLabel: { fontSize: 11, fontWeight: '600', color: Colors.textLight, marginBottom: 4 },
  input: { backgroundColor: '#F9FAFB', padding: 12, borderRadius: 14, fontSize: 15, color: Colors.text, borderWidth:1, borderColor: '#E5E7EB', marginBottom: 15, fontWeight:'600' },
  saveBtn: { backgroundColor: Colors.primary, padding: 18, borderRadius: 18, alignItems: 'center', marginTop: 15, shadowColor: Colors.primary, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  saveBtnText: { color: 'white', fontWeight: 'bold', fontSize: 17 },
  modalAvatarBox: { alignSelf:'center', marginBottom: 20, alignItems:'center' },
  modalAvatar: { width: 90, height: 90, borderRadius: 45 },
  changePhotoText: { color: Colors.primary, fontSize: 13, marginTop: 10, fontWeight: '700' },
  selectRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  selectBtn: { paddingVertical: 10, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  selectBtnText: { fontSize: 12, fontWeight: '700' },

  // 🎉 ANIMATIONS
  checkmarkOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },

  // --- STYLES TUTO BULLE ---
  bubbleWrapper: { position: 'absolute', width: width - 40, left: 20, zIndex: 999 },
  bubbleContent: { backgroundColor: 'white', padding: 15, borderRadius: 16, width: '100%', shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 10, elevation: 10, borderWidth: 1, borderColor: '#F3F4F6' },
  bubbleText: { fontSize: 15, color: '#374151', lineHeight: 22, flex: 1, fontWeight: '500' },
  bubbleBtn: { marginTop: 10, backgroundColor: Colors.primary, paddingVertical: 10, paddingHorizontal: 20, borderRadius: 25, alignSelf: 'flex-end', flexDirection: 'row', alignItems: 'center' },
  bubbleBtnText: { color: 'white', fontWeight: 'bold', fontSize: 14 },
  arrowUp: { width: 0, height: 0, borderLeftWidth: 12, borderRightWidth: 12, borderBottomWidth: 12, borderStyle: 'solid', backgroundColor: 'transparent', borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: 'white', marginBottom: -1, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 2 },
  arrowDown: { width: 0, height: 0, borderLeftWidth: 12, borderRightWidth: 12, borderTopWidth: 12, borderStyle: 'solid', backgroundColor: 'transparent', borderLeftColor: 'transparent', borderRightColor: 'transparent', borderTopColor: 'white', marginTop: -1, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 2 }
});