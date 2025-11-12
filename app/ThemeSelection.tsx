import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import wordlist from '../assets/letra_wordlist.json';
import styles from './styles';

type WordList = Record<string, { word: string }[]>;

export default function ThemeSelection() {
  const [selectedTheme, setSelectedTheme] = useState<string | null>(null);
  const router = useRouter();

  const themes = ['Random', ...Object.keys(wordlist as WordList)]; // Ensure 'Random' is included

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#5DADEC' }]}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text style={[styles.pageTitle, { color: '#fff', marginTop: 24 }]}>Select a Theme</Text>

        {themes.map(t => (
          <View key={t} style={{ marginVertical: 6 }}>
            <TouchableOpacity
              style={[
                styles.buttonPillType,
                selectedTheme === t && { backgroundColor: '#79D475' }, // Green when selected
              ]}
              onPress={() => {
                if (selectedTheme === t) {
                  // If already selected, start the game
                  router.push(`/DailyGame?mode=practice&theme=${encodeURIComponent(t)}`);
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

        {selectedTheme && ( // Show hint or alternative press instruction
          <Text style={[styles.pillTextType, { textAlign: 'center', marginTop: 12, color: '#fff' }]}>
            Press again to start
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}