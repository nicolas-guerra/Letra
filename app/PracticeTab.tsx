// app/PracticeTab.tsx
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import wordlist from '../assets/letra_wordlist.json';
import styles from './styles';

type WordList = Record<string, { word: string }[]>;

export default function PracticeTab() {
  const [mode, setMode] = useState<'timed' | 'relax' | null>(null);
  const [selectedTheme, setSelectedTheme] = useState<string | null>(null);
  const router = useRouter();

  const themes = Object.keys(wordlist as WordList);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#5DADEC' }]}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text style={[styles.pageTitle, { color: '#fff' }]}>Practice Mode</Text>
        <Text style={[styles.info, styles.typewriter, { color: '#fff' }]}>Choose your mode:</Text>

        <TouchableOpacity style={styles.buttonPillType} onPress={() => setMode('timed')}>
          <Text style={styles.pillTextType}>Timed (60s)</Text>
        </TouchableOpacity>
        <View style={{ height: 8 }} />
        <TouchableOpacity style={styles.buttonPillType} onPress={() => setMode('relax')}>
          <Text style={styles.pillTextType}>Relax (no timer)</Text>
        </TouchableOpacity>

        {mode && (
          <>
            <View style={{ height: 12 }} />
            <Text style={[styles.info, styles.typewriter, { color: '#fff' }]}>Choose a theme:</Text>
            {themes.map(t => (
              <View key={t} style={{ marginVertical: 6 }}>
                <TouchableOpacity style={styles.buttonPillType} onPress={() => setSelectedTheme(t)}>
                  <Text style={styles.pillTextType}>{t}</Text>
                </TouchableOpacity>
              </View>
            ))}

            <View style={{ height: 8 }} />
            <TouchableOpacity
              style={styles.buttonPillType}
              onPress={() => router.push(`/DailyGame?mode=practice&timed=${mode === 'timed' ? 1 : 0}`)}
            >
              <Text style={styles.pillTextType}>Start Practice (Random Theme)</Text>
            </TouchableOpacity>
            <View style={{ height: 8 }} />
            <TouchableOpacity
              style={styles.buttonPillType}
              onPress={() => {
                if (!selectedTheme) return;
                router.push(`/DailyGame?mode=practice&timed=${mode === 'timed' ? 1 : 0}&theme=${encodeURIComponent(selectedTheme)}`);
              }}
            >
              <Text style={styles.pillTextType}>{selectedTheme ? `Start Practice (${selectedTheme})` : 'Select a theme to start'}</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
