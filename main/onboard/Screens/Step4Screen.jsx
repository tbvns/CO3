// Step4Screen.jsx – Support (was Step3)
import {
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTranslation } from 'react-i18next';

const SUPPORT_ITEMS = [
  {
    key: 'ao3',
    labelKey: 'onboard_step4_ao3_label',
    descriptionKey: 'onboard_step4_ao3_desc',
    ctaKey: 'onboard_step4_ao3_cta',
    url: 'https://archiveofourown.org/donate',
    color: '#22c55e',
    icon: 'favorite',
  },
  {
    key: 'co3',
    labelKey: 'onboard_step4_co3_label',
    descriptionKey: 'onboard_step4_co3_desc',
    ctaKey: 'onboard_step4_co3_cta',
    url: 'https://ko-fi.com/tbvns',
    color: '#6366f1',
    icon: 'coffee',
  },
];

export default function Step4({ currentTheme, setScreen, onFinish }) {
  const { t } = useTranslation();

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
          {t('onboard_step4_title')}
        </Text>
        <Text style={[styles.subheading, { color: currentTheme.secondaryTextColor }]}>
          {t('onboard_step4_sub')}
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
                  {t(item.labelKey)}
                </Text>
                <Text style={[styles.cardDesc, { color: currentTheme.secondaryTextColor }]}>
                  {t(item.descriptionKey)}
                </Text>
                <TouchableOpacity
                  style={[styles.ctaButton, { backgroundColor: item.color }]}
                  onPress={() => Linking.openURL(item.url)}
                  activeOpacity={0.85}
                >
                  <Icon name="open-in-new" size={14} color="#fff" />
                  <Text style={styles.ctaText}>{t(item.ctaKey)}</Text>
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
          <Text style={styles.nextButtonText}>{t('onboard_step4_button')}</Text>
          <Icon name="arrow-forward" size={18} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// styles identical to your original Step3 – omitted for brevity, keep as is
const styles = StyleSheet.create({
  container: { flex: 1 },
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
  cardList: { gap: 14 },
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
  cardBody: { flex: 1, gap: 6 },
  cardTitle: { fontSize: 15, fontWeight: '700' },
  cardDesc: { fontSize: 13, lineHeight: 19 },
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
  ctaText: { color: '#fff', fontSize: 13, fontWeight: '600' },
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