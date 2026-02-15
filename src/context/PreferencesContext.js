import { createContext, useContext } from 'react';
import Colors from '../constants/Colors';

// On crée un "Faux Thème" qui utilise nos couleurs fixes
const staticTheme = {
  background: Colors.background,
  card: Colors.white,
  text: Colors.text,
  textLight: Colors.textLight,
  border: Colors.border,
  primary: Colors.primary,
  tabBar: Colors.white,
  input: '#F9FAFB' // Couleur claire par défaut pour les inputs
};

// Une fausse fonction de traduction qui renvoie juste le texte (ou des valeurs par défaut)
const staticT = (key) => {
    const defaults = {
        settings: "Paramètres",
        logout: "Se déconnecter",
        cancel: "Annuler",
        // ... on peut laisser vide, ça affichera la clé au pire, mais ça ne plantera pas
    };
    return defaults[key] || key;
};

// Le Contexte
const PreferencesContext = createContext({
    theme: staticTheme,
    t: staticT,
    language: 'fr',
    themeName: 'Clair',
    setLanguage: () => {},
    setThemeName: () => {},
});

export const PreferencesProvider = ({ children }) => {
  return (
    <PreferencesContext.Provider value={{ 
      theme: staticTheme, 
      t: staticT,
      language: 'fr',
      themeName: 'Clair',
      setLanguage: () => {}, // Fonctions vides pour ne pas faire planter les boutons
      setThemeName: () => {},
    }}>
      {children}
    </PreferencesContext.Provider>
  );
};

export const usePreferences = () => useContext(PreferencesContext);