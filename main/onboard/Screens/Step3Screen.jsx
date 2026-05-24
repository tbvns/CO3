import { View, Text, StyleSheet, TouchableOpacity, Linking, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const SUPPORT_ITEMS = [
  {
    key: 'ao3',
    label: 'Archive of Our Own',
    description: 'AO3 is a non-profit run by fans, for fans. Donations keep the servers running for everyone.',
    url: 'https://archiveofourown.org/donate',
    color: '#22c55e',
    icon: 'favorite',
    cta: 'Donate to AO3',
  },
  {
    key: 'co3',
    label: 'CO3 Development',
    description: 'CO3 is built and maintained in spare time. Any support helps keep new features coming.',
    url: 'https://ko-fi.com/tbvns',
    color: '#6366f1',
    icon: 'coffee',
    cta: 'Buy me a coffee',
  },
];

export default function Step3({ currentTheme, setScreen, onFinish }) {
  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
        <View style={[styles.iconCircle, { backgroundColor: currentTheme.inputBackground }]}>
          <Icon name="volunteer-activism" size={36} color={currentTheme.primaryColor} />
        </View>

        <Text style={[styles.heading, { color: currentTheme.textColor }]}>
          Support the ecosystem
        </Text>
        <Text style={[styles.subheading, { color: currentTheme.secondaryTextColor }]}>
          CO3 will always be 100% free. But if you'd like to give back, here's how:
        </Text>

        <View style={styles.cardList}>
          {SUPPORT_ITEMS.map(item => (
            <View
              key={item.key}
              style={[styles.card, { backgroundColor: currentTheme.cardBackground, borderColor: currentTheme.borderColor }]}
            >
              <View style={[styles.cardIconWrap, { backgroundColor: item.color + '22' }]}>
                <Icon name={item.icon} size={22} color={item.color} />
              </View>
              <View style={styles.cardBody}>
                <Text style={[styles.cardTitle, { color: currentTheme.textColor }]}>
                  {item.label}
                </Text>
                <Text style={[styles.cardDesc, { color: currentTheme.secondaryTextColor }]}>
                  {item.description}
                </Text>
                <TouchableOpacity
                  style={[styles.ctaButton, { backgroundColor: item.color }]}
                  onPress={() => Linking.openURL(item.url)}
                  activeOpacity={0.85}
                >
                  <Icon name="open-in-new" size={14} color="#fff" />
                  <Text style={styles.ctaText}>{item.cta}</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
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
          onPress={onFinish}
          activeOpacity={0.85}
        >
          <Text style={styles.nextButtonText}>Start reading</Text>
          <Icon name="arrow-forward" size={18} color="#fff" />
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
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
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
    marginBottom: 28,
  },
  cardList: {
    gap: 14,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    flexDirection: 'row',
    gap: 14,
  },
  cardIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  cardBody: {
    flex: 1,
    gap: 6,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  cardDesc: {
    fontSize: 13,
    lineHeight: 19,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginTop: 4,
  },
  ctaText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  nextButtonText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});