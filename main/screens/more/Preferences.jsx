import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { WebView } from 'react-native-webview';
import Slider from '@react-native-community/slider';
import {
  DOWNLOAD_WHILE_READING,
  getJsonSettings,
  saveJsonSettings,
  UPDATE_INTERVALS,
  UPDATE_RESTRICTIONS,
} from '../../storage/jsonSettings';
import { themes } from '../../utils/themes';
import CustomDropdown from '../../components/common/CustomDropdown';
import { keepLocalCopy, pick } from '@react-native-documents/picker';
import { useTranslation } from 'react-i18next';
import {
  availableLanguages,
  changeLanguage,
} from '../../storage/LanguageManager';
import { useNavigation } from '@react-navigation/native';

const PreferencesScreen = ({
  route
}) => {
  const {
    currentTheme,
    settingsDAO,
    setScreens,
    setTheme,
    viewMode,
    setViewMode,
    onRestartOnboarding,
  } = route.params;
  const navigation = useNavigation();

  // DB Settings State
  const [fontSize, setFontSize] = useState(1.0);
  const [useCustomSize, setUseCustomSize] = useState(false);
  const [font, setFont] = useState('');
  const [fontFamily, setFontFamily] = useState('');
  const [useCustomFont, setUseCustomFont] = useState(false);
  const [theme, setLocalTheme] = useState(currentTheme.name);
  const [localViewMode, setLocalViewMode] = useState('full');

  // JSON Settings State
  const [preferDesc, setPreferDesc] = useState(false);
  const [allowSelect, setAllowSelect] = useState(false);
  const [downloadOnUpdate, setDownloadOnUpdate] = useState(false);
  const [downloadWhileReading, setDownloadWhileReading] = useState(0);
  const [preferHtml, setPreferHtml] = useState(false);
  const [showChapterDate, setShowChapterDate] = useState(false);
  const [compactNotifications, setCompactNotifications] = useState(false);
  const [updateTime, setUpdateTime] = useState(1440);
  const [updateRestriction, setUpdateRestriction] = useState(3);

  const activeTheme = themes[theme] || currentTheme;

  const { t, i18n } = useTranslation(); // i18n is reactive

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      // Load Database Settings (Appearance)
      const dbSettings = await settingsDAO.getSettings();
      if (dbSettings) {
        setFontSize(dbSettings.fontSize || 1.0);
        setUseCustomSize(dbSettings.useCustomSize || false);
        setFont(dbSettings.font || '');
        setFontFamily(dbSettings.fontFamily || 'Helvetica');
        setUseCustomFont(dbSettings.useCustomFont || false);
        setLocalTheme(dbSettings.theme || 'light');
        setLocalViewMode(dbSettings.viewMode || 'full');
      }

      // Load JSON Settings (Functional)
      const jsonSettings = await getJsonSettings();
      if (jsonSettings) {
        setShowChapterDate(jsonSettings.showChapterDate || false);
        setCompactNotifications(jsonSettings.compactNotifications || false);
        setUpdateTime(jsonSettings.time || 1440);

        setPreferDesc(jsonSettings.showFullDescription || false);
        setPreferHtml(jsonSettings.preferHtml || false);

        setAllowSelect(jsonSettings.allowSelectingText || false);
        setDownloadWhileReading(jsonSettings.downloadWhileReading || 0);
        setDownloadOnUpdate(jsonSettings.downloadOnUpdate || false);

        // Handle array wrapper for restriction
        const restriction = Array.isArray(jsonSettings.updateRestriction)
          ? jsonSettings.updateRestriction[0]
          : jsonSettings.updateRestriction;
        setUpdateRestriction(restriction !== undefined ? restriction : 3);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const saveDbSettings = async newSettings => {
    try {
      const settings = await settingsDAO.getSettings();
      const updatedSettings = { ...settings, ...newSettings };
      await settingsDAO.saveSettings(updatedSettings);
    } catch (error) {
      console.error('Error saving DB settings:', error);
    }
  };

  const saveJsonSettingsData = async newSettings => {
    try {
      // Fetch fresh settings to prevent overwriting other fields
      const currentSettings = await getJsonSettings();
      const updatedSettings = { ...currentSettings, ...newSettings };
      await saveJsonSettings(updatedSettings);
    } catch (error) {
      console.error('Error saving JSON settings:', error);
    }
  };

  // --- Handlers ---

  const handleFontSizeChange = value => {
    const clampedValue = Math.min(Math.max(value, 0.5), 3);
    setFontSize(clampedValue);
    saveDbSettings({ fontSize: clampedValue });
  };

  const toggleCustomSize = () => {
    const newValue = !useCustomSize;
    setUseCustomSize(newValue);
    saveDbSettings({ useCustomSize: newValue });
  };

  const handleFontChange = async () => {
    const [picked] = await pick({ type: ['font/ttf', 'font/otf'] });
    if (!picked || !picked.name) return;

    keepLocalCopy({
      destination: 'cachesDirectory',
      files: [{ uri: picked.uri, fileName: picked.name }],
    }).then(([dest]) => {
      const tempFontFamily = picked.name
        .replace(/\.(?=.*\.)/g, '')
        .split('.')[0]
        .replace(/[^a-zA-Z0-9_-]/g, '');

      setFont(dest.localUri);
      setFontFamily(tempFontFamily);
      saveDbSettings({ tempFontFamily, font: dest.localUri });
    });
  };

  const toggleCustomFont = () => {
    const newValue = !useCustomFont;
    setUseCustomFont(newValue);
    saveDbSettings({ useCustomFont: newValue });
  };

  const handleThemeChange = newTheme => {
    setLocalTheme(newTheme);
    saveDbSettings({ theme: newTheme });
    if (setTheme) setTheme(newTheme);
  };

  const handleViewModeChange = newMode => {
    setLocalViewMode(newMode);
    saveDbSettings({ viewMode: newMode });
    if (setViewMode) setViewMode(newMode);
  };

  const handleShowChapterDate = () => {
    const newValue = !showChapterDate;
    setShowChapterDate(newValue);
    saveJsonSettingsData({ showChapterDate: newValue });
  };

  const handleCompactNotifications = () => {
    const newValue = !compactNotifications;
    setCompactNotifications(newValue);
    saveJsonSettingsData({ compactNotifications: newValue });
  };

  const handlePreferDesc = () => {
    const newValue = !preferDesc;
    setPreferDesc(newValue);
    saveJsonSettingsData({ showFullDescription: newValue });
  };

  const handleAllowSelect = () => {
    const newValue = !allowSelect;
    setAllowSelect(newValue);
    saveJsonSettingsData({ allowSelectingText: newValue });
  };

  const handlePreferHtml = () => {
    const newValue = !preferHtml;
    setPreferHtml(newValue);
    saveJsonSettingsData({ preferHtml: newValue });
  };

  const handleUpdateTimeChange = value => {
    setUpdateTime(value);
    saveJsonSettingsData({ time: value });
  };

  const handleUpdateRestrictionChange = value => {
    setUpdateRestriction(value);
    saveJsonSettingsData({ updateRestriction: [value] });
  };

  const handleDownloadWhileReadinChange = value => {
    setDownloadWhileReading(value);
    saveJsonSettingsData({ downloadWhileReading: value });
  };

  const handleDownloadOnUpdateChange = () => {
    const newValue = !downloadOnUpdate;
    setDownloadOnUpdate(newValue);
    saveJsonSettingsData({ downloadOnUpdate: newValue });
  };

  const handleLanguageChange = async lng => {
    await changeLanguage(lng);
  };

  const handleRestartOnboarding = () => {
    Alert.alert(
      t('screen_preferences_onboarding_title'),
      t('screen_preferences_onboarding_text'),
      [
        { text: t('general_cancel'), style: 'cancel' },
        {
          text: t('general_restart'),
          style: 'destructive',
          onPress: async () => {
            await saveJsonSettingsData({ finishedOnboarding: false });
            if (onRestartOnboarding) {
              onRestartOnboarding();
            } else {
              onBack();
            }
          },
        },
      ],
    );
  };

  // --- HTML Preview ---

  const sampleHtml = useMemo(() => {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        ${
          useCustomFont
            ? `@font-face {font-family: '${fontFamily}'; src: url('${font}')}`
            : ''
        }

        body {
          font-family: ${
            useCustomFont
              ? fontFamily
              : "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
          };
          line-height: 1.6;
          padding: 20px;
          background-color: ${activeTheme.backgroundColor};
          color: ${activeTheme.textColor};
          font-size: ${useCustomSize ? fontSize + 'em' : '1em'};
        }
        h1 { 
          color: ${activeTheme.textColor};
          border-bottom: 2px solid ${activeTheme.primaryColor};
          padding-bottom: 8px;
        }
        p { 
          color: ${activeTheme.textColor};
          margin-bottom: 12px;
        }
        a { 
          color: ${activeTheme.primaryColor};
        }
        blockquote {
          border-left: 4px solid ${activeTheme.primaryColor};
          background-color: ${activeTheme.inputBackground};
          padding: 16px;
          margin: 16px 0;
          border-radius: 4px;
        }
      </style>
    </head>
    <body>
      <h1>${t('screen_preferences_sample_title')}</h1>
      <p>${t('screen_preferences_sample_text')}</p>
      <blockquote>
        <p>${t('screen_preferences_sample_blockquotes')}</p>
      </blockquote>
      <p>${t('screen_preferences_sample_end')}</p>
    </body>
    </html>
  `;
  }, [activeTheme, useCustomSize, fontSize, useCustomFont, fontFamily, font]);

  // --- Render Helpers ---

  const ThemeButton = ({ themeKey, label, isActive, onPress }) => {
    const buttonStyle = [
      styles.themeButton,
      { backgroundColor: isActive ? activeTheme.primaryColor : 'transparent' },
    ];
    const textStyle = [
      styles.themeButtonText,
      { color: isActive ? '#ffffff' : activeTheme.textColor },
    ];

    return (
      <TouchableOpacity
        style={buttonStyle}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <Text style={textStyle}>{label}</Text>
      </TouchableOpacity>
    );
  };

  const ViewModeButton = ({ mode, label, isActive, onPress }) => {
    const buttonStyle = [
      styles.viewModeButton,
      { backgroundColor: isActive ? activeTheme.primaryColor : 'transparent' },
    ];
    const textStyle = [
      styles.viewModeButtonText,
      { color: isActive ? '#ffffff' : activeTheme.textColor },
    ];

    return (
      <TouchableOpacity
        style={buttonStyle}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <Text style={textStyle}>{label}</Text>
      </TouchableOpacity>
    );
  };

  function onBack() {
    navigation.goBack();
  }

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: activeTheme.backgroundColor },
      ]}
    >
      <View
        style={[
          styles.header,
          {
            borderBottomColor: activeTheme.borderColor,
            backgroundColor: activeTheme.headerBackground,
          },
        ]}
      >
        <TouchableOpacity onPress={onBack}>
          <Icon name="arrow-back" size={24} color={activeTheme.iconColor} />
        </TouchableOpacity>
        <Text
          style={[
            styles.title,
            { color: activeTheme.textColor },
            { fontWeight: 'bold' },
          ]}
        >
          {t('screen_preferences_title')}
        </Text>
      </View>

      <ScrollView style={styles.content}>
        <View
          style={[
            styles.section,
            { borderBottomColor: activeTheme.borderColor },
          ]}
        >
          <View style={styles.sectionHeader}>
            <Icon name="language" size={20} color={activeTheme.iconColor} />
            <Text
              style={[{ color: activeTheme.textColor }, styles.sectionTitle]}
            >
              {t('screen_preferences_title_general')}
            </Text>
          </View>

          <View style={[styles.settingItem, { borderBottomWidth: 0 }]}>
            <Text
              style={[{ color: activeTheme.textColor }, styles.settingText]}
            >
              {t('screen_preferences_label_language')}
            </Text>
            <CustomDropdown
              selectedValue={i18n.language}
              onValueChange={handleLanguageChange}
              theme={activeTheme}
              style={{ marginTop: 8 }}
            >
              {availableLanguages.map(lang => (
                <CustomDropdown.Item
                  key={lang.code}
                  label={lang.label}
                  value={lang.code}
                />
              ))}
            </CustomDropdown>
          </View>
        </View>

        {/* READER SETTINGS */}
        <View
          style={[
            styles.section,
            { borderBottomColor: activeTheme.borderColor },
          ]}
        >
          <View style={styles.sectionHeader}>
            <Icon name="menu-book" size={20} color={activeTheme.iconColor} />
            <Text
              style={[{ color: activeTheme.textColor }, styles.sectionTitle]}
            >
              {t('screen_preferences_title_reader')}
            </Text>
          </View>

          <View
            style={[
              styles.previewContainer,
              {
                backgroundColor: activeTheme.cardBackground,
                borderColor: activeTheme.borderColor,
              },
            ]}
          >
            <WebView
              originWhitelist={['*']}
              source={{ html: sampleHtml }}
              allowFileAccess={true}
              style={{ height: 180 }}
              scalesPageToFit={true}
              bounces={false}
              nestedScrollEnabled={true}
            />
          </View>

          <View
            style={[
              styles.settingItem,
              { borderBottomColor: activeTheme.borderColor },
            ]}
          >
            <View style={styles.switchContainer}>
              <Text
                style={[{ color: activeTheme.textColor }, styles.settingText]}
              >
                {t('screen_preferences_setting_custom_size')}
              </Text>
              <Switch
                value={useCustomSize}
                onValueChange={toggleCustomSize}
                thumbColor={
                  useCustomSize ? activeTheme.primaryColor : '#f4f3f4'
                }
                trackColor={{
                  false: '#767577',
                  true: `${activeTheme.primaryColor}40`,
                }}
              />
            </View>
          </View>

          {useCustomSize && (
            <View
              style={[
                styles.settingItem,
                { borderBottomColor: activeTheme.borderColor },
              ]}
            >
              <Text
                style={[{ color: activeTheme.textColor }, styles.settingText]}
              >
                {t('screen_preferences_font_size_text', {
                  size: fontSize.toFixed(1),
                })}
              </Text>
              <View style={styles.sliderContainer}>
                <Slider
                  style={styles.slider}
                  minimumValue={0.5}
                  maximumValue={3}
                  step={0.1}
                  value={fontSize}
                  onValueChange={handleFontSizeChange}
                  minimumTrackTintColor={activeTheme.primaryColor}
                  maximumTrackTintColor={activeTheme.borderColor}
                  thumbStyle={{ backgroundColor: activeTheme.primaryColor }}
                />
                <Text
                  style={[{ color: activeTheme.textColor }, styles.sizeInput]}
                >
                  {fontSize.toFixed(1)}
                </Text>
              </View>
            </View>
          )}

          <View
            style={[
              styles.settingItem,
              { borderBottomColor: activeTheme.borderColor },
            ]}
          >
            <View style={styles.switchContainer}>
              <Text
                style={[{ color: activeTheme.textColor }, styles.settingText]}
              >
                {t('screen_preferences_setting_custom_font')}
              </Text>
              <Switch
                value={useCustomFont}
                onValueChange={toggleCustomFont}
                thumbColor={
                  useCustomFont ? activeTheme.primaryColor : '#f4f3f4'
                }
                trackColor={{
                  false: '#767577',
                  true: `${activeTheme.primaryColor}40`,
                }}
              />
            </View>
          </View>

          {useCustomFont && (
            <View
              style={[
                styles.settingItem,
                { borderBottomColor: activeTheme.borderColor },
              ]}
            >
              <TouchableOpacity
                style={[
                  styles.viewModeSelectButton,
                  {
                    backgroundColor: activeTheme.buttonBackground,
                    paddingBottom: 0,
                    marginHorizontal: 0,
                    borderColor: activeTheme.borderColor,
                    alignContent: 'center',
                  },
                ]}
                activeOpacity={0.3}
                onPress={handleFontChange}
              >
                <Text
                  style={[{ color: activeTheme.textColor }, styles.settingText]}
                >
                  {fontFamily}
                </Text>
                <Icon
                  name={'chevron-right'}
                  size={24}
                  style={{
                    color: currentTheme.placeholderColor,
                    marginLeft: 'auto',
                  }}
                />
              </TouchableOpacity>
            </View>
          )}

          <View
            style={[
              styles.settingItem,
              { borderBottomColor: activeTheme.borderColor },
            ]}
          >
            <View style={styles.switchContainer}>
              <Text
                style={[{ color: activeTheme.textColor }, styles.settingText]}
              >
                {t('screen_preferences_setting_show_date')}
              </Text>
              <Switch
                value={showChapterDate}
                onValueChange={handleShowChapterDate}
                thumbColor={
                  showChapterDate ? activeTheme.primaryColor : '#f4f3f4'
                }
                trackColor={{
                  false: '#767577',
                  true: `${activeTheme.primaryColor}40`,
                }}
              />
            </View>
          </View>
          <View
            style={[
              styles.settingItem,
              { borderBottomColor: activeTheme.borderColor },
              { borderBottomWidth: 0 },
            ]}
          >
            <View style={[styles.switchContainer]}>
              <Text
                style={[{ color: activeTheme.textColor }, styles.settingText]}
              >
                {t('screen_preferences_setting_allow_text_select')}
              </Text>
              <Switch
                value={allowSelect}
                onValueChange={handleAllowSelect}
                thumbColor={allowSelect ? activeTheme.primaryColor : '#f4f3f4'}
                trackColor={{
                  false: '#767577',
                  true: `${activeTheme.primaryColor}40`,
                }}
              />
            </View>
          </View>
        </View>

        {/* APPEARANCE SETTINGS */}
        <View
          style={[
            styles.section,
            { borderBottomColor: activeTheme.borderColor },
          ]}
        >
          <View style={styles.sectionHeader}>
            <Icon name="palette" size={20} color={activeTheme.iconColor} />
            <Text
              style={[{ color: activeTheme.textColor }, styles.sectionTitle]}
            >
              {t('screen_preferences_title_appearance')}
            </Text>
          </View>

          <View style={styles.settingItem}>
            <Text
              style={[{ color: activeTheme.textColor }, styles.settingText]}
            >
              {t('screen_preferences_label_theme')}
            </Text>
            <View
              style={[
                styles.themeContainer,
                { backgroundColor: activeTheme.inputBackground },
              ]}
            >
              <ThemeButton
                themeKey="light"
                label={t('screen_preferences_label_theme_light')}
                isActive={theme === 'light'}
                onPress={() => handleThemeChange('light')}
              />
              <ThemeButton
                themeKey="dark"
                label={t('screen_preferences_label_theme_dark')}
                isActive={theme === 'dark'}
                onPress={() => handleThemeChange('dark')}
              />
              <ThemeButton
                themeKey="black"
                label={t('screen_preferences_label_theme_black')}
                isActive={theme === 'black'}
                onPress={() => handleThemeChange('black')}
              />
            </View>
          </View>

          <View style={[styles.settingItem, { borderBottomWidth: 0 }]}>
            <Text
              style={[{ color: activeTheme.textColor }, styles.settingText]}
            >
              {t('screen_preferences_label_view_mode')}
            </Text>
            <View
              style={[
                styles.viewModeContainer,
                { backgroundColor: activeTheme.inputBackground },
              ]}
            >
              <ViewModeButton
                mode="full"
                label={t('screen_preferences_label_view_mode_full')}
                isActive={localViewMode === 'full'}
                onPress={() => handleViewModeChange('full')}
              />
              <ViewModeButton
                mode="med"
                label={t('screen_preferences_label_view_mode_med')}
                isActive={localViewMode === 'med'}
                onPress={() => handleViewModeChange('med')}
              />
              <ViewModeButton
                mode="small"
                label={t('screen_preferences_label_view_mode_small')}
                isActive={localViewMode === 'small'}
                onPress={() => handleViewModeChange('small')}
              />
            </View>
          </View>

          <View
            style={[
              styles.settingItem,
              { borderBottomColor: activeTheme.borderColor },
            ]}
          >
            <View style={styles.switchContainer}>
              <Text
                style={[{ color: activeTheme.textColor }, styles.settingText]}
              >
                {t('screen_preferences_setting_show_full_desc')}
              </Text>
              <Switch
                value={preferDesc}
                onValueChange={handlePreferDesc}
                thumbColor={preferDesc ? activeTheme.primaryColor : '#f4f3f4'}
                trackColor={{
                  false: '#767577',
                  true: `${activeTheme.primaryColor}40`,
                }}
              />
            </View>
          </View>

          <View
            style={[
              styles.settingItem,
              { borderBottomColor: activeTheme.borderColor },
              { borderBottomWidth: 0 },
            ]}
          >
            <View style={styles.switchContainer}>
              <Text
                style={[{ color: activeTheme.textColor }, styles.settingText]}
              >
                {t('screen_preferences_setting_prefer_html')}
              </Text>
              <Switch
                value={preferHtml}
                onValueChange={handlePreferHtml}
                thumbColor={preferHtml ? activeTheme.primaryColor : '#f4f3f4'}
                trackColor={{
                  false: '#767577',
                  true: `${activeTheme.primaryColor}40`,
                }}
              />
            </View>
          </View>
        </View>

        {/* UPDATE & NOTIFICATION SETTINGS */}
        <View
          style={[styles.section, { borderColor: activeTheme.borderColor }]}
        >
          <View style={styles.sectionHeader}>
            <Icon name="update" size={20} color={activeTheme.iconColor} />
            <Text
              style={[{ color: activeTheme.textColor }, styles.sectionTitle]}
            >
              {t('screen_preferences_title_update')}
            </Text>
          </View>

          <View
            style={[
              styles.settingItem,
              { borderBottomColor: activeTheme.borderColor },
            ]}
          >
            <View style={styles.switchContainer}>
              <Text
                style={[{ color: activeTheme.textColor }, styles.settingText]}
              >
                {t('screen_preferences_setting_compact_notifications')}
              </Text>
              <Switch
                value={compactNotifications}
                onValueChange={handleCompactNotifications}
                thumbColor={
                  compactNotifications ? activeTheme.primaryColor : '#f4f3f4'
                }
                trackColor={{
                  false: '#767577',
                  true: `${activeTheme.primaryColor}40`,
                }}
              />
            </View>
          </View>

          <View
            style={[
              styles.settingItem,
              { borderBottomColor: activeTheme.borderColor },
            ]}
          >
            <Text
              style={[{ color: activeTheme.textColor }, styles.settingText]}
            >
              {t('screen_preferences_label_check_frequency')}
            </Text>
            <CustomDropdown
              selectedValue={updateTime}
              onValueChange={handleUpdateTimeChange}
              theme={activeTheme}
              style={{ marginTop: 8 }}
            >
              {Object.values(UPDATE_INTERVALS).map(interval => (
                <CustomDropdown.Item
                  key={interval.value}
                  label={t(interval.label)}
                  value={interval.value}
                />
              ))}
            </CustomDropdown>
          </View>

          <View style={[styles.settingItem, { borderBottomWidth: 0 }]}>
            <Text
              style={[{ color: activeTheme.textColor }, styles.settingText]}
            >
              {t('screen_preferences_label_network_restriction')}
            </Text>
            <CustomDropdown
              selectedValue={updateRestriction}
              onValueChange={handleUpdateRestrictionChange}
              theme={activeTheme}
              style={{ marginTop: 8 }}
            >
              {Object.values(UPDATE_RESTRICTIONS).map(restriction => (
                <CustomDropdown.Item
                  key={restriction.value}
                  label={t(restriction.label)}
                  value={restriction.value}
                />
              ))}
            </CustomDropdown>
          </View>
        </View>

        <View style={[styles.section, { borderBottomWidth: 0 }]}>
          <View style={styles.sectionHeader}>
            <Icon name="download" size={20} color={activeTheme.iconColor} />
            <Text
              style={[{ color: activeTheme.textColor }, styles.sectionTitle]}
            >
              {t('screen_preferences_title_download')}
            </Text>
          </View>

          <View
            style={[
              styles.settingItem,
              { borderBottomColor: activeTheme.borderColor },
            ]}
          >
            <View style={styles.switchContainer}>
              <Text
                style={[{ color: activeTheme.textColor }, styles.settingText]}
              >
                {t('screen_preferences_setting_download_update')}
              </Text>
              <Switch
                value={downloadOnUpdate}
                onValueChange={handleDownloadOnUpdateChange}
                thumbColor={
                  downloadOnUpdate ? activeTheme.primaryColor : '#f4f3f4'
                }
                trackColor={{
                  false: '#767577',
                  true: `${activeTheme.primaryColor}40`,
                }}
              />
            </View>
          </View>
          <View style={[styles.settingItem, { borderBottomWidth: 0 }]}>
            <Text
              style={[{ color: activeTheme.textColor }, styles.settingText]}
            >
              {t('screen_preferences_label_download_while_reading')}
            </Text>
            <CustomDropdown
              selectedValue={downloadWhileReading}
              onValueChange={handleDownloadWhileReadinChange}
              theme={activeTheme}
              style={{ marginTop: 8 }}
            >
              {Object.values(DOWNLOAD_WHILE_READING).map(restriction => (
                <CustomDropdown.Item
                  key={restriction.value}
                  label={t(restriction.label)}
                  value={restriction.value}
                />
              ))}
            </CustomDropdown>
          </View>
        </View>

        {/* RESTART ONBOARDING */}
        <View
          style={[styles.section, { borderBottomWidth: 0, marginBottom: 8 }]}
        >
          <TouchableOpacity
            style={[
              styles.restartButton,
              {
                backgroundColor: activeTheme.inputBackground,
                borderColor: activeTheme.borderColor,
              },
            ]}
            onPress={handleRestartOnboarding}
            activeOpacity={0.7}
          >
            <Icon name="replay" size={20} color={activeTheme.iconColor} />
            <View style={styles.restartButtonContent}>
              <Text
                style={[
                  { color: activeTheme.textColor },
                  { fontSize: 16, marginBottom: 2 },
                ]}
              >
                {t('screen_preferences_onboarding_button_title')}
              </Text>
              <Text
                style={{ fontSize: 13, color: activeTheme.secondaryTextColor }}
              >
                {t('screen_preferences_onboarding_button_text')}
              </Text>
            </View>
            <Icon
              name="chevron-right"
              size={20}
              color={activeTheme.placeholderColor}
            />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 24,
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
  viewModeSelectButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginHorizontal: 1,
    borderWidth: 1,
    flexDirection: "row"
  },
  viewModeButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  restartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  restartButtonContent: {
    flex: 1,
  },
});

export default PreferencesScreen;
