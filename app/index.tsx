// app/index.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Button,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import wordlist from '../assets/letra_wordlist.json';

type WordItem = {
  word: string;
  count?: number;
  used_dates?: string[];
  [k: string]: any;
};
type WordList = Record<string, WordItem[]>;

/** -----------------------
 * Utilities (shuffle / seed)
 * ------------------------*/

/** Simple seeded RNG (mulberry32) */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** seeded shuffle - stable given same seed */
function seededShuffle<T>(arr: T[], seed: number) {
  const a = arr.slice();
  const rand = mulberry32(seed);
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Normal shuffle (non-deterministic) */
function shuffleArray<T>(a: T[]) {
  const arr = a.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** Convert YYYY-MM-DD into a numeric seed by hashing chars */
function dateStringToSeed(dateStr: string) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < dateStr.length; i++) {
    h ^= dateStr.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h;
}

/** -----------------------
 * Scramble / normalization
 * ------------------------*/

/**
 * Create a scrambled version of `word` keeping underscores in the same
 * positions as original spaces. Result is uppercase and spaces are shown as '_'.
 */
function scrambleKeepSpaces(word: string) {
  const original = word;
  const len = original.length;
  const letters: string[] = [];
  const slotsIsSpace: boolean[] = [];

  for (let i = 0; i < len; i++) {
    const ch = original[i];
    if (ch === ' ') {
      slotsIsSpace.push(true);
    } else {
      slotsIsSpace.push(false);
      letters.push(ch.toUpperCase());
    }
  }

  const shuffled = shuffleArray(letters);

  let k = 0;
  const outChars: string[] = [];
  for (let i = 0; i < len; i++) {
    if (slotsIsSpace[i]) {
      outChars.push('_');
    } else {
      outChars.push(shuffled[k++] || '');
    }
  }
  return outChars.join('');
}

/** normalize for comparison: remove spaces/underscores and uppercase */
function normalizeForCompare(s: string) {
  return s.replace(/[\s_]+/g, '').toUpperCase();
}

/** -----------------------
 * Word picking
 * ------------------------*/

/** pick words from one theme only (if theme provided) or from all themes */
function pickWordsFromTheme(allWordsObj: WordList, count = 10, theme?: string, deterministicSeed?: number) {
  const flat: string[] = [];
  if (theme && allWordsObj[theme]) {
    const arr = allWordsObj[theme];
    arr.forEach(item => {
      if (item && typeof item.word === 'string') flat.push(item.word);
    });
  } else {
    Object.keys(allWordsObj).forEach(t => {
      const arr = Array.isArray(allWordsObj[t]) ? allWordsObj[t] : [];
      arr.forEach(item => {
        if (item && typeof item.word === 'string') flat.push(item.word);
      });
    });
  }
  if (deterministicSeed !== undefined) {
    const list = seededShuffle(flat, deterministicSeed);
    return list.slice(0, Math.min(count, list.length));
  }
  const shuffled = shuffleArray(flat);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

/** -----------------------
 * Persistence keys & helpers
 * ------------------------*/
const WORD_META_KEY = 'letra:wordmeta'; // stores mapping word -> {count, used_dates: string[]}
const DAILY_PREFIX = 'letra:daily:'; // full key: letra:daily:YYYY-MM-DD

type WordMeta = {
  [word: string]: {
    count: number;
    used_dates: string[];
  };
};

async function loadWordMeta(): Promise<WordMeta> {
  try {
    const raw = await AsyncStorage.getItem(WORD_META_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as WordMeta;
  } catch (err) {
    console.warn('Failed to load word meta', err);
    return {};
  }
}
async function saveWordMeta(meta: WordMeta) {
  try {
    await AsyncStorage.setItem(WORD_META_KEY, JSON.stringify(meta));
  } catch (err) {
    console.warn('Failed to save word meta', err);
  }
}

type DailyResult = {
  date: string; // YYYY-MM-DD
  theme: string | null;
  words: string[]; // words shown
  score: number; // number correct (not including time bonus)
  timeLeft: number; // seconds left at end (may be 0)
  finalScore: number; // score + timeLeft (for timed runs)
  timestamp: number;
};

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
      } catch (err) {
        // skip
      }
    }
    // sort by date desc
    results.sort((a, b) => (a.date < b.date ? 1 : -1));
    return results;
  } catch (err) {
    console.warn('Failed to list daily results', err);
    return [];
  }
}

