// app/_utils.ts
// import { WordList } from './types'; // optional: see note below
type WordList = Record<string, { word: string }[]>;

/** Simple seeded RNG (mulberry32) */
export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function seededShuffle<T>(arr: T[], seed: number) {
  const a = arr.slice();
  const rand = mulberry32(seed);
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function shuffleArray<T>(a: T[]) {
  const arr = a.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function dateStringToSeed(dateStr: string) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < dateStr.length; i++) {
    h ^= dateStr.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h;
}

/** scramble keep spaces - scrambles letters within each term separately, ensuring no term matches original */
export function scrambleKeepSpaces(word: string) {
  const terms = word.split(' ');
  
  const scrambleTermUntilDifferent = (term: string): string => {
    const original = term.toUpperCase();
    let attempts = 0;
    const maxAttempts = 100;
    
    while (attempts < maxAttempts) {
      const letters = original.split('');
      const shuffled = shuffleArray(letters);
      const result = shuffled.join('');
      
      // If this term is different from the original, it's valid
      if (result !== original) {
        return result;
      }
      attempts++;
    }
    
    // Fallback: return the best we can get (should rarely happen)
    return original;
  };
  
  const scrambledTerms = terms.map(term => {
    if (term.length === 0) return term;
    return scrambleTermUntilDifferent(term);
  });
  
  return scrambledTerms.join(' ');
}

export function normalizeForCompare(s: string) {
  return s.replace(/\s+/g, '').toUpperCase();
}

/** pick words from theme/all; deterministicSeed optional */
export function pickWordsFromTheme(allWordsObj: WordList, count = 10, theme?: string, deterministicSeed?: number) {
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
