// app/DailyGame.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Button, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import wordlist from '../assets/letra_wordlist.json';
import styles from './styles';
import { dateStringToSeed, normalizeForCompare, pickWordsFromTheme, scrambleKeepSpaces } from './utils';

type Props = {
  route?: any;
  navigation?: any;
};

type DailyResult = {
  date: string;
  theme: string | null;
  words: string[];
  score: number;
  timeLeft: number;
  finalScore: number;
  timestamp: number;
};

const DAILY_PREFIX = 'letra:daily:';
const WORD_META_KEY = 'letra:wordmeta';

async function saveDailyResult(dateStr: string, result: DailyResult) {
  try {
    await AsyncStorage.setItem(DAILY_PREFIX + dateStr, JSON.stringify(result));
  } catch (err) {
    console.warn('Failed to save daily result', err);
  }
}
async function getDailyResult(dateStr: string): Promise<DailyResult | null> {
  try {
    const raw = await AsyncStorage.getItem(DAILY_PREFIX + dateStr);
    if (!raw) return null;
    return JSON.parse(raw) as DailyResult;
  } catch (err) {
    console.warn('Failed to load daily result', err);
    return null;
  }
}
async function incrementWordMetaForWords(words: string[], dateStr: string) {
  try {
    const raw = await AsyncStorage.getItem(WORD_META_KEY);
    const meta = raw ? JSON.parse(raw) : {};
    let changed = false;
    for (const w of words) {
      if (!meta[w]) meta[w] = { count: 0, used_dates: [] };
      meta[w].count = (meta[w].count || 0) + 1;
      if (!meta[w].used_dates.includes(dateStr)) meta[w].used_dates.push(dateStr);
      changed = true;
    }
    if (changed) await AsyncStorage.setItem(WORD_META_KEY, JSON.stringify(meta));
  } catch (err) {
    console.warn('Failed to increment word meta', err);
  }
}

