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
                selectedTheme === t && { backgroundColor: '#FFF8E7' }, // Highlight selected theme
              ]}
              onPress={() => setSelectedTheme(t)}
            >
              <Text style={styles.pillTextType}>{t}</Text>
            </TouchableOpacity>
          </View>
        ))}

        {selectedTheme && ( // Only show the Start Practice button if a theme is selected
          <TouchableOpacity
            style={[styles.buttonPillType, { backgroundColor: '#79D475', marginTop: 24 }]}
            onPress={() => {
              router.push(`/DailyGame?mode=practice&theme=${encodeURIComponent(selectedTheme)}`);
            }}
          >
            <Text style={styles.pillTextType}>Start Practice</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}