import React, { useEffect, useState } from 'react';
import {
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
import { pick, keepLocalCopy } from '@react-native-documents/picker';
import { loadFont, loadFontFromFile } from "@vitrion/react-native-load-fonts";
import { readFile } from "react-native-fs"

const PreferencesScreen = ({
  currentTheme,
  settingsDAO,
  setScreens,
  setTheme,
  viewMode,
  setViewMode,
}) => {
  // DB Settings State
  const [fontSize, setFontSize] = useState(1.0);
  const [useCustomSize, setUseCustomSize] = useState(false);
  const [font, setFont] = useState("");
  const [fontFamily, setFontFamily] = useState("");
  const [useCustomFont, setUseCustomFont] = useState(false);
  const [theme, setLocalTheme] = useState('black');
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

  const activeTheme = themes[theme] || themes.black;

  const dynamicStyle = [{ color: activeTheme.textColor }, useCustomFont ? { fontFamily } : {}]

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
        setFontFamily(dbSettings.fontFamily || 'Helvetica')
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

    keepLocalCopy({ destination: 'cachesDirectory', files: [{ uri: picked.uri, fileName: picked.name }] }).then(async ([dest]) => {
      const fontContent = await readFile(dest.localUri, 'base64');

      const ff = await loadFont(picked.name.replace(/\.(?=.*\.)/g, '').split('.')[0], fontContent, picked.type.split('/')[1]).catch(e => console.error(e));
      setFont(dest.localUri);
      setFontFamily(ff);
      saveDbSettings({ fontFamily: ff, font: dest.localUri });
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

  // --- HTML Preview ---

  const sampleHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        ${useCustomFont ? `@font-face {font-family: '${fontFamily}'; src: url('${font}')}` : ""}

        body {
          font-family: ${useCustomFont ? fontFamily : "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"};
          line-height: 1.6;
          padding: 20px;
          background-color: ${currentTheme.backgroundColor};
          color: ${currentTheme.textColor};
          font-size: ${useCustomSize ? fontSize + 'em' : '1em'};
        }
        h1 { 
          color: ${currentTheme.textColor};
          border-bottom: 2px solid ${currentTheme.primaryColor};
          padding-bottom: 8px;
        }
        p { 
          color: ${currentTheme.textColor};
          margin-bottom: 12px;
        }
        a { 
          color: ${currentTheme.primaryColor};
        }
        blockquote {
          border-left: 4px solid ${currentTheme.primaryColor};
          background-color: ${currentTheme.inputBackground};
          padding: 16px;
          margin: 16px 0;
          border-radius: 4px;
        }
      </style>
    </head>
    <body>
      <h1>Sample Chapter</h1>
      <p>This is a sample text to preview your reader settings. You can adjust the font size using the controls below.</p>
      <blockquote>
        <p>Blockquotes and other elements will also reflect your custom settings.</p>
      </blockquote>
      <p>Try different font sizes to find what works best for you!</p>
    </body>
    </html>
  `;

  // --- Render Helpers ---

  const ThemeButton = ({ themeKey, label, isActive, onPress }) => {
    const buttonStyle = [
      styles.themeButton,
      { backgroundColor: isActive ? activeTheme.primaryColor : 'transparent' },
    ];
    const textStyle = [
      styles.themeButtonText,
      { color: isActive ? '#ffffff' : activeTheme.textColor },
      dynamicStyle[1]
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
      dynamicStyle[1]
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
    setScreens(prev => {
      const newScreens = [...prev];
      newScreens.pop();
      return newScreens;
    });
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
        <Text style={[styles.title, { color: activeTheme.textColor }, useCustomFont ? { fontFamily } : { fontWeight: 'bold' }]}>
          Settings
        </Text>
      </View>

      <ScrollView style={styles.content}>
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
              style={[styles.sectionTitle, ...dynamicStyle]}
            >
              Reader
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
                style={[styles.settingText, ...dynamicStyle]}
              >
                Use Custom Size
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
                style={[styles.settingText, ...dynamicStyle]}
              >
                Font Size: {fontSize.toFixed(1)}
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
                  style={[styles.sizeInput, ...dynamicStyle]}
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
                style={[styles.settingText, ...dynamicStyle]}
              >
                Use Custom Font
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
              <TouchableOpacity style={[styles.viewModeSelectButton, { backgroundColor: activeTheme.buttonBackground, paddingBottom: 0, marginHorizontal: 0, borderColor: activeTheme.borderColor, alignContent: "center" }]} activeOpacity={0.3} onPress={handleFontChange}>
                <Text style={[styles.settingText, ...dynamicStyle]}>
                  {fontFamily}
                </Text>
                <Icon
                  name={"chevron-right"}
                  size={24}
                  style={{color: currentTheme.placeholderColor, marginLeft: "auto"}}
                />
              </TouchableOpacity>
            </View>
          )}

          <View style={[
            styles.settingItem,
            { borderBottomColor: activeTheme.borderColor },
          ]}>
            <View style={styles.switchContainer}>
              <Text
                style={[styles.settingText, ...dynamicStyle]}
              >
                Show Chapter Date
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
              { borderBottomWidth: 0 }
            ]}
          >
            <View style={[styles.switchContainer]}>
              <Text
                style={[styles.settingText, ...dynamicStyle]}
              >
                Allow selecting text
              </Text>
              <Switch
                value={allowSelect}
                onValueChange={handleAllowSelect}
                thumbColor={
                  allowSelect ? activeTheme.primaryColor : '#f4f3f4'
                }
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
              style={[styles.sectionTitle, ...dynamicStyle]}
            >
              Appearance
            </Text>
          </View>

          <View style={styles.settingItem}>
            <Text
              style={[styles.settingText, ...dynamicStyle]}
            >
              Theme
            </Text>
            <View
              style={[
                styles.themeContainer,
                { backgroundColor: activeTheme.inputBackground },
              ]}
            >
              <ThemeButton
                themeKey="light"
                label="Light"
                isActive={theme === 'light'}
                onPress={() => handleThemeChange('light')}
              />
              <ThemeButton
                themeKey="dark"
                label="Dark"
                isActive={theme === 'dark'}
                onPress={() => handleThemeChange('dark')}
              />
              <ThemeButton
                themeKey="black"
                label="Black"
                isActive={theme === 'black'}
                onPress={() => handleThemeChange('black')}
              />
            </View>
          </View>

          <View style={[styles.settingItem, { borderBottomWidth: 0 }]}>
            <Text
              style={[styles.settingText, ...dynamicStyle]}
            >
              View Mode
            </Text>
            <View
              style={[
                styles.viewModeContainer,
                { backgroundColor: activeTheme.inputBackground },
              ]}
            >
              <ViewModeButton
                mode="full"
                label="Full"
                isActive={localViewMode === 'full'}
                onPress={() => handleViewModeChange('full')}
              />
              <ViewModeButton
                mode="med"
                label="Med"
                isActive={localViewMode === 'med'}
                onPress={() => handleViewModeChange('med')}
              />
              <ViewModeButton
                mode="small"
                label="Small"
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
                style={[styles.settingText, ...dynamicStyle]}
              >
                Prefer Full Descriptions
              </Text>
              <Switch
                value={preferDesc}
                onValueChange={handlePreferDesc}
                thumbColor={
                  preferDesc ? activeTheme.primaryColor : '#f4f3f4'
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
              { borderBottomWidth: 0 }
            ]}
          >
            <View style={styles.switchContainer}>
              <Text
                style={[styles.settingText, ...dynamicStyle]}
              >
                Prefer HTML Styling
              </Text>
              <Switch
                value={preferHtml}
                onValueChange={handlePreferHtml}
                thumbColor={
                  preferHtml ? activeTheme.primaryColor : '#f4f3f4'
                }
                trackColor={{
                  false: '#767577',
                  true: `${activeTheme.primaryColor}40`,
                }}
              />
            </View>
          </View>


        </View>

        {/* UPDATE & NOTIFICATION SETTINGS */}
        <View style={[styles.section, { borderColor: activeTheme.borderColor}]}>
          <View style={styles.sectionHeader}>
            <Icon name="update" size={20} color={activeTheme.iconColor} />
            <Text
              style={[styles.sectionTitle, ...dynamicStyle]}
            >
              Updates
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
                style={[styles.settingText, ...dynamicStyle]}
              >
                Compact Notifications
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
              style={[styles.settingText, ...dynamicStyle]}
            >
              Check Frequency
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
                  label={interval.label}
                  value={interval.value}
                />
              ))}
            </CustomDropdown>
          </View>

          <View style={[styles.settingItem, { borderBottomWidth: 0 }]}>
            <Text
              style={[styles.settingText, ...dynamicStyle]}
            >
              Network Restriction
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
                  label={restriction.label}
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
              style={[styles.sectionTitle, ...dynamicStyle]}
            >
              Download
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
                style={[styles.settingText, ...dynamicStyle]}
              >
                Download on Update
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
              style={[styles.settingText, ...dynamicStyle]}
            >
              Download while reading
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
                  label={restriction.label}
                  value={restriction.value}
                />
              ))}
            </CustomDropdown>
          </View>
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
});

export default PreferencesScreen;