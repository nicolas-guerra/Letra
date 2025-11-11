// app/Calendar.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Button, FlatList, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import styles from './styles';

const DAILY_PREFIX = 'letra:daily:';

type DailyResult = {
  date: string;
  theme: string | null;
  words: string[];
  score: number;
  timeLeft: number;
  finalScore: number;
  timestamp: number;
};

async function listAllDailyResults(): Promise<DailyResult[]> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const dailyKeys = keys.filter(k => k.startsWith(DAILY_PREFIX));
    if (dailyKeys.length === 0) return [];
    const pairs = await AsyncStorage.multiGet(dailyKeys);
    const results: DailyResult[] = [];
    for (const [, val] of pairs) {
      if (!val) continue;
      try {
        results.push(JSON.parse(val));
      } catch (err) {}
    }
    results.sort((a, b) => (a.date < b.date ? 1 : -1));
    return results;
  } catch (err) {
    console.warn('Failed to list daily results', err);
    return [];
  }
}

export default function Calendar({ navigation }: any) {
  const [results, setResults] = useState<DailyResult[]>([]);
  const router = useRouter();

  async function load() {
    const r = await listAllDailyResults();
    setResults(r);
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <SafeAreaView style={[styles.appContainer, { backgroundColor: '#FFF8E7' }]}>
      <FlatList
        data={results}
        keyExtractor={r => r.date}
        contentContainerStyle={{ padding: 16 }}
        ListHeaderComponent={() => (
          <>
            <Text style={styles.appTitle}>Daily Scores — Calendar</Text>
            <View style={{ height: 12 }} />
            <Button title="Refresh" onPress={load} />
            <View style={{ height: 12 }} />
          </>
        )}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View>
              <Text style={styles.themeName}>{item.date}</Text>
              <Text style={styles.meta}>Theme: {item.theme ?? '—'}</Text>
              <Text style={styles.meta}>Score: {item.score} • Time left: {item.timeLeft}s • Final: {item.finalScore}</Text>
            </View>
            <View>
              <Button
                title="View"
                onPress={() => router.push(`/DailyGame?mode=view&viewDate=${encodeURIComponent(item.date)}`)}
              />
            </View>
          </View>
        )}
        ListFooterComponent={() => (
          <>
            <View style={{ height: 12 }} />
            <Button title="Back" onPress={() => router.back()} />
          </>
        )}
      />
    </SafeAreaView>
  );
}
