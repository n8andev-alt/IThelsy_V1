import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useEffect, useRef } from 'react';
import { Animated, Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Colors from '../constants/Colors';

const { width, height } = Dimensions.get('window');

// 🎊 COMPOSANT CONFETTI
export const ConfettiPiece = ({ delay, x, color }) => {
  const translateY = useRef(new Animated.Value(0)).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: height,
        duration: 3000 + Math.random() * 1000,
        delay,
        useNativeDriver: true,
      }),
      Animated.loop(
        Animated.timing(rotate, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        })
      ),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 3000,
        delay: delay + 1000,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const rotateInterpolate = rotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View
      style={[
        styles.confetti,
        {
          left: x,
          backgroundColor: color,
          transform: [{ translateY }, { rotate: rotateInterpolate }],
          opacity,
        },
      ]}
    />
  );
};

// 🎉 COMPOSANT CONFETTI COMPLET
export const ConfettiExplosion = ({ onComplete }) => {
  const colors = [Colors.primary, '#F59E0B', '#EF4444', '#10B981', '#8B5CF6', '#EC4899'];
  const confettiCount = 50;

  useEffect(() => {
    // Haptic feedback fort
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    // Auto-cleanup après 4 secondes
    const timer = setTimeout(() => {
      if (onComplete) onComplete();
    }, 4000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.confettiContainer} pointerEvents="none">
      {[...Array(confettiCount)].map((_, i) => (
        <ConfettiPiece
          key={i}
          delay={i * 30}
          x={Math.random() * width}
          color={colors[Math.floor(Math.random() * colors.length)]}
        />
      ))}
    </View>
  );
};

// ✅ COMPOSANT CHECKMARK ANIMÉ
export const AnimatedCheckmark = ({ size = 80, color = '#10B981', onComplete }) => {
  const scale = useRef(new Animated.Value(0)).current;
  const checkScale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Haptic feedback léger
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    Animated.sequence([
      Animated.spring(scale, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.spring(checkScale, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (onComplete) {
        setTimeout(onComplete, 800);
      }
    });
  }, []);

  return (
    <View style={styles.checkmarkContainer}>
      <Animated.View
        style={[
          styles.checkmarkCircle,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: color + '20',
            transform: [{ scale }],
          },
        ]}
      >
        <Animated.View style={{ transform: [{ scale: checkScale }] }}>
          <Ionicons name="checkmark-circle" size={size} color={color} />
        </Animated.View>
      </Animated.View>
    </View>
  );
};

// 🔔 TOAST NOTIFICATION
export const Toast = ({ message, type = 'success', visible, onHide }) => {
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Haptic feedback
      Haptics.notificationAsync(
        type === 'success' 
          ? Haptics.NotificationFeedbackType.Success 
          : type === 'error'
          ? Haptics.NotificationFeedbackType.Error
          : Haptics.NotificationFeedbackType.Warning
      );

      // Animation d'entrée
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 60,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto-hide après 3 secondes
      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(translateY, {
            toValue: -100,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start(() => {
          if (onHide) onHide();
        });
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  if (!visible) return null;

  const getToastConfig = () => {
    switch (type) {
      case 'success':
        return { bg: '#10B981', icon: 'checkmark-circle', iconColor: 'white' };
      case 'error':
        return { bg: '#EF4444', icon: 'close-circle', iconColor: 'white' };
      case 'warning':
        return { bg: '#F59E0B', icon: 'warning', iconColor: 'white' };
      case 'info':
        return { bg: '#3B82F6', icon: 'information-circle', iconColor: 'white' };
      default:
        return { bg: '#10B981', icon: 'checkmark-circle', iconColor: 'white' };
    }
  };

  const config = getToastConfig();

  return (
    <Animated.View
      style={[
        styles.toast,
        {
          backgroundColor: config.bg,
          transform: [{ translateY }],
          opacity,
        },
      ]}
    >
      <Ionicons name={config.icon} size={24} color={config.iconColor} />
      <Text style={styles.toastText}>{message}</Text>
    </Animated.View>
  );
};

// 💫 OVERLAY DE SUCCÈS COMPLET (Utilisé dans OnboardingScreen)
export const SuccessOverlay = ({ visible, title, subtitle, onComplete }) => {
  const scale = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Haptic feedback fort
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      Animated.parallel([
        Animated.spring(scale, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto-complete après 2 secondes
      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(scale, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start(() => {
          if (onComplete) onComplete();
        });
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View style={[styles.successOverlay, { opacity }]}>
      <Animated.View style={[styles.successCard, { transform: [{ scale }] }]}>
        <View style={styles.successIconCircle}>
          <Ionicons name="checkmark-circle" size={80} color="#10B981" />
        </View>
        <Text style={styles.successTitle}>{title || 'Succès ! 🎉'}</Text>
        <Text style={styles.successSubtitle}>{subtitle || 'Action réussie'}</Text>
      </Animated.View>
    </Animated.View>
  );
};

// 🎯 BOUTON AVEC ANIMATION AU CLIC
export const AnimatedButton = ({ onPress, children, style, haptic = true }) => {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (haptic) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    Animated.spring(scale, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}
        style={style}
        activeOpacity={1}
      >
        {children}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  // CONFETTI
  confettiContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
    pointerEvents: 'none',
  },
  confetti: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 2,
  },

  // CHECKMARK
  checkmarkContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkCircle: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  // TOAST
  toast: {
    position: 'absolute',
    top: 0,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
    zIndex: 9999,
    gap: 12,
  },
  toastText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
  },

  // SUCCESS OVERLAY
  successOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  successCard: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 40,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    width: width * 0.8,
  },
  successIconCircle: {
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: Colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  successSubtitle: {
    fontSize: 16,
    color: Colors.textLight,
    textAlign: 'center',
  },
});