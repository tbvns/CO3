import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const THEMES = [
  {
    key: 'light',
    label: 'Light',
    icon: 'wb-sunny',
    bg: '#ffffff',
    text: '#111827',
    preview: ['#ffffff', '#f3f4f6', '#e5e7eb'],
  },
  {
    key: 'dark',
    label: 'Dark',
    icon: 'brightness-3',
    bg: '#1f2937',
    text: '#f3f4f6',
    preview: ['#1f2937', '#374151', '#4b5563'],
  },
  {
    key: 'black',
    label: 'Black',
    icon: 'brightness-1',
    bg: '#000000',
    text: '#f9fafb',
    preview: ['#000000', '#111111', '#1a1a1a'],
  },
];

export default function Step2({ currentTheme, setScreen, theme, setTheme }) {
  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
        <Text style={[styles.heading, { color: currentTheme.textColor }]}>
          Pick your theme
        </Text>
        <Text style={[styles.subheading, { color: currentTheme.secondaryTextColor }]}>
          Choose how CO3 looks. You can always change this later.
        </Text>

        <View style={styles.themeList}>
          {THEMES.map(t => {
            const isActive = theme === t.key;
            return (
              <TouchableOpacity
                key={t.key}
                style={[
                  styles.themeCard,
                  {
                    backgroundColor: t.bg,
                    borderColor: isActive ? currentTheme.primaryColor : currentTheme.borderColor,
                    borderWidth: isActive ? 2 : 1,
                  },
                ]}
                onPress={() => setTheme(t.key)}
                activeOpacity={0.85}
              >
                <View style={styles.previewStrips}>
                  {t.preview.map((color, i) => (
                    <View
                      key={i}
                      style={[styles.strip, { backgroundColor: color, opacity: 1 - i * 0.15 }]}
                    />
                  ))}
                </View>
                <View style={styles.themeCardBottom}>
                  <Icon name={t.icon} size={18} color={t.text} />
                  <Text style={[styles.themeLabel, { color: t.text }]}>{t.label}</Text>
                  {isActive && (
                    <View style={[styles.activeBadge, { backgroundColor: currentTheme.primaryColor }]}>
                      <Icon name="check" size={12} color="#fff" />
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={[styles.infoBox, { backgroundColor: currentTheme.inputBackground, borderColor: currentTheme.borderColor }]}>
          <Icon name="tune" size={16} color={currentTheme.secondaryTextColor} />
          <Text style={[styles.infoText, { color: currentTheme.secondaryTextColor }]}>
            More display options, font size, view density, and more, are available in the Preferences menu.
          </Text>
        </View>
      </ScrollView>

      <View style={[styles.navRow, { borderTopColor: currentTheme.borderColor }]}>
        <TouchableOpacity
          style={[styles.backButton, { borderColor: currentTheme.borderColor }]}
          onPress={() => setScreen(prev => prev - 1)}
          activeOpacity={0.7}
        >
          <Icon name="arrow-back" size={20} color={currentTheme.textColor} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.nextButton, { backgroundColor: currentTheme.primaryColor }]}
          onPress={() => setScreen(prev => prev + 1)}
          activeOpacity={0.85}
        >
          <Text style={styles.nextButtonText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 32,
    paddingTop: 48,
    paddingBottom: 24,
    flexGrow: 1,
  },
  heading: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  subheading: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 32,
  },
  themeList: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  themeCard: {
    flex: 1,
    borderRadius: 14,
    overflow: 'hidden',
    height: 120,
    justifyContent: 'space-between',
  },
  previewStrips: {
    flex: 1,
    padding: 10,
    gap: 5,
  },
  strip: {
    height: 8,
    borderRadius: 4,
  },
  themeCardBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingBottom: 10,
    gap: 6,
  },
  themeLabel: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  activeBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  infoText: {
    fontSize: 13,
    lineHeight: 20,
    flex: 1,
  },
  navRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 32,
    paddingTop: 16,
    paddingBottom: 32,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  backButton: {
    width: 52,
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextButton: {
    flex: 1,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextButtonText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});