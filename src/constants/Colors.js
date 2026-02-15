const myColors = {
  primary: '#10B981',
  secondary: '#3B82F6',
  text: '#111827',
  textLight: '#6B7280',
  background: '#F8F9FA',
  white: '#FFFFFF',
  orange: '#F59E0B',
  danger: '#EF4444',
  tabBar: '#FFFFFF',
  border: '#E5E7EB',
  card: '#FFFFFF'
};

// 1. Export par défaut (pour: import Colors from...)
export default myColors;

// 2. Export nommé (pour: import { Colors } from...)
// C'EST ÇA QUI SAUVE TON APPLI SI UN FICHIER A DES ACCOLADES
export const Colors = myColors;