/** Increment usage for a wordset on a given date (saves to AsyncStorage) */
async function incrementWordMetaForWords(words: string[], dateStr: string) {
  const meta = await loadWordMeta();
  let changed = false;
  for (const w of words) {
    if (!meta[w]) {
      meta[w] = { count: 0, used_dates: [] };
    }
    // increment count unconditionally (user asked: "words shown in daily game get their count incremented")
    meta[w].count = (meta[w].count || 0) + 1;
    // record the date if not already present
    if (!meta[w].used_dates.includes(dateStr)) {
      meta[w].used_dates.push(dateStr);
    }
    changed = true;
  }
  if (changed) {
    await saveWordMeta(meta);
  }
}

/** -----------------------
 * Component
 * ------------------------*/

export default function HomeTab() {
  // screens: home | practiceOptions | game | result | calendar
  type Screen = 'home' | 'practiceOptions' | 'game' | 'result' | 'calendar';
  const [screen, setScreen] = useState<Screen>('home');

  // generic UI / selection states
  const [selectedTheme, setSelectedTheme] = useState<string | null>(null); // for practice or user-selected start
  const themes = Object.keys(wordlist as WordList);

  /** Game state (shared by both Daily and Practice) */
  const [mode, setMode] = useState<'daily' | 'practice' | null>(null);
  const [timed, setTimed] = useState(true); // practice mode: timed(true)/relax(false)
  const [gameStarted, setGameStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const [words, setWords] = useState<string[]>([]);
  const [index, setIndex] = useState(0);
  const [scrambled, setScrambled] = useState('');
  const [answer, setAnswer] = useState('');
  const [score, setScore] = useState(0); // number correct so far
  const [finalScore, setFinalScore] = useState<number | null>(null);

  // metadata for current run
  const [runTheme, setRunTheme] = useState<string | null>(null);
  const [runDate, setRunDate] = useState<string | null>(null); // only for daily runs, YYYY-MM-DD
  const timerRef = useRef<number | null>(null);

  /** Utility to get today's date string */
  function todayDateString(): string {
    const d = new Date();
    const y = d.getFullYear();
    const m = `${d.getMonth() + 1}`.padStart(2, '0');
    const day = `${d.getDate()}`.padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  /** Centralized end game */
  async function endGame(saveDaily = false) {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setGameStarted(false);

    // compute finalScore: for timed runs: score + timeLeft; for relax: score
    const final = timed ? score + timeLeft : score;
    setFinalScore(final);

    // if daily and we should save, update word meta counts and store daily result
    if (saveDaily && runDate) {
      // increment meta for the words shown this run
      await incrementWordMetaForWords(words, runDate);

      // store daily result
      const result: DailyResult = {
        date: runDate,
        theme: runTheme,
        words,
        score,
        timeLeft,
        finalScore: final,
        timestamp: Date.now(),
      };
      await saveDailyResult(runDate, result);
    }

    setScreen('result');
  }

  /** Timer effect: starts only for timed runs when gameStarted === true */
  useEffect(() => {
    if (gameStarted && timed) {
      timerRef.current = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) {
            // time's up -> end
            if (timerRef.current) {
              clearInterval(timerRef.current);
              timerRef.current = null;
            }
            // finalize result (score already reflects correct answers)
            // note: we call endGame(saveDaily) depending on mode
            setGameStarted(false);
            // ensure finalScore uses the current score + 0
            setFinalScore(score + 0);
            setTimeLeft(0);
            // if daily mode, save; else not
            endGame(mode === 'daily');
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameStarted, timed]); // note: score intentionally not added to deps

  /** When the index or words change, update scrambled and clear answer */
  useEffect(() => {
    if (words.length > 0 && index < words.length) {
      setScrambled(scrambleKeepSpaces(words[index]));
      setAnswer('');
    }
  }, [index, words]);

  /** Start a run. options:
   *  - daily: deterministic theme/words derived from date; saveDaily true
   *  - practice: can be timed or relax, theme selected or random
   */
  async function startRun(opts: { mode: 'daily' | 'practice'; timed: boolean; theme?: string | null; dateStr?: string }) {
    // reset UI
    setMode(opts.mode);
    setTimed(opts.timed);
    setScore(0);
    setFinalScore(null);
    setIndex(0);
    setAnswer('');
    setScrambled('');
    setGameStarted(false);

    // decide theme & words
    let themeToUse: string | null = opts.theme ?? null;
    let wordsPicked: string[] = [];

    if (opts.mode === 'daily') {
      // determine date
      const dateStr = opts.dateStr ?? todayDateString();
      setRunDate(dateStr);

      // deterministic theme: hash date to theme index
      const themeSeed = dateStringToSeed(dateStr);
      const themeList = Object.keys(wordlist as WordList);
      if (themeList.length === 0) {
        Alert.alert('No themes found');
        return;
      }
      const themeIdx = themeSeed % themeList.length;
      themeToUse = themeList[themeIdx];
      setRunTheme(themeToUse);

      // pick deterministic word order using seed derived from date + theme
      const seedForWords = dateStringToSeed(dateStr + '::' + themeToUse);
      wordsPicked = pickWordsFromTheme(wordlist as WordList, 10, themeToUse, seedForWords);
    } else {
      // practice: if theme specified use it, otherwise random theme
      const themeList = Object.keys(wordlist as WordList);
      if (!themeToUse) {
        // pick a random theme
        themeToUse = themeList[Math.floor(Math.random() * themeList.length)];
      }
      setRunTheme(themeToUse);
      setRunDate(null);
      wordsPicked = pickWordsFromTheme(wordlist as WordList, 10, themeToUse, undefined);
    }

    // final prep for starting
    setWords(wordsPicked);
    setIndex(0);
    setTimeLeft(opts.timed ? 60 : 0); // if untimed, show 0 or leave at 0; we'll treat timed flag to decide scoring
    // small delay to allow words to be set before starting timer & showing UI
    setScreen('game');
    setTimeout(() => {
      setGameStarted(true);
    }, 50);
  }

  /** Handler for Daily Game button:
   * - If already played today, show today's result.
   * - Otherwise start today's daily run.
   */
  async function handleDailyButton() {
    const today = todayDateString();
    const existing = await getDailyResult(today);
    if (existing) {
      // show the stored result
      setMode('daily');
      setFinalScore(existing.finalScore);
      setScore(existing.score);
      setTimeLeft(existing.timeLeft);
      setRunTheme(existing.theme ?? null);
      setRunDate(existing.date);
      setWords(existing.words);
      setIndex(existing.words.length); // place index at end
      setScreen('result');
      setGameStarted(false);
      return;
    }
    // not played today -> start deterministic daily run
    await startRun({ mode: 'daily', timed: true, dateStr: today });
  }

  /** Called when user types — we auto-check correctness and advance if correct */
  async function handleChangeText(text: string) {
    // keep answer uppercase for UI
    const upper = text.toUpperCase();
    setAnswer(upper);

    if (index >= words.length) return;

    const userNorm = normalizeForCompare(text);
    const targetNorm = normalizeForCompare(words[index]);

    if (userNorm === targetNorm) {
      // user entered the correct word
      if (index + 1 < words.length) {
        // not the last word: increment score and move to next
        setScore(s => s + 1);
        setIndex(i => i + 1);
        setAnswer('');
      } else {
        // last word - compute final score including this correct answer and end game
        const newScore = score + 1;
        setScore(newScore);
        // finalScore depends on timed flag
        const final = timed ? newScore + timeLeft : newScore;
        setFinalScore(final);
        // if daily, we want to save word meta & result
        await endGame(mode === 'daily');
      }
    }
  }

  /** Result screen helper: When user presses Play Again (same theme) */
  function replaySameTheme() {
    if (mode === 'daily') {
      // for daily, replaying the same daily words would break "only one daily per day" behavior.
      // We just start a fresh practice run using the same theme (timed).
      startRun({ mode: 'practice', timed: true, theme: runTheme });
    } else {
      // practice: restart practice with same theme and timed setting
      startRun({ mode: 'practice', timed: timed, theme: runTheme });
    }
  }

  /** Calendar screen loader */
  const [calendarResults, setCalendarResults] = useState<DailyResult[]>([]);
  async function loadCalendar() {
    const results = await listAllDailyResults();
    setCalendarResults(results);
  }

  useEffect(() => {
    if (screen === 'calendar') {
      loadCalendar();
    }
  }, [screen]);

  /** -----------------------
   * Render UI
   * ------------------------*/

  if (screen === 'home') {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Letra</Text>

        <View style={{ marginVertical: 12 }}>
          <Button title="Daily Game" onPress={handleDailyButton} />
          <Text style={styles.metaSmall}>One deterministic theme & word order per day. Play once per day.</Text>
        </View>

        <View style={{ height: 12 }} />
        <View style={{ marginVertical: 12 }}>
          <Button
            title="Practice"
            onPress={() => {
              setSelectedTheme(null);
              setScreen('practiceOptions');
            }}
          />
          <Text style={styles.metaSmall}>Choose Timed (60s) or Relax (no timer). 10 words.</Text>
        </View>

        <View style={{ height: 12 }} />
        <View style={{ marginVertical: 12 }}>
          <Button
            title="Calendar"
            onPress={() => {
              setScreen('calendar');
            }}
          />
          <Text style={styles.metaSmall}>See your Daily Game scores by day.</Text>
        </View>
      </View>
    );
  }

  if (screen === 'practiceOptions') {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Practice — Options</Text>

        <Text style={styles.info}>Mode</Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginVertical: 8 }}>
          <Button title={timed ? 'Timed (60s)' : 'Timed (60s)'} onPress={() => setTimed(true)} />
          <Button title={!timed ? 'Relax (no timer)' : 'Relax (no timer)'} onPress={() => setTimed(false)} />
        </View>

        <Text style={[styles.info, { marginTop: 10 }]}>Theme</Text>
        <View style={{ maxHeight: 220, marginVertical: 8 }}>
          <FlatList
            data={[null, ...themes]}
            keyExtractor={(t, i) => `${String(t)}-${i}`}
            renderItem={({ item }) => {
              const label = item === null ? 'Random' : item;
              return (
                <TouchableOpacity
                  style={[styles.row, selectedTheme === item ? { borderColor: '#333', borderWidth: 2 } : undefined]}
                  onPress={() => setSelectedTheme(item)}
                >
                  <Text style={styles.themeName}>{label}</Text>
                </TouchableOpacity>
              );
            }}
          />
        </View>

        <View style={{ height: 12 }} />
        <Button
          title="Start Practice"
          onPress={() => {
            startRun({ mode: 'practice', timed, theme: selectedTheme ?? undefined });
          }}
        />
        <View style={{ height: 12 }} />
        <Button title="Back" onPress={() => setScreen('home')} />
      </View>
    );
  }

  // Result screen
  if (screen === 'result') {
    const displayedFinal = finalScore ?? (timed ? score + timeLeft : score);
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Run Complete</Text>
        <Text style={styles.info}>Mode: {mode === 'daily' ? 'Daily' : 'Practice'}</Text>
        <Text style={styles.info}>Theme: {runTheme ?? 'Random'}</Text>
        <Text style={styles.info}>Words correct: {score}</Text>
        <Text style={styles.info}>Time left: {timed ? `${timeLeft}s` : '—'}</Text>
        <Text style={[styles.info, { fontSize: 24, fontWeight: '700' }]}>Final score: {displayedFinal}</Text>

        <View style={{ height: 12 }} />
        <Button title="Play Again (same theme)" onPress={replaySameTheme} />
        <View style={{ height: 8 }} />
        <Button title="Back to Home" onPress={() => setScreen('home')} />
      </View>
    );
  }

  // Calendar screen
  if (screen === 'calendar') {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Daily Scores — Calendar</Text>
        <View style={{ height: 12 }} />
        <Button title="Refresh" onPress={loadCalendar} />
        <View style={{ height: 12 }} />
        <FlatList
          data={calendarResults}
          keyExtractor={r => r.date}
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
                  onPress={() => {
                    // show the stored result in the result screen
                    setMode('daily');
                    setFinalScore(item.finalScore);
                    setScore(item.score);
                    setTimeLeft(item.timeLeft);
                    setRunTheme(item.theme ?? null);
                    setRunDate(item.date);
                    setWords(item.words);
                    setIndex(item.words.length);
                    setScreen('result');
                  }}
                />
              </View>
            </View>
          )}
        />
        <View style={{ height: 12 }} />
        <Button title="Back" onPress={() => setScreen('home')} />
      </View>
    );
  }

  // Game screen
  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Letra — {mode === 'daily' ? 'Daily Game' : 'Practice'} {runTheme ? `(${runTheme})` : ''}
      </Text>

      {!gameStarted ? (
        <View style={{ alignItems: 'center', marginTop: 30 }}>
          <Text style={styles.info}>{timed ? `Time: ${timeLeft}s` : 'Relax mode'}</Text>
          <Text style={styles.info}>Score: {score}</Text>
          <Button
            title="Start"
            onPress={() => {
              // safety: if we hit game screen but game isn't started, startRun again
              if (mode === 'daily') {
                startRun({ mode: 'daily', timed: true, dateStr: runDate ?? undefined });
              } else {
                startRun({ mode: 'practice', timed: timed, theme: runTheme ?? undefined });
              }
            }}
          />
          <View style={{ height: 12 }} />
          <Button title="Back to Home" onPress={() => setScreen('home')} />
        </View>
      ) : (
        <View>
          <Text style={styles.timer}>{timed ? `⏱ ${timeLeft}s` : 'Relax mode — no timer'}</Text>
          <Text style={styles.scrambled}>{scrambled}</Text>
          <TextInput
            style={styles.input}
            placeholder="Type your guess"
            value={answer}
            onChangeText={handleChangeText}
            autoCapitalize="characters"
            autoCorrect={false}
          />
          <Text style={styles.info}>Word {Math.min(index + 1, words.length)}/{words.length}</Text>
          <Text style={styles.info}>Score: {score}</Text>
        </View>
      )}
    </View>
  );
}

/** -----------------------
 * Styles
 * ------------------------*/
const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#FFF8E7' },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 8, textAlign: 'center' },
  row: { padding: 12, backgroundColor: '#FFF', borderRadius: 10, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  themeName: { fontSize: 16, fontWeight: '600' },
  meta: { fontSize: 12, color: '#666' },
  metaSmall: { fontSize: 12, color: '#666', marginTop: 6 },
  note: { fontSize: 12, color: '#666', marginTop: 8, textAlign: 'center' },
  timer: { fontSize: 20, textAlign: 'center', marginBottom: 12 },
  scrambled: { fontSize: 36, letterSpacing: 4, textAlign: 'center', marginVertical: 16 },
  input: { borderWidth: 1, borderColor: '#E0E0E0', padding: 10, borderRadius: 8, backgroundColor: 'white' },
  info: { textAlign: 'center', marginVertical: 6 },
});
