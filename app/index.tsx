// app/index.tsx
// Removed bottom tab navigator to avoid showing tabs at the bottom.
import { Asset } from 'expo-asset';
import * as Font from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

import HomeTab from './HomeTab';

const IMAGES = [
  require('../assets/sun.png'),
  require('../assets/grass.png'),
  require('../assets/tree.png'),
];

async function loadResourcesAsync() {
  await Font.loadAsync({
    CrayonLibre: require('../assets/fonts/CrayonLibre-vm6r9.ttf'),
  });
  const cacheImages = IMAGES.map(img => Asset.loadAsync(img));
  await Promise.all(cacheImages);
}

export default function AppEntry() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    loadResourcesAsync()
      .then(() => mounted && setReady(true))
      .catch(err => {
        console.warn('Resource loading failed', err);
        if (mounted) setReady(true);
      });
    return () => {
      mounted = false;
    };
  }, []);

  if (!ready) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <>
      <StatusBar hidden />
      <HomeTab />
    </>
  );
}
