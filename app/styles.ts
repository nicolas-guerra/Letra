// app/styles.ts
import { Dimensions, StyleSheet } from 'react-native';
const { width, height } = Dimensions.get('window');

export default StyleSheet.create({
  // home container uses sky color
  container: { flex: 1, backgroundColor: '#5DADEC' }, // your chosen color
  centerColumn: {
    marginTop: height * 0.12,
    alignItems: 'center',
    zIndex: 5,
    width: '100%',
  },
  title: {
    fontFamily: 'CrayonLibre',
    fontSize: 92,
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 8,
    textShadowColor: 'rgba(0,0,0,0.25)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  // slightly smaller page title for other screens (e.g. Practice)
  pageTitle: {
    fontFamily: 'CrayonLibre',
    fontSize: 48,
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 8,
    textShadowColor: 'rgba(0,0,0,0.25)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  // typewriter-style font to use on practice screen
  typewriter: {
    // use CrayonLibre for consistency across the app
    fontFamily: 'CrayonLibre',
  },
  buttonStack: {
    marginTop: 8,
    width: '70%',
    alignItems: 'center',
  },
  pill: {
    backgroundColor: '#FFD200',
    borderRadius: 999,
    paddingVertical: 12,
    paddingHorizontal: 36,
    marginVertical: 10,
    borderWidth: 3,
    borderColor: '#000',
    minWidth: '100%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 6,
  },
  pillText: {
    fontFamily: 'CrayonLibre',
    fontSize: 26,
    color: '#000',
  },
  // pill style with typewriter font for Practice screen buttons
  buttonPillType: {
    backgroundColor: '#FFD200',
    borderRadius: 999,
    paddingVertical: 12,
    paddingHorizontal: 36,
    marginVertical: 10,
    borderWidth: 3,
    borderColor: '#000',
    minWidth: '100%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 6,
  },
  pillTextType: {
    fontFamily: 'CrayonLibre',
    fontSize: 20,
    color: '#000',
  },
  sun: {
    position: 'absolute',
    top: -20,
    right: -10,
    width: width * 0.45,
    height: width * 0.45,
    zIndex: 2,
  },
  grass: {
    position: 'absolute',
    // lowered slightly so it sits a bit further down the screen
    bottom: -100,
    left: 0,
    width: '110%',
    height: height * 0.38,
    zIndex: 3,
  },
  tree: {
    position: 'absolute',
    left: width * 0.09,
    // bring the tree a bit lower so it's not floating too high
    bottom: height * 0.15,
    // make the tree larger
    width: width * 0.33,
    height: width * 0.33,
    zIndex: 6,
  },

  // app screens (non-home) reuse previous styles
  appContainer: { flex: 1, padding: 16, backgroundColor: '#FFF8E7' },
  appTitle: { fontSize: 22, fontWeight: '700', marginBottom: 8, textAlign: 'center' },
  row: { padding: 12, backgroundColor: '#FFF', borderRadius: 10, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  themeName: { fontSize: 16, fontWeight: '600', fontFamily: 'CrayonLibre' },
  meta: { fontSize: 12, color: '#666', fontFamily: 'CrayonLibre' },
  metaSmall: { fontSize: 12, color: '#666', marginTop: 6, fontFamily: 'CrayonLibre' },
  note: { fontSize: 12, color: '#666', marginTop: 8, textAlign: 'center', fontFamily: 'CrayonLibre' },
  timer: { fontSize: 20, textAlign: 'center', marginBottom: 12, fontFamily: 'CrayonLibre' },
  scrambled: { fontSize: 36, letterSpacing: 4, textAlign: 'center', marginVertical: 16, fontFamily: 'CrayonLibre' },
  input: { borderWidth: 1, borderColor: '#E0E0E0', padding: 10, borderRadius: 8, backgroundColor: 'white' },
  info: { textAlign: 'center', marginVertical: 6, fontFamily: 'CrayonLibre' },
});
