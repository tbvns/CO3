import {
  Alert,
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
import CustomToast from '../../components/common/CustomToast';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bar } from 'react-native-progress';
import { useContext, useEffect, useState } from 'react';
import DeviceInfo from 'react-native-device-info';
import { countDownloads, deleteAllDownloads } from '../../downloads/Downloader';
import { AppContext } from '../../app';
import { clearUnusedCache, database } from '../../storage/Database';
import { exportBackup, importBackup } from '../../storage/Backups';
import {
  errorCodes,
  isErrorWithCode,
  pick,
  types,
} from '@react-native-documents/picker';
import RNRestart from 'react-native-restart';

export default function StorageScreen({ route }) {
  const { setScreens, currentTheme, databaseObj } = route.params;
  const { workDAO, chapterDAO } = useContext(AppContext)

  console.log(databaseObj);

  const navigation = useNavigation();

  function onBack() {
    navigation.goBack();
  }

  const { t } = useTranslation();

  const [storageData, setStorageData] = useState();
  const [downloadedCount, setDownloadedCount] = useState();
  const [cachedWorksCount, setCachedWorksCount] = useState();
  const [cachedChaptersCount, setCachedChaptersCount] = useState();

  async function getStorageData() {
    const totalSpace = await DeviceInfo.getTotalDiskCapacity();
    const freeSpace = await DeviceInfo.getFreeDiskStorage();

    const totalRawGB = totalSpace / (1024 * 1024 * 1024);
    const freeRawGB = freeSpace / (1024 * 1024 * 1024);
    const usedRawGB = totalRawGB - freeRawGB;

    setStorageData({
      totalSpace: totalSpace,
      freeSpace: freeSpace,
      totalGB: totalRawGB.toFixed(2),
      freeGB: freeRawGB.toFixed(2),
      usedGB: usedRawGB.toFixed(2),
    });
  }

  async function getDownloadedCount() {
    setDownloadedCount(await countDownloads());
  }

  async function getCachedCount() {
    setCachedWorksCount(await workDAO.countWorks());
    setCachedChaptersCount(await chapterDAO.countChapters());
  }

  useEffect(() => {
    getStorageData();
    getDownloadedCount();
    getCachedCount();
  }, []);

  async function clearCache() {
    clearUnusedCache(databaseObj)
      .then(count => {
        Toast.show({
          text1: t('screen_storage_button_clear_unused_cache_success_1'),
          text2: t(`screen_storage_button_clear_unused_cache_success_2`, {
            count: count,
          }),
          type: 'success',
        });
    }).catch(err => {
      Toast.show({
        text1: t('screen_storage_button_clear_unused_cache_err_1'),
        text2: t(`screen_storage_button_clear_unused_cache_err_2`, {
          error: err.message,
        }),
        type: 'error',
      });
    }).finally(() => {
      getCachedCount();
      getStorageData();
    });
  }

  async function deleteDownloads() {
    await deleteAllDownloads().then(res => {
      if (!res) {
        Toast.show({
          type: 'success',
          text1: t('screen_storage_button_delete_downloaded_success_1'),
          text2: t('screen_storage_button_delete_downloaded_success_2'),
        });
      } else {
        Toast.show({
          type: 'error',
          text1: t('screen_storage_button_delete_downloaded_failed_1'),
          text2: t('screen_storage_button_delete_downloaded_failes_2', { error: res.message }),
        });
      }
    }).finally(() => {
      getDownloadedCount();
      getStorageData()
    })
  }

  async function createBackup() {
    exportBackup(databaseObj).then(() => {
      Toast.show({
        type: 'success',
        text1: t('screen_storage_button_create_backup_success_1'),
        text2: t('screen_storage_button_create_backup_success_2'),
      });
    }).catch(err => {
      Toast.show({
        type: 'error',
        text1: t("screen_storage_button_create_backup_err_1"),
        text2: t("screen_storage_button_create_backup_err_2"),
      });
    })
  }

  async function onImportBackup() {
    Alert.alert(
      t('screen_storage_msg_import_backup_warning_1'),
      t('screen_storage_msg_import_backup_warning_2'),
      [
        {
          text: t('general_cancel'),
          onPress: () => {
            Toast.show({
              type: 'error',
              text1: t('screen_storage_button_import_backup_cancel_1'),
              text2: t('screen_storage_button_import_backup_cancel_2'),
            });
          },
          style: 'cancel',
        },
        {
          text: t('general_proceed'),
          onPress: async () => {
            try {
              const [file] = await pick({
                type: [types.zip],
              });

              const zipPath = file.uri.replace('file://', '');
              await importBackup(databaseObj, zipPath);

              Toast.show({
                type: 'success',
                text1: t('screen_storage_button_import_backup_success_1'),
                text2: t('screen_storage_button_import_backup_success_2'),
              });

              setTimeout(() => {
                RNRestart.restart();
              }, 1200);
            } catch (err) {
              if (isErrorWithCode(err) && err.code === errorCodes.OPERATION_CANCELED) {
                Toast.show({
                  type: 'error',
                  text1: t('screen_storage_button_import_backup_cancel_1'),
                  text2: t('screen_storage_button_import_backup_cancel_2'),
                });
              } else {
                Toast.show({
                  type: 'error',
                  text1: t('screen_storage_button_import_backup_err_1'),
                  text2: t('screen_storage_button_import_backup_err_2', { error: err.message }),
                });
              }
            }
          },
        },
      ],
    );
  }

  return (
    <SafeAreaView
      style={[
        { backgroundColor: currentTheme.backgroundColor },
        styles.container,
      ]}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Icon name="arrow-back" size={24} color={currentTheme.textColor} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: currentTheme.textColor }]}>
          {t('screen_storage_title')}
        </Text>
      </View>
      <ScrollView style={styles.content}>
        <View
          style={[
            styles.pageSection,
            { borderColor: currentTheme.borderColor },
          ]}
        >
          <View style={styles.sectionHeader}>
            <Icon name="storage" size={20} color={currentTheme.iconColor} />
            <Text
              style={[styles.sectionTitle, { color: currentTheme.textColor }]}
            >
              {t('screen_storage_section_storage')}
            </Text>
          </View>
          <View
            style={[
              styles.pane,
              {
                backgroundColor: currentTheme.cardBackground,
                borderColor: currentTheme.borderColor,
              },
            ]}
          >
            <Text
              style={[
                { color: currentTheme.textColor, paddingBottom: 4 },
                styles.text,
              ]}
            >
              {t('screen_storage_msg_usage', {
                total: storageData?.totalGB || '?',
                used: storageData?.usedGB || '?',
              })}
            </Text>
            <Bar
              progress={
                storageData?.freeGB &&
                storageData?.totalGB &&
                storageData.usedGB / storageData.totalGB
              }
              width={null}
              color={currentTheme.primaryColor}
              backgroundColor={currentTheme.inputBackground}
              borderColor={currentTheme.borderColor}
              height={10}
              borderRadius={20}
            />
            <Text
              style={[
                { color: currentTheme.textColor, paddingTop: 10 },
                styles.text,
              ]}
            >
              {t('screen_storage_msg_downloaded_count', {
                count: downloadedCount?.chapterCount ?? t('general_loading'),
              })}
            </Text>
            <Text style={[{ color: currentTheme.textColor }, styles.text]}>
              {t('screen_storage_msg_cached_works_count', {
                count: cachedWorksCount,
              })}
            </Text>
            <Text style={[{ color: currentTheme.textColor }, styles.text]}>
              {t('screen_storage_msg_cached_chapters_count', {
                count: cachedChaptersCount,
              })}
            </Text>
          </View>

          <TouchableOpacity onPress={clearCache}>
            <Text
              style={[
                styles.button,
                {
                  color: currentTheme.textColor,
                  backgroundColor: currentTheme.primaryColor,
                },
              ]}
            >
              {t('screen_storage_button_clear_unused_cache')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={deleteDownloads}>
            <Text
              style={[
                styles.button,
                {
                  color: currentTheme.textColor,
                  backgroundColor: currentTheme.primaryColor,
                },
              ]}
            >
              {t('screen_storage_button_delete_downloaded')}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.sectionHeader}>
          <Icon name="sd-card" size={20} color={currentTheme.iconColor} />
          <Text
            style={[styles.sectionTitle, { color: currentTheme.textColor }]}
          >
            {t('screen_storage_section_backups')}
          </Text>
        </View>
        <TouchableOpacity
          onPress={createBackup}
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
            {t('screen_storage_button_create_backup')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onImportBackup}>
          <Text
            style={[
              styles.button,
              {
                color: currentTheme.textColor,
                backgroundColor: currentTheme.primaryColor,
              },
            ]}
          >
            {t('screen_storage_button_import_backup')}
          </Text>
        </TouchableOpacity>

        <Text
          style={[styles.text, { color: currentTheme.secondaryTextColor, paddingTop: 10 }]}
        >
          {t('screen_storage_msg_backup_1')}
        </Text>
        <Text
          style={[styles.text, { color: currentTheme.secondaryTextColor, paddingTop: 10 }]}
        >
          {t('screen_storage_msg_backup_2')}
        </Text>
      </ScrollView>
      <CustomToast currentTheme={currentTheme} />
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
    marginBottom: 16
  },
  pane: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
    marginBottom: 24
  },
  pageSection: {
    borderBottomWidth: 1,
    marginBottom: 16,
  },
  text: {
    fontSize: 16,
  }
});
