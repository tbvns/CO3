import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Toast from 'react-native-toast-message';
import { exportDb } from '../../storage/DatabaseManager';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';

export default function StorageScreen({
  route
}) {
  const {
    setScreens,
    currentTheme,
    databaseObj,
  } = route.params;

  const navigation = useNavigation();

  function onBack() {
    navigation.goBack();
  }

  const { t } = useTranslation();

  return (
    <SafeAreaView style={[{backgroundColor: currentTheme.backgroundColor}, styles.container]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Icon name="arrow-back" size={24} color={currentTheme.textColor} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: currentTheme.textColor }]}>
          {t('screen_storage_title')}
        </Text>
      </View>
      <ScrollView style={styles.content}>
        <View style={styles.sectionHeader}>
          <Icon name="storage" size={20} color={currentTheme.iconColor} />
          <Text
            style={[styles.sectionTitle, { color: currentTheme.textColor }]}
          >
            {t('screen_storage_section_database')}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => {
            exportDb(databaseObj)
              .then(() => {
                Toast.show({
                  type: 'success',
                  text1: t('screen_storage_export_database_success'),
                  text2: t('screen_storage_export_database_success_sub'),
                });
              })
              .catch(err => {
                Toast.show({
                  type: 'error',
                  text1: t('screen_storage_export_database_error_generic'),
                  text2: err.message,
                });
              });
          }}
        >
          <Text
            style={[
              styles.button,
              {
                color: currentTheme.textColor,
                backgroundColor: currentTheme.primaryColor,
              },
            ]}
          >
            {t('screen_storage_button_export_database')}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginLeft: 16,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
    paddingBottom: 24,
    borderBottomWidth: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 12,
  },
  previewContainer: {
    borderRadius: 8,
    marginBottom: 20,
    overflow: 'hidden',
    borderWidth: 1,
  },
  settingItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  settingText: {
    fontSize: 16,
    marginBottom: 12,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  slider: {
    flex: 1,
    marginRight: 12,
  },
  sizeInput: {
    width: 60,
    textAlign: 'center',
    fontWeight: '600',
  },
  themeContainer: {
    flexDirection: 'row',
    borderRadius: 8,
    padding: 4,
  },
  themeButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
    marginHorizontal: 1,
  },
  themeButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  viewModeContainer: {
    flexDirection: 'row',
    borderRadius: 8,
    padding: 4,
  },
  viewModeButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
    marginHorizontal: 1,
  },
  viewModeButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  button: {
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
});
