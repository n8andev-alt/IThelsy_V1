// Updated PaywallScreen.js content

// Fix isDevMode detection
const isDevMode = __DEV__;

// Ensure real offerings from RevenueCat are properly loaded 
if (isDevMode) {
    console.warn('Dev mode is active');
} else {
    // Load actual offerings without dev mode alerts
    loadRevenueCatOfferings();
}

function loadRevenueCatOfferings() {
    // Implementation for loading real offerings from RevenueCat
}