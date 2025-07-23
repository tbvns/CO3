import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  TextInput,
  SafeAreaView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { WebView } from 'react-native-webview';
import Slider from '@react-native-community/slider';

const PreferencesScreen = ({
                             currentTheme,
                             settingsDAO,
                             setScreens,
                           }) => {
  const [fontSize, setFontSize] = useState(1.0);
  const [useCustomSize, setUseCustomSize] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const settings = await settingsDAO.getSettings();
      setFontSize(settings.fontSize || 1.0);
      setUseCustomSize(settings.useCustomSize || false);
    } catch (error) {
      console.error('Error loading reader settings:', error);
    }
  };

  const saveSettings = async (newSettings) => {
    try {
      const settings = await settingsDAO.getSettings();
      const updatedSettings = { ...settings, ...newSettings };
      await settingsDAO.saveSettings(updatedSettings);
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  const handleFontSizeChange = (value) => {
    const clampedValue = Math.min(Math.max(value, 0.5), 3);
    setFontSize(clampedValue);
    saveSettings({ fontSize: clampedValue });
  };

  const handleFontSizeInput = (text) => {
    const numValue = parseFloat(text);
    if (!isNaN(numValue)) {
      handleFontSizeChange(numValue);
    }
  };

  const toggleCustomSize = () => {
    const newValue = !useCustomSize;
    setUseCustomSize(newValue);
    saveSettings({ useCustomSize: newValue });
  };

  const sampleHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
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

  function onBack() {
    setScreens(prev => {
      const newScreens = [...prev];
      newScreens.pop();
      return newScreens;
    });
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: currentTheme.backgroundColor }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Icon name="arrow-back" size={24} color={currentTheme.textColor} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: currentTheme.textColor }]}>Browser Settings</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.readerSettingsContainer}>
          <View style={[styles.previewContainer, { backgroundColor: currentTheme.cardBackground }]}>
            <WebView
              originWhitelist={['*']}
              source={{ html: sampleHtml }}
              style={{ height: 200 }}
              scalesPageToFit={true}
              bounces={false}
              scrollEnabled={false}
            />
          </View>

          <View style={[styles.settingItem, { borderBottomColor: currentTheme.borderColor }]}>
            <View style={styles.switchContainer}>
              <Text style={[styles.settingText, { color: currentTheme.textColor }]}>
                Use Custom Size
              </Text>
              <Switch
                value={useCustomSize}
                onValueChange={toggleCustomSize}
                thumbColor={useCustomSize ? currentTheme.primaryColor : '#f4f3f4'}
                trackColor={{ false: '#767577', true: `${currentTheme.primaryColor}40` }}
              />
            </View>
          </View>

          {useCustomSize && (
            <View style={[styles.settingItem, { borderBottomColor: currentTheme.borderColor }]}>
              <Text style={[styles.settingText, { color: currentTheme.textColor }]}>
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
                  minimumTrackTintColor={currentTheme.primaryColor}
                  maximumTrackTintColor={currentTheme.borderColor}
                  thumbStyle={{ backgroundColor: currentTheme.primaryColor }}
                />
                <TextInput
                  style={[styles.sizeInput, {
                    color: currentTheme.textColor,
                    backgroundColor: currentTheme.inputBackground,
                    borderColor: currentTheme.borderColor
                  }]}
                  value={fontSize.toString()}
                  onChangeText={handleFontSizeInput}
                  keyboardType="numeric"
                  maxLength={3}
                />
              </View>
            </View>
          )}
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
  readerSettingsContainer: {
    flex: 1,
    marginBottom: 24,
  },
  previewContainer: {
    borderRadius: 8,
    marginBottom: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e0e0e0',
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
    height: 40,
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 10,
    textAlign: 'center',
  },
});

export default PreferencesScreen;
