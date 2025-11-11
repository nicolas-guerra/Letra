// app/HomeTab.tsx
import { useRouter } from 'expo-router';
import React from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import styles from './styles';

export default function HomeTab() {
  const router = useRouter();

  const sunSource = require('../assets/sun.png');
  const grassSource = require('../assets/grass.png');
  const treeSource = require('../assets/tree.png');

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#5DADEC' }]}>
      <Image source={sunSource} style={styles.sun} resizeMode="contain" />

      <View style={styles.centerColumn}>
        <Text style={styles.title}>Letra</Text>

        <View style={styles.buttonStack}>
          <TouchableOpacity
            style={styles.pill}
            onPress={() => router.push('/DailyGame?mode=daily')}
          >
            <Text style={styles.pillText}>Daily Game</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.pill}
            onPress={() => router.push('/PracticeTab')}
          >
            <Text style={styles.pillText}>Practice</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.pill}
            onPress={() => router.push('/Calendar')}
          >
            <Text style={styles.pillText}>Calendar</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Image source={grassSource} style={styles.grass} resizeMode="cover" />
      <Image source={treeSource} style={styles.tree} resizeMode="contain" />
    </SafeAreaView>
  );
}
