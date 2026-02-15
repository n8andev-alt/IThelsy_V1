import * as WebBrowser from 'expo-web-browser';
import { useEffect } from 'react';

// ✅ IMPORTANT : Appeler ça en dehors du hook
WebBrowser.maybeCompleteAuthSession();

export const useWarmUpBrowser = () => {
  useEffect(() => {
    void WebBrowser.warmUpAsync();
    
    return () => {
      void WebBrowser.coolDownAsync();
    };
  }, []);
};