function todayDateString(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export default function DailyGame({ route, navigation }: Props) {
  const router = useRouter();
  const searchParams = useLocalSearchParams();
  // normalize search params coming from expo-router (strings) into an object similar to previous route.params
  const params: any = {
    mode: (searchParams.mode as string) ?? undefined,
    timed: typeof searchParams.timed !== 'undefined' ? (searchParams.timed === '1' || searchParams.timed === 'true') : undefined,
    dateStr: (searchParams.dateStr as string) ?? undefined,
    theme: (searchParams.theme as string) ?? undefined,
    viewDate: (searchParams.viewDate as string) ?? undefined,
    startGame: typeof searchParams.startGame !== 'undefined' ? (searchParams.startGame === '1' || searchParams.startGame === 'true') : false,
  };
  const [mode, setMode] = useState<'daily' | 'practice' | 'view'>(params.mode ?? 'daily');
  const [timed, setTimed] = useState<boolean>(params.timed ?? true);

  const [runDate, setRunDate] = useState<string | null>(params.dateStr ?? null);
  const [runTheme, setRunTheme] = useState<string | null>(params.theme ?? null);

  const [gameStarted, setGameStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const [words, setWords] = useState<string[]>([]);
  const [index, setIndex] = useState(0);
  const [scrambled, setScrambled] = useState('');
  const [answer, setAnswer] = useState('');
  const [score, setScore] = useState(0);
  const [finalScore, setFinalScore] = useState<number | null>(null);

  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (mode === 'view' && params.viewDate) {
      (async () => {
        const res = await getDailyResult(params.viewDate);
        if (res) {
          setRunDate(res.date);
          setRunTheme(res.theme ?? null);
          setWords(res.words);
          setScore(res.score);
          setTimeLeft(res.timeLeft);
          setFinalScore(res.finalScore);
          setIndex(res.words.length);
        }
      })();
      return;
    }

    (async () => {
      if (mode === 'daily') {
        const dateStr = params.dateStr ?? todayDateString();
        setRunDate(dateStr);

        const themeList = Object.keys(wordlist as any);
        const themeSeed = dateStringToSeed(dateStr);
        if (themeList.length > 0) {
          const themeIdx = themeSeed % themeList.length;
          const chosen = themeList[themeIdx];
          setRunTheme(chosen);
          const seedForWords = dateStringToSeed(dateStr + '::' + chosen);
          const picks = pickWordsFromTheme(wordlist as any, 10, chosen, seedForWords);
          setWords(picks);
          // Auto-start daily game if startGame parameter is true
          if (params.startGame) {
            setGameStarted(true);
            setTimeLeft(60);
          }
        } else {
          setWords([]);
        }
      } else if (mode === 'practice') {
        // prefer explicit theme from query params when present
        const themeToUse = typeof params.theme !== 'undefined' ? params.theme : null;
        setRunTheme(themeToUse);
        const picks = pickWordsFromTheme(wordlist as any, 10, themeToUse ?? undefined, undefined);
        setWords(picks);
        // Auto-start practice mode
        setGameStarted(true);
        setTimeLeft(timed ? 60 : 0);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (gameStarted && timed) {
      timerRef.current = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) {
            if (timerRef.current) {
              clearInterval(timerRef.current);
              timerRef.current = null;
            }
            setGameStarted(false);
            // When timer runs out, final score is just the current score (no time bonus)
            endGame(mode === 'daily', score);
            return 0;
          }
          return t - 1;
        });
      }, 1000) as unknown as number;
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [gameStarted, timed, score]); // Added score to dependency array

  useEffect(() => {
    if (words.length > 0 && index < words.length) {
      setScrambled(scrambleKeepSpaces(words[index]));
      setAnswer('');
    }
  }, [index, words]);

  async function endGame(saveDaily = false, finalScoreOverride?: number) {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setGameStarted(false);
    // If a final score override is provided (e.g., from timer), use it; otherwise calculate
    const final = finalScoreOverride !== undefined ? finalScoreOverride : score + (timed ? timeLeft : 0);
    setFinalScore(final);

    if (saveDaily && runDate) {
      await incrementWordMetaForWords(words, runDate);
      const result: DailyResult = {
        date: runDate,
        theme: runTheme,
        words,
        score,
        timeLeft: timed ? timeLeft : 0, // Ensure timeLeft is 0 for Relax mode
        finalScore: final,
        timestamp: Date.now(),
      };
      await saveDailyResult(runDate, result);
    }
  }

  async function handleChangeText(text: string) {
    const upper = text.toUpperCase();
    setAnswer(upper);

    if (index >= words.length) return;

    const userNorm = normalizeForCompare(text);
    const targetNorm = normalizeForCompare(words[index]);

    if (userNorm === targetNorm) {
      if (index + 1 < words.length) {
        setScore(s => s + 1);
        setIndex(i => i + 1);
        setAnswer('');
      } else {
        // Last word is correct; calculate final score with the incremented score
        const newScore = score + 1;
        const final = timed ? newScore + timeLeft : newScore;
        setScore(newScore);
        setFinalScore(final);
        setGameStarted(false);
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        if (mode === 'daily' && runDate) {
          await incrementWordMetaForWords(words, runDate);
          await saveDailyResult(runDate, {
            date: runDate,
            theme: runTheme,
            words,
            score: newScore,
            timeLeft: timed ? timeLeft : 0,
            finalScore: final,
            timestamp: Date.now(),
          });
        }
      }
    }
  }

  const displayedFinal = finalScore ?? (timed ? score + timeLeft : score);

  if (mode === 'view' || (finalScore !== null && !gameStarted)) {
    return (
      <SafeAreaView style={[styles.appContainer, { backgroundColor: '#FFF8E7' }]}>
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          <Text style={styles.appTitle}>Run Complete</Text>
          <Text style={styles.info}>Mode: {mode === 'daily' ? 'Daily' : mode === 'practice' ? 'Practice' : 'Saved'}</Text>
          <Text style={styles.info}>Theme: {runTheme ?? 'Random'}</Text>
          <Text style={styles.info}>Words correct: {score}</Text>
          <Text style={styles.info}>Time left: {timed ? `${timeLeft}s` : '—'}</Text>
          <Text style={[styles.info, { fontSize: 24, fontWeight: '700' }]}>Final score: {displayedFinal}</Text>
          <View style={{ height: 12 }} />
          <Button
            title="Practice same theme?"
            onPress={() => {
              const themeQuery = runTheme ? `&theme=${encodeURIComponent(runTheme)}` : '';
              router.push(`/DailyGame?mode=practice&timed=1${themeQuery}`);
            }}
          />
          <View style={{ height: 8 }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.appContainer, { backgroundColor: '#FFF8E7' }]}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text style={styles.appTitle}>Letra — {mode === 'daily' ? 'Daily Game' : 'Practice'} {runTheme ? `(${runTheme})` : ''}</Text>

        {!gameStarted ? (
          <View style={{ alignItems: 'center', marginTop: 30 }}>
            <Text style={styles.info}>{timed ? `Time: ${timeLeft}s` : 'Relax mode'}</Text>
            <Text style={styles.info}>Score: {score}</Text>
            <Button title="Start" onPress={() => { setGameStarted(true); setTimeLeft(timed ? 60 : 0); }} />
            <View style={{ height: 12 }} />
            <Button title="Back" onPress={() => router.back()} />
          </View>
        ) : (
          <View>
            {/* Progress row: counter | progress bar | timer */}
            {(mode === 'daily' || timed) && (
              <View style={styles.progressRow}>
                <Text style={styles.progressCounter}>{score}/{words.length}</Text>
                <View style={styles.progressBarContainer}>
                  <View style={[styles.progressBarFill, { width: `${(words.length > 0 ? (score / words.length) * 100 : 0)}%` }]} />
                </View>
                <Text style={styles.progressTimer}>{timed ? `⏱ ${timeLeft}s` : ''}</Text>
              </View>
            )}

            <Text style={styles.scrambled}>{scrambled}</Text>
            <TextInput
              style={styles.input}
              placeholder="Type your guess"
              value={answer}
              onChangeText={handleChangeText}
              autoCapitalize="characters"
              autoCorrect={false}
            />
            <View style={{ height: 12 }} />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
