// app/PracticeTab.tsx
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import styles from './styles';

type WordList = Record<string, { word: string }[]>;

export default function PracticeTab() {
  const [mode, setMode] = useState<'timed' | 'relax' | null>(null);
  const router = useRouter();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#5DADEC' }]}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text style={[styles.pageTitle, { color: '#fff', marginTop: 24 }]}>Practice Mode</Text>
        <Text style={[styles.info, styles.typewriter, { color: '#fff', marginTop: 16 }]}>Choose your mode:</Text>

        <TouchableOpacity
          style={[styles.buttonPillType, { marginTop: 16 }]}
          onPress={() => router.push('/ThemeSelection')}
        >
          <Text style={styles.pillTextType}>Timed (60s)</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.buttonPillType, { marginTop: 16 }]}
          onPress={() => router.push('/RelaxPractice')}
        >
          <Text style={styles.pillTextType}>Relax (no timer)</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
