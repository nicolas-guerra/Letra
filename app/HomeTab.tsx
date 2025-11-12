// app/HomeTab.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useFocusEffect } from 'expo-router';
import React, { useState } from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import styles from './styles';

const DAILY_PREFIX = 'letra:daily:';

function todayDateString(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export default function HomeTab() {
  const router = useRouter();
  const [dailyPlayed, setDailyPlayed] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      // Check if daily game has been played today
      (async () => {
        const todayStr = todayDateString();
        const result = await AsyncStorage.getItem(DAILY_PREFIX + todayStr);
        setDailyPlayed(result !== null);
      })();
    }, [])
  );

  const handleDailyGamePress = async () => {
    const todayStr = todayDateString();
    if (dailyPlayed) {
      // Navigate to results view
      router.push(`/DailyGame?mode=view&viewDate=${todayStr}`);
    } else {
      // Navigate to daily game
      router.push(`/DailyGame?mode=daily&startGame=true`);
    }
  };

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
            style={[styles.pill, dailyPlayed && { backgroundColor: '#79D475' }]}
            onPress={handleDailyGamePress}
          >
            <Text style={styles.pillText}>{dailyPlayed ? '✓ Daily Game' : 'Daily Game'}</Text>
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
