import { Slot, useRouter, useSegments } from 'expo-router';
import React from 'react';
import { Platform, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function Layout() {
  const router = useRouter();
  const segments = useSegments();

  const segs = segments as unknown as string[];
  const segLen = segs ? segs.length : 0;
  const isRoot = segLen === 0 || (segLen === 1 && segs[0] === 'HomeTab');

  return (
    <>
      <StatusBar hidden={!isRoot} />
      <Slot />

      {!isRoot && (
        <View style={styles.headerOverlay} pointerEvents="box-none">
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backArrow}>❮</Text>
          </TouchableOpacity>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  headerOverlay: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 12 : 12,
    left: 40, // Adjusted to move the back button slightly to the right
    zIndex: 200,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFD200',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#000',
  },
  backArrow: {
    fontSize: 22,
    fontWeight: '700',
  },
});