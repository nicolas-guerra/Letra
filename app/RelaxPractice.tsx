import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import { ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import wordlist from '../assets/letra_wordlist.json';
import styles from './styles';
import { normalizeForCompare, pickWordsFromTheme, scrambleKeepSpaces } from './utils';

type WordList = Record<string, { word: string }[]>;

export default function RelaxPractice() {
  const router = useRouter();
  const inputRef = useRef<any>(null);
  const [selectedTheme, setSelectedTheme] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [words, setWords] = useState<string[]>([]);
  const [index, setIndex] = useState(0);
  const [originals, setOriginals] = useState<string[]>([]);
  const [answer, setAnswer] = useState('');
  const [score, setScore] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [solved, setSolved] = useState(false);
  const [finished, setFinished] = useState(false);

  const themes = ['Random', ...Object.keys(wordlist as WordList)];

  // No auto-advance here: user will press Next after Reveal or Correct

  const handleStartPractice = () => {
    if (selectedTheme) {
      const selectedOriginals = pickWordsFromTheme(wordlist, 10, selectedTheme);
      const selectedWords = selectedOriginals.map((word) => scrambleKeepSpaces(word));
      setOriginals(selectedOriginals as string[]);
      setWords(selectedWords as string[]);
      setIndex(0);
      setAnswer('');
      setScore(0);
      setRevealed(false);
      setSolved(false);
      setFinished(false);
      setIsPlaying(true);
      // focus input after starting
      setTimeout(() => inputRef.current?.focus?.(), 80);
    }
  };

  const handlePlayAgain = () => {
    // Reset to theme selection screen while keeping selected theme
    setIsPlaying(false);
    setFinished(false);
    handleStartPractice();
  };

  const handleChangeText = (text: string) => {
    setAnswer(text);
    if (finished || solved || revealed) return;

    const userNorm = normalizeForCompare(text);
    const target = originals[index] || '';
    const targetNorm = normalizeForCompare(target);

    if (userNorm === targetNorm) {
      // mark solved, increment score, show Correct! and wait for Next
      setScore(s => s + 1);
      setSolved(true);
      setAnswer(target); // show full answer in input for clarity
    }
  };

  const handleReveal = () => {
    if (finished || solved || revealed) return;
    setRevealed(true);
    setAnswer(originals[index] || '');
  };

  const handleNext = () => {
    // advance to next or finish
    if (index + 1 < originals.length) {
      setIndex(i => i + 1);
      setAnswer('');
      setRevealed(false);
      setSolved(false);
      // focus input after moving to next
      setTimeout(() => inputRef.current?.focus?.(), 80);
    } else {
      // finished
      setFinished(true);
      setIsPlaying(false);
    }
  };

  if (finished) {
    return (
      <SafeAreaView style={[styles.appContainer, { backgroundColor: '#FFF8E7' }]}>
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          <Text style={styles.appTitle}>Relax ☕ — Results</Text>
          <Text style={styles.info}>You got {score} out of {originals.length}</Text>
          <View style={{ height: 12 }} />
          <TouchableOpacity
            style={[styles.buttonPillType, { backgroundColor: '#79D475', marginTop: 16 }]}
            onPress={handlePlayAgain}
          >
            <Text style={styles.pillTextType}>Practice same theme?</Text>
          </TouchableOpacity>
          <View style={{ height: 8 }} />
          <TouchableOpacity
            style={[styles.buttonPillType, { marginTop: 8 }]}
            onPress={() => {
              setFinished(false);
              setSelectedTheme(null);
              setIsPlaying(false);
            }}
          >
            <Text style={styles.pillTextType}>Pick different theme</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (!isPlaying) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: '#5DADEC' }]}>
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          <Text style={[styles.pageTitle, { color: '#fff', marginTop: 24 }]}>Select a Theme</Text>

          {themes.map(t => (
            <View key={t} style={{ marginVertical: 6 }}>
              <TouchableOpacity
                style={[
                  styles.buttonPillType,
                  selectedTheme === t && { backgroundColor: '#79D475' },
                ]}
                onPress={() => {
                  if (selectedTheme === t) {
                    // If already selected, start the game
                    handleStartPractice();
                  } else {
                    // If not selected, just select it
                    setSelectedTheme(t);
                  }
                }}
              >
                <Text style={styles.pillTextType}>
                  {selectedTheme === t ? `Start ${t}` : t}
                </Text>
              </TouchableOpacity>
            </View>
          ))}

          {selectedTheme && (
            <Text style={[styles.pillTextType, { textAlign: 'center', marginTop: 12, color: '#fff' }]}>
              Press again to start
            </Text>
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.appContainer, { backgroundColor: '#FFF8E7' }]}> 
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text style={styles.appTitle}>Relax ☕</Text>
        <Text style={styles.info}>Word {Math.min(index + 1, originals.length)} of {originals.length}</Text>
        <Text style={styles.scrambled}>{words[index] ?? ''}</Text>
        <TextInput
          style={styles.input}
          placeholder="Type your guess"
          value={answer}
          onChangeText={handleChangeText}
          autoCapitalize="characters"
          autoCorrect={false}
          editable={!revealed && !solved}
        />

        <View style={{ height: 12 }} />
        {!solved && !revealed && (
          <TouchableOpacity style={[styles.buttonPillType, { marginTop: 8 }]} onPress={handleReveal}>
            <Text style={styles.pillTextType}>Reveal</Text>
          </TouchableOpacity>
        )}

        {solved && (
          <View style={{ marginTop: 12 }}>
            <Text style={[styles.info, { color: 'green', fontWeight: '700' }]}>Correct!</Text>
            <TouchableOpacity style={[styles.buttonPillType, { marginTop: 12 }]} onPress={handleNext}>
              <Text style={styles.pillTextType}>Next</Text>
            </TouchableOpacity>
          </View>
        )}

        {revealed && !solved && (
          <View style={{ marginTop: 12 }}>
            <Text style={[styles.info, { fontWeight: '700' }]}>{originals[index] ?? ''}</Text>
            <TouchableOpacity style={[styles.buttonPillType, { marginTop: 12 }]} onPress={handleNext}>
              <Text style={styles.pillTextType}>Next</Text>
            </TouchableOpacity>
          </View>
        )}

        <Text style={[styles.info, { marginTop: 12 }]}>Score: {score}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}