import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView } from 'react-native';

export default function Step1({ currentTheme, setScreen }) {
  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
        <View style={[styles.logoWrapper, { borderColor: currentTheme.borderColor }]}>
          <Image
            style={styles.logo}
            source={require('../../res/CO3.png')}
            resizeMode="contain"
          />
        </View>

        <Text style={[styles.appName, { color: currentTheme.textColor }]}>
          Client Of Our Own
        </Text>

        <Text style={[styles.tagline, { color: currentTheme.secondaryTextColor }]}>
          The free, open source AO3 reader
        </Text>

        <View style={[styles.divider, { backgroundColor: currentTheme.borderColor }]} />

        <Text style={[styles.body, { color: currentTheme.secondaryTextColor }]}>
          No subscriptions. No ads. No paywalled features.{'\n'}
          Just your stories, the way they should be.
        </Text>
      </ScrollView>

      <View style={[styles.bottomSection, { borderTopColor: currentTheme.borderColor }]}>
        <TouchableOpacity
          style={[styles.nextButton, { backgroundColor: currentTheme.primaryColor }]}
          onPress={() => setScreen(prev => prev + 1)}
          activeOpacity={0.85}
        >
          <Text style={styles.nextButtonText}>Get Started</Text>
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
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 48,
    paddingBottom: 24,
    flexGrow: 1,
    justifyContent: 'center',
  },
  logoWrapper: {
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
    overflow: 'hidden',
  },
  logo: {
    width: 100,
    height: 100,
  },
  appName: {
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.5,
    textAlign: 'center',
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    fontWeight: '400',
    textAlign: 'center',
    marginBottom: 32,
  },
  divider: {
    height: 1,
    width: 48,
    marginBottom: 24,
  },
  body: {
    fontSize: 15,
    lineHeight: 24,
    textAlign: 'center',
  },
  bottomSection: {
    paddingHorizontal: 32,
    paddingTop: 16,
    paddingBottom: 32,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  nextButton: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  nextButtonText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});