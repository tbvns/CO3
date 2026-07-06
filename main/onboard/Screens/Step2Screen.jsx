import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTranslation } from 'react-i18next';
import {
  availableLanguages,
  changeLanguage,
} from '../../storage/LanguageManager';
import { getFlagImage } from '../../utils/FlagUtils';

export default function Step2({ currentTheme, setScreen }) {
  const { t, i18n } = useTranslation(); // i18n is reactive
  const currentLng = i18n.language;

  const languages = availableLanguages.map(lang => ({
    key: lang.code,
    label: lang.label,
    flag: lang.flag,
  }));

  const selectLanguage = async lng => {
    await changeLanguage(lng);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
        <Text style={[styles.heading, { color: currentTheme.textColor }]}>
          {t('onboard_step2_language_title')}
        </Text>
        <Text
          style={[
            styles.subheading,
            { color: currentTheme.secondaryTextColor },
          ]}
        >
          {t('onboard_step2_language_sub')}
        </Text>

        <View style={styles.grid}>
          {languages.map(lang => {
            const isActive = lang.key === currentLng;
            return (
              <TouchableOpacity
                key={lang.key}
                style={[
                  styles.languageCard,
                  {
                    backgroundColor: currentTheme.cardBackground || '#fff',
                    borderColor: isActive
                      ? currentTheme.primaryColor
                      : currentTheme.borderColor,
                    borderWidth: isActive ? 2 : 1,
                  },
                ]}
                onPress={() => selectLanguage(lang.key)}
                activeOpacity={0.85}
              >
                <Image
                  source={getFlagImage(lang.flag)}
                  style={styles.flag}
                  resizeMode="contain"
                />
                <Text
                  style={[
                    styles.languageLabel,
                    { color: currentTheme.textColor },
                  ]}
                >
                  {lang.label}
                </Text>
                {isActive && (
                  <View
                    style={[
                      styles.activeBadge,
                      { backgroundColor: currentTheme.primaryColor },
                    ]}
                  >
                    <Icon name="check" size={12} color="#fff" />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <View
        style={[styles.navRow, { borderTopColor: currentTheme.borderColor }]}
      >
        <TouchableOpacity
          style={[styles.backButton, { borderColor: currentTheme.borderColor }]}
          onPress={() => setScreen(prev => Math.max(0, prev - 1))}
          activeOpacity={0.7}
        >
          <Icon name="arrow-back" size={20} color={currentTheme.textColor} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.nextButton,
            { backgroundColor: currentTheme.primaryColor },
          ]}
          onPress={() => setScreen(prev => prev + 1)}
          activeOpacity={0.85}
        >
          <Text style={styles.nextButtonText}>{t('onboard_step2_button')}</Text>
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  languageCard: {
    width: '47%',
    aspectRatio: 1,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderWidth: 1,
    position: 'relative',
  },
  flag: {
    width: 90,
    height: 67,
    marginBottom: 12,
    borderRadius: 4,
    alignSelf: 'center',
  },
  languageLabel: {
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
  activeBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
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