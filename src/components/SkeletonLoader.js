import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

// ANIMATION DE PULSATION
const usePulseAnimation = () => {
  const pulseAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.3,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return pulseAnim;
};

// COMPOSANT DE BASE
const SkeletonBox = ({ width, height, borderRadius = 8, style }) => {
  const opacity = usePulseAnimation();
  
  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: '#E5E7EB',
          opacity,
        },
        style,
      ]}
    />
  );
};

// SKELETON POUR LA HERO CARD (Nutrition)
export const SkeletonHeroCard = () => (
  <View style={styles.heroCard}>
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 }}>
      <View>
        <SkeletonBox width={120} height={16} style={{ marginBottom: 8 }} />
        <SkeletonBox width={100} height={40} />
      </View>
      <SkeletonBox width={50} height={50} borderRadius={25} />
    </View>
    <SkeletonBox width="100%" height={8} borderRadius={4} style={{ marginBottom: 20 }} />
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      <SkeletonBox width="31%" height={80} borderRadius={16} />
      <SkeletonBox width="31%" height={80} borderRadius={16} />
      <SkeletonBox width="31%" height={80} borderRadius={16} />
    </View>
  </View>
);

// SKELETON POUR UNE MEAL SECTION
export const SkeletonMealCard = () => (
  <View style={styles.mealCard}>
    <View style={{ flexDirection: 'row', alignItems: 'center', padding: 15 }}>
      <SkeletonBox width={40} height={40} borderRadius={14} style={{ marginRight: 15 }} />
      <View style={{ flex: 1 }}>
        <SkeletonBox width={120} height={16} style={{ marginBottom: 5 }} />
        <SkeletonBox width={80} height={12} />
      </View>
      <SkeletonBox width={32} height={32} borderRadius={16} />
    </View>
  </View>
);

// SKELETON POUR UNE RECIPE CARD
export const SkeletonRecipeCard = () => (
  <View style={styles.recipeCard}>
    <SkeletonBox width="100%" height={140} borderRadius={0} />
    <View style={{ padding: 16 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
        <SkeletonBox width={150} height={18} />
        <SkeletonBox width={50} height={14} />
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <SkeletonBox width={60} height={20} borderRadius={6} style={{ marginRight: 8 }} />
        <SkeletonBox width={100} height={14} />
      </View>
    </View>
  </View>
);

// SKELETON POUR LE PROFIL
export const SkeletonProfileHeader = () => (
  <View style={{ alignItems: 'center', marginTop: 20, marginBottom: 25 }}>
    <SkeletonBox width={100} height={100} borderRadius={50} style={{ marginBottom: 15 }} />
    <SkeletonBox width={150} height={24} style={{ marginBottom: 10 }} />
    <SkeletonBox width={100} height={20} borderRadius={20} />
  </View>
);

const styles = StyleSheet.create({
  heroCard: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 20,
    marginBottom: 25,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  mealCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 5,
    elevation: 1,
  },
  recipeCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    marginBottom: 18,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
});

export default SkeletonBox;