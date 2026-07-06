// MainOnboardScreen.jsx
import { SafeAreaView, StyleSheet, View } from 'react-native';
import { useState } from 'react';
import Step1 from './Screens/Step1Screen';
import Step2 from './Screens/Step2Screen'; // Language
import Step3 from './Screens/Step3Screen'; // Theme (was Step2)
import Step4 from './Screens/Step4Screen'; // Support (was Step3)

export default function MainOnboardScreen({
  setCurrentTheme,
  currentTheme,
  theme,
  setTheme,
  onFinish,
}) {
  const [screen, setScreen] = useState(0);

  const renderScreen = () => {
    switch (screen) {
      case 0:
        return <Step1 currentTheme={currentTheme} setScreen={setScreen} />;
      case 1:
        return <Step2 currentTheme={currentTheme} setScreen={setScreen} />;
      case 2:
        return (
          <Step3
            currentTheme={currentTheme}
            setScreen={setScreen}
            theme={theme}
            setTheme={setTheme}
          />
        );
      case 3:
        return (
          <Step4
            currentTheme={currentTheme}
            setScreen={setScreen}
            onFinish={onFinish}
          />
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: currentTheme.backgroundColor },
      ]}
    >
      {/* Progress dots – now 4 steps */}
      <View style={styles.dotsRow}>
        {[0, 1, 2, 3].map(i => (
          <View
            key={i}
            style={[
              styles.dot,
              {
                backgroundColor:
                  i === screen
                    ? currentTheme.primaryColor
                    : currentTheme.borderColor,
                width: i === screen ? 20 : 8,
              },
            ]}
          />
        ))}
      </View>

      {renderScreen()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingTop: 16,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
});