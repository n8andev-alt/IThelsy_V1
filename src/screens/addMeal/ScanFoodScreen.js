import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Colors from '../../constants/Colors';

export default function ScanFoodScreen({ route, navigation }) {
  // 👇 ICI : On récupère bien returnTo
  const { mealType, returnTo } = route.params;
  
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, []);

  const handleBarCodeScanned = async ({ type, data }) => {
    if (scanned) return;
    setScanned(true);
    setLoading(true);
    
    try {
      // API OpenFoodFacts
      const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${data}.json`);
      const json = await response.json();

      if (json.status === 1) {
        const productData = json.product;
        
        const formattedProduct = {
          id: productData._id || data,
          name: productData.product_name_fr || productData.product_name || "Produit inconnu",
          brand: productData.brands || "",
          calories: productData.nutriments?.["energy-kcal_100g"] || 0,
          proteins: productData.nutriments?.proteins_100g || 0,
          carbs: productData.nutriments?.carbohydrates_100g || 0,
          fats: productData.nutriments?.fat_100g || 0,
        };

        // 👇 ICI : On transmet returnTo à l'écran suivant
        navigation.replace('FoodQuantity', { 
            product: formattedProduct, 
            mealType,
            returnTo // <--- IMPORTANT
        });
      } else {
        Alert.alert("Oups", "Produit non trouvé.", [
          { text: "OK", onPress: () => setScanned(false) }
        ]);
        setLoading(false);
      }

    } catch (error) {
      Alert.alert("Erreur", "Problème de connexion.");
      setScanned(false);
      setLoading(false);
    }
  };

  if (!permission) return <View style={{flex:1, backgroundColor:'black'}} />;
  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={{textAlign:'center', color:'white', marginBottom: 20}}>Besoin de la caméra pour scanner.</Text>
        <TouchableOpacity onPress={requestPermission} style={styles.btnPerm}>
          <Text style={{color:'white'}}>Autoriser</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ["qr", "ean13", "ean8", "upc_e"],
        }}
      />

      <SafeAreaView style={styles.overlay}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
            <Ionicons name="close" size={28} color="white" />
          </TouchableOpacity>
          <Text style={styles.title}>Scanner</Text>
          <View style={{width: 28}} />
        </View>

        <View style={styles.scannerContainer}>
            <View style={styles.scannerFrame} />
            {loading && <ActivityIndicator size="large" color={Colors.primary} style={{marginTop: 20}} />}
        </View>

        <View style={{padding: 30, alignItems: 'center'}}>
           <Text style={{color: 'white', opacity: 0.8}}>Vise le code-barres</Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'black', justifyContent: 'center', alignItems: 'center' },
  btnPerm: { backgroundColor: Colors.primary, padding: 15, borderRadius: 10 },
  overlay: { flex: 1, width: '100%', justifyContent: 'space-between' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 40 },
  title: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  iconBtn: { padding: 5, backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 20 },
  scannerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scannerFrame: { width: 250, height: 250, borderWidth: 2, borderColor: 'white', borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)' }
});