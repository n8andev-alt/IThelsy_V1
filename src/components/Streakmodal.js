import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useMutation } from "convex/react";
import { useEffect, useRef } from 'react';
import { Animated, Dimensions, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { api } from "../../convex/_generated/api";
import Colors from '../constants/Colors';

const { width } = Dimensions.get('window');

export default function StreakModal({ visible, onClose, streakData }) {
  const scale = useRef(new Animated.Value(0)).current;
  const useFreeze = useMutation(api.users.useStreakFreeze);
  const resetStreak = useMutation(api.users.resetStreak);

  useEffect(() => {
    if (visible) {
      Animated.spring(scale, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }).start();
    } else {
      scale.setValue(0);
    }
  }, [visible]);

  const handleUseFreeze = async () => {
    try {
      await useFreeze();
      onClose(true); // true = série sauvée
    } catch (error) {
      console.error(error);
    }
  };

  const handleRestart = async () => {
    try {
      await resetStreak();
      onClose(false); // false = série perdue
    } catch (error) {
      console.error(error);
    }
  };

  if (!visible || !streakData) return null;

  const { streak, freezes } = streakData;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => {}}
    >
      <View style={styles.overlay}>
        <Animated.View style={[styles.modal, { transform: [{ scale }] }]}>
          
          {/* ICÔNE */}
          <View style={styles.iconCircle}>
            <MaterialCommunityIcons name="fire-alert" size={60} color="#EF4444" />
          </View>

          {/* TITRE */}
          <Text style={styles.title}>Tu as raté hier ! 😱</Text>
          
          {/* DESCRIPTION */}
          <Text style={styles.description}>
            Ta série de <Text style={styles.highlight}>{streak} jour{streak > 1 ? 's' : ''}</Text> est en danger !
          </Text>

          {/* INFO GELS */}
          <View style={styles.freezeInfo}>
            <MaterialCommunityIcons name="snowflake" size={24} color="#3B82F6" />
            <Text style={styles.freezeText}>
              Tu as <Text style={styles.freezeCount}>{freezes}</Text> gel{freezes > 1 ? 's' : ''} disponible{freezes > 1 ? 's' : ''}
            </Text>
          </View>

          {/* BOUTONS */}
          <View style={styles.buttons}>
            {freezes > 0 ? (
              <TouchableOpacity 
                style={[styles.button, styles.primaryButton]}
                onPress={handleUseFreeze}
                activeOpacity={0.9}
              >
                <MaterialCommunityIcons name="snowflake" size={20} color="white" style={{ marginRight: 8 }} />
                <Text style={styles.primaryButtonText}>Utiliser un gel ❄️</Text>
              </TouchableOpacity>
            ) : null}

            <TouchableOpacity 
              style={[styles.button, styles.secondaryButton]}
              onPress={handleRestart}
              activeOpacity={0.9}
            >
              <Ionicons name="refresh" size={20} color="#EF4444" style={{ marginRight: 8 }} />
              <Text style={styles.secondaryButtonText}>
                {freezes > 0 ? 'Recommencer ma série' : 'OK, je recommence'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* ASTUCE */}
          {freezes === 0 && (
            <View style={styles.tip}>
              <Ionicons name="information-circle" size={16} color={Colors.textLight} />
              <Text style={styles.tipText}>
                Gagne +1 gel tous les 7 jours de série !
              </Text>
            </View>
          )}

        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 30,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: Colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: Colors.textLight,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 24,
  },
  highlight: {
    fontWeight: 'bold',
    color: Colors.primary,
  },
  freezeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  freezeText: {
    fontSize: 15,
    color: Colors.text,
    marginLeft: 10,
    fontWeight: '600',
  },
  freezeCount: {
    fontWeight: 'bold',
    color: '#3B82F6',
    fontSize: 18,
  },
  buttons: {
    width: '100%',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: '#3B82F6',
    shadowColor: '#3B82F6',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  secondaryButtonText: {
    color: '#EF4444',
    fontSize: 15,
    fontWeight: '700',
  },
  tip: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  tipText: {
    fontSize: 13,
    color: Colors.textLight,
    marginLeft: 6,
    fontWeight: '500',
  },
});