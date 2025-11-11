// app/Calendar.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
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

  // map date -> DailyResult
  const resultMap: Record<string, DailyResult> = {};
  results.forEach(r => (resultMap[r.date] = r));

  // month generation between 2025-11-01 and 2030-12-31 (inclusive)
  function generateMonths() {
    const months: { year: number; month: number }[] = [];
    const start = new Date(2025, 10, 1); // Nov 1, 2025 (month index 10)
    const end = new Date(2030, 11, 31); // Dec 31, 2030
    let cur = new Date(start.getFullYear(), start.getMonth(), 1);
    while (cur <= end) {
      months.push({ year: cur.getFullYear(), month: cur.getMonth() });
      cur = new Date(cur.getFullYear(), cur.getMonth() + 1, 1);
    }
    return months;
  }

  const months = generateMonths();

  // return weeks: array of weeks, each week is array of 7 entries (number|null)
  function weeksForMonth(year: number, month: number) {
    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);
    const weeks: (number | null)[][] = [];
    let week: (number | null)[] = [];
    const startWeekday = first.getDay(); // 0=Sun
    // fill initial empty days
    for (let i = 0; i < startWeekday; i++) week.push(null);
    for (let d = 1; d <= last.getDate(); d++) {
      week.push(d);
      if (week.length === 7) {
        weeks.push(week);
        week = [];
      }
    }
    // push remaining
    if (week.length > 0) {
      while (week.length < 7) week.push(null);
      weeks.push(week);
    }
    return weeks;
  }

  function formatDate(year: number, month: number, day: number) {
    const m = `${month + 1}`.padStart(2, '0');
    const d = `${day}`.padStart(2, '0');
    return `${year}-${m}-${d}`;
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#5DADEC', flex: 1 }]}> 
      <ScrollView contentContainerStyle={{ padding: 12 }}>
        <Text style={[styles.pageTitle, { color: '#fff', marginTop: 8 }]}>Calendar</Text>
        <View style={{ height: 12 }} />
        {months.map(({ year, month }) => {
          const weeks = weeksForMonth(year, month);
          const monthName = new Date(year, month, 1).toLocaleString(undefined, { month: 'long' });
          return (
            <View key={`${year}-${month}`} style={{ marginBottom: 18 }}>
              <Text style={[styles.themeName, { color: '#fff', marginBottom: 8 }]}>{monthName} {year}</Text>
                  <View style={{ flexDirection: 'row' }}>
                    {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
                      <Text key={d} style={{ color: '#fff', flexBasis: `${100/7}%`, textAlign: 'center', fontWeight: '600' }}>{d}</Text>
                    ))}
                  </View>
                  <View style={{ marginTop: 8 }}>
                    {weeks.map((week: (number|null)[], wIdx: number) => (
                      <View key={`w-${wIdx}`} style={{ flexDirection: 'row' }}>
                        {week.map((day: number | null, dIdx: number) => {
                          const cellStyle: any = {
                            flex: 1,
                            height: 64,
                            padding: 4,
                            alignItems: 'center',
                            justifyContent: 'center',
                          };
                          if (day === null) return <View key={dIdx} style={cellStyle} />;
                          const dateStr = formatDate(year, month, day);
                          const res = resultMap[dateStr];
                          const isDone = !!res;
                          return (
                            <TouchableOpacity
                              key={dIdx}
                              onPress={() => isDone ? router.push(`/DailyGame?mode=view&viewDate=${encodeURIComponent(dateStr)}`) : null}
                              style={[
                                cellStyle,
                                { borderRadius: 6, backgroundColor: isDone ? '#79D475' : 'transparent' },
                              ]}
                            >
                              <Text style={{ color: isDone ? '#003300' : '#fff', fontWeight: '700' }}>{day}</Text>
                              {isDone && <Text style={{ color: '#003300', fontSize: 11 }}>{res.score}</Text>}
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    ))}
                  </View>
            </View>
          );
        })}

        <View style={{ height: 12 }} />
        <TouchableOpacity style={[styles.buttonPillType, { backgroundColor: '#79D475' }]} onPress={() => load()}>
          <Text style={styles.pillTextType}>Refresh</Text>
        </TouchableOpacity>
        <View style={{ height: 12 }} />
        <TouchableOpacity style={[styles.buttonPillType]} onPress={() => router.back()}>
          <Text style={styles.pillTextType}>Back</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
