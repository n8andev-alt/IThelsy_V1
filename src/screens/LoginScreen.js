import { useOAuth, useSignIn, useSignUp } from "@clerk/clerk-expo";
import { Ionicons } from '@expo/vector-icons';
import * as AuthSession from "expo-auth-session";
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import Colors from "../constants/Colors";
import { useWarmUpBrowser } from "../hooks/useWarmUpBrowser";

const { width } = Dimensions.get("window");

export default function LoginScreen() {
  useWarmUpBrowser();

  const { startOAuthFlow } = useOAuth({ strategy: "oauth_google" });
  const { signIn, setActive: setActiveSignIn } = useSignIn();
  const { signUp, setActive: setActiveSignUp } = useSignUp();

  const [showEmailForm, setShowEmailForm] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  // GOOGLE OAUTH
  const onGoogleAuth = async () => {
    try {
      setLoading(true);
      const redirectUrl = AuthSession.makeRedirectUri({
        scheme: "ithelsy",
        path: "oauth-native-callback",
      });
      const { createdSessionId, setActive } = await startOAuthFlow({ redirectUrl });

      // Vérifier que createdSessionId et setActive existent
      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
      } else {
        // L'utilisateur a probablement annulé le flux OAuth
        console.log("OAuth flow cancelled or incomplete");
      }
    } catch (err) {
      console.error("OAuth error", err);
      // Ne pas afficher d'erreur si l'utilisateur a simplement annulé
      if (err.message && !err.message.includes('cancel')) {
        Alert.alert("Erreur", "Connexion Google impossible");
      }
    } finally {
      setLoading(false);
    }
  };

  // EMAIL/PASSWORD SIGN IN
  const onSignIn = async () => {
    if (!email || !password) {
      Alert.alert("Erreur", "Remplis tous les champs");
      return;
    }

    try {
      setLoading(true);
      
      const result = await signIn.create({
        identifier: email,
        password: password,
      });

      // ✅ CAS 1 : Session créée directement (email déjà vérifié)
      if (result.createdSessionId) {
        await setActiveSignIn({ session: result.createdSessionId });
        return;
      }

      // ⚠️ CAS 2 : Email pas encore vérifié
      if (result.status === "needs_first_factor") {
        Alert.alert(
          "Vérification requise",
          "Ton email n'est pas encore vérifié. Vérifie ta boîte mail et clique sur le lien."
        );
        return;
      }

      // ⚠️ CAS 3 : Autre cas
      Alert.alert("Erreur", "Impossible de se connecter. Réessaye ou crée un compte.");

    } catch (err) {
      console.error("Sign in error", err);
      
      if (err.errors) {
        const errorMessage = err.errors[0]?.message || "Email ou mot de passe incorrect";
        Alert.alert("Erreur", errorMessage);
      } else {
        Alert.alert("Erreur", "Email ou mot de passe incorrect");
      }
    } finally {
      setLoading(false);
    }
  };

  // EMAIL/PASSWORD SIGN UP
  const onSignUp = async () => {
    if (!email || !password) {
      Alert.alert("Erreur", "Remplis tous les champs");
      return;
    }

    if (password.length < 8) {
      Alert.alert("Erreur", "Le mot de passe doit contenir au moins 8 caractères");
      return;
    }

    try {
      setLoading(true);
      
      await signUp.create({
        emailAddress: email,
        password: password,
      });

      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });

      // ✅ Passer en mode vérification
      setIsVerifying(true);

    } catch (err) {
      console.error("Sign up error", err);
      if (err.errors) {
        const errorMessage = err.errors[0]?.message || "Impossible de créer le compte";
        Alert.alert("Erreur", errorMessage);
      } else {
        Alert.alert("Erreur", "Impossible de créer le compte");
      }
    } finally {
      setLoading(false);
    }
  };

  // VÉRIFIER LE CODE
  const onVerifyCode = async () => {
    if (verificationCode.length !== 6) {
      Alert.alert("Erreur", "Le code doit contenir 6 chiffres");
      return;
    }

    try {
      setLoading(true);
      const result = await signUp.attemptEmailAddressVerification({ 
        code: verificationCode 
      });
      await setActiveSignUp({ session: result.createdSessionId });
    } catch (err) {
      console.error("Verification error", err);
      Alert.alert("Erreur", "Code incorrect");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          
          {/* LOGO / TITRE */}
          <View style={styles.header}>
            <Image
              source={require('../../assets/icon.png')}
              style={styles.logo}
            />
            <Text style={styles.appName}>IThelsy</Text>
            <Text style={styles.slogan}>Ton coach nutrition & santé</Text>
          </View>

          {/* CONTENU */}
          <View style={styles.content}>
            <Text style={styles.welcomeText}>
              {isVerifying
                ? "Vérifie ton email"
                : showEmailForm
                  ? (isSignUp ? "Crée ton compte" : "Bon retour !")
                  : "Prêt à transformer ta santé ?"}
            </Text>
            
            {!showEmailForm ? (
              <>
                {/* BOUTON GOOGLE */}
                <TouchableOpacity 
                  style={styles.googleButton} 
                  onPress={onGoogleAuth} 
                  activeOpacity={0.8}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <>
                      <Ionicons name="logo-google" size={22} color="white" style={{ marginRight: 10 }} />
                      <Text style={styles.btnText}>Continuer avec Google</Text>
                    </>
                  )}
                </TouchableOpacity>

                {/* DIVIDER "ou" */}
                <View style={styles.divider}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>ou</Text>
                  <View style={styles.dividerLine} />
                </View>

                {/* BOUTON EMAIL */}
                <TouchableOpacity
                  style={styles.emailButton}
                  onPress={() => setShowEmailForm(true)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="mail-outline" size={20} color={Colors.primary} style={{ marginRight: 10 }} />
                  <Text style={styles.emailBtnText}>Continuer avec Email</Text>
                </TouchableOpacity>
              </>
            ) : isVerifying ? (
              // ✅ ÉCRAN DE VÉRIFICATION
              <View style={styles.formContainer}>
                
                <View style={styles.verificationHeader}>
                  <View style={styles.verificationIconContainer}>
                    <Ionicons name="mail-open" size={40} color={Colors.primary} />
                  </View>
                  <Text style={styles.verificationTitle}>Vérifie ton email</Text>
                  <Text style={styles.verificationSubtitle}>
                    Nous avons envoyé un code à {'\n'}
                    <Text style={styles.verificationEmail}>{email}</Text>
                  </Text>
                </View>

                {/* INPUT CODE */}
                <View style={styles.inputWrapper}>
                  <Text style={styles.inputLabel}>Code de vérification</Text>
                  <View style={styles.codeInputContainer}>
                    <Ionicons name="keypad" size={20} color={Colors.textLight} style={styles.inputIcon} />
                    <TextInput
                      style={styles.codeInput}
                      placeholder="123456"
                      placeholderTextColor={Colors.textLight}
                      value={verificationCode}
                      onChangeText={(text) => {
                        // ✅ N'accepter QUE des chiffres
                        const numericText = text.replace(/[^0-9]/g, '');
                        if (numericText.length <= 6) {
                          setVerificationCode(numericText);
                        }
                      }}
                      keyboardType="number-pad"
                      maxLength={6}
                      autoFocus
                    />
                  </View>
                  <Text style={styles.codeHint}>
                    Le code est valide pendant 10 minutes
                  </Text>
                </View>

                {/* BOUTON VÉRIFIER */}
                <TouchableOpacity 
                  style={[
                    styles.submitButton,
                    verificationCode.length !== 6 && styles.submitButtonDisabled
                  ]} 
                  onPress={onVerifyCode}
                  disabled={loading || verificationCode.length !== 6}
                  activeOpacity={0.8}
                >
                  {loading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text style={styles.submitButtonText}>
                      Vérifier le code
                    </Text>
                  )}
                </TouchableOpacity>

                {/* RENVOYER LE CODE */}
                <TouchableOpacity
                  style={styles.resendButton}
                  onPress={async () => {
                    try {
                      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
                      Alert.alert("✅", "Code renvoyé ! Vérifie ton email.");
                    } catch (err) {
                      Alert.alert("Erreur", "Impossible de renvoyer le code");
                    }
                  }}
                >
                  <Text style={styles.resendText}>
                    Tu n'as pas reçu le code ? <Text style={styles.resendTextBold}>Renvoyer</Text>
                  </Text>
                </TouchableOpacity>

                {/* BOUTON RETOUR */}
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={() => {
                    setIsVerifying(false);
                    setVerificationCode("");
                    setEmail("");
                    setPassword("");
                  }}
                >
                  <Ionicons name="arrow-back" size={18} color={Colors.textLight} style={{ marginRight: 6 }} />
                  <Text style={styles.backButtonText}>Modifier l'email</Text>
                </TouchableOpacity>

              </View>
            ) : (
              // FORMULAIRE EMAIL
              <View style={styles.formContainer}>
                
                {/* EMAIL INPUT */}
                <View style={styles.inputWrapper}>
                  <Text style={styles.inputLabel}>Email</Text>
                  <View style={styles.inputContainer}>
                    <Ionicons name="mail-outline" size={20} color={Colors.textLight} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="exemple@email.com"
                      placeholderTextColor={Colors.textLight}
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>
                </View>

                {/* PASSWORD INPUT */}
                <View style={styles.inputWrapper}>
                  <Text style={styles.inputLabel}>Mot de passe</Text>
                  <View style={styles.inputContainer}>
                    <Ionicons name="lock-closed-outline" size={20} color={Colors.textLight} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="••••••••"
                      placeholderTextColor={Colors.textLight}
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                    />
                    <TouchableOpacity 
                      onPress={() => setShowPassword(!showPassword)}
                      style={styles.eyeIcon}
                    >
                      <Ionicons 
                        name={showPassword ? "eye-off-outline" : "eye-outline"} 
                        size={20} 
                        color={Colors.textLight} 
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* SUBMIT BUTTON */}
                <TouchableOpacity
                  style={styles.submitButton}
                  onPress={isSignUp ? onSignUp : onSignIn}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  {loading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text style={styles.submitButtonText}>
                      {isSignUp ? "S'inscrire" : "Se connecter"}
                    </Text>
                  )}
                </TouchableOpacity>

                {/* TOGGLE SIGN IN / SIGN UP */}
                <TouchableOpacity
                  style={styles.toggleButton}
                  onPress={() => {
                    setIsSignUp(!isSignUp);
                    setEmail("");
                    setPassword("");
                  }}
                >
                  <Text style={styles.toggleText}>
                    {isSignUp ? "Déjà un compte ? " : "Pas de compte ? "}
                    <Text style={styles.toggleTextBold}>
                      {isSignUp ? "Se connecter" : "S'inscrire"}
                    </Text>
                  </Text>
                </TouchableOpacity>

                {/* BOUTON RETOUR */}
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={() => {
                    setShowEmailForm(false);
                    setEmail("");
                    setPassword("");
                    setIsSignUp(false);
                  }}
                >
                  <Ionicons name="arrow-back" size={18} color={Colors.textLight} style={{ marginRight: 6 }} />
                  <Text style={styles.backButtonText}>Retour</Text>
                </TouchableOpacity>

              </View>
            )}

            <Text style={styles.legal}>
              En continuant, tu acceptes nos Conditions d'utilisation et notre Politique de confidentialité.
            </Text>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F8F9FA' 
  },
  scrollContent: { 
    flexGrow: 1, 
    justifyContent: 'space-between', 
    paddingVertical: 60,
    paddingHorizontal: 25,
  },
  
  // HEADER
  header: { 
    alignItems: 'center', 
    marginTop: 20,
    marginBottom: 40,
  },
  logo: { 
    width: 100, 
    height: 100, 
    borderRadius: 24,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  appName: { 
    fontSize: 36, 
    fontWeight: '900', 
    color: Colors.text, 
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  slogan: { 
    fontSize: 16, 
    color: Colors.textLight, 
    fontWeight: '500', 
    letterSpacing: 0.3,
  },

  // CONTENT
  content: { 
    flex: 1,
    justifyContent: 'center',
  },
  welcomeText: { 
    color: Colors.text, 
    fontSize: 24, 
    fontWeight: 'bold', 
    marginBottom: 30, 
    textAlign: 'center',
  },
  
  // GOOGLE BUTTON
  googleButton: {
    flexDirection: 'row',
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
    marginBottom: 20,
  },
  btnText: { 
    color: 'white', 
    fontSize: 17, 
    fontWeight: 'bold',
  },

  // DIVIDER
  divider: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginVertical: 20,
  },
  dividerLine: { 
    flex: 1, 
    height: 1, 
    backgroundColor: '#E5E7EB',
  },
  dividerText: { 
    marginHorizontal: 15, 
    color: Colors.textLight, 
    fontSize: 14, 
    fontWeight: '600',
  },

  // EMAIL BUTTON
  emailButton: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingVertical: 16,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.primary,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    marginBottom: 20,
  },
  emailBtnText: { 
    color: Colors.primary, 
    fontSize: 17, 
    fontWeight: 'bold',
  },

  // FORM
  formContainer: { 
    marginTop: 10,
  },
  
  inputWrapper: { 
    marginBottom: 20,
  },
  inputLabel: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 1,
  },
  inputIcon: { 
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: Colors.text,
    fontWeight: '500',
  },
  eyeIcon: {
    padding: 4,
  },

  // SUBMIT BUTTON
  submitButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 18,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    shadowColor: Colors.primary,
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
    marginBottom: 20,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 17,
    fontWeight: 'bold',
  },
  submitButtonDisabled: {
    backgroundColor: '#D1D5DB',
    opacity: 0.6,
  },

  // TOGGLE
  toggleButton: {
    alignItems: 'center',
    marginBottom: 20,
    paddingVertical: 8,
  },
  toggleText: {
    color: Colors.textLight,
    fontSize: 14,
  },
  toggleTextBold: {
    color: Colors.text,
    fontWeight: 'bold',
  },

  // BACK BUTTON
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginBottom: 20,
  },
  backButtonText: {
    color: Colors.textLight,
    fontSize: 14,
    fontWeight: '600',
  },

  // VERIFICATION SCREEN
  verificationHeader: {
    alignItems: 'center',
    marginBottom: 30,
  },
  verificationIconContainer: {
    width: 80,
    height: 80,
    backgroundColor: '#F3F4F6',
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  verificationTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 12,
  },
  verificationSubtitle: {
    fontSize: 15,
    color: Colors.textLight,
    textAlign: 'center',
    lineHeight: 22,
  },
  verificationEmail: {
    fontWeight: '700',
    color: Colors.text,
  },

  // CODE INPUT
  codeInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  codeInput: {
    flex: 1,
    paddingVertical: 18,
    fontSize: 24,
    color: Colors.text,
    fontWeight: '700',
    letterSpacing: 8,
    textAlign: 'center',
  },
  codeHint: {
    fontSize: 12,
    color: Colors.textLight,
    marginTop: 8,
    marginLeft: 4,
    fontStyle: 'italic',
  },

  // RESEND BUTTON
  resendButton: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
    paddingVertical: 12,
  },
  resendText: {
    color: Colors.textLight,
    fontSize: 14,
  },
  resendTextBold: {
    color: Colors.primary,
    fontWeight: 'bold',
  },

  // LEGAL
  legal: { 
    color: Colors.textLight, 
    fontSize: 11, 
    textAlign: 'center', 
    marginTop: 30,
    lineHeight: 16,
  },
});