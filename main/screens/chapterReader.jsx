import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { WebView } from 'react-native-webview';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Svg, { Circle } from 'react-native-svg';
import Slider from '@react-native-community/slider';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PULL_THRESHOLD = 150;

const PullIndicator = ({ progress, theme }) => {
  const size = 60;
  const strokeWidth = 5;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - circumference * progress;

  return (
    <View style={styles.pullIndicatorContainer}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={size / 2}
          fill={theme.cardBackground}
        />
        <Circle
          stroke={theme.primaryColor}
          fill="transparent"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <Icon
        name="arrow-upward"
        size={28}
        color={theme.primaryColor}
        style={styles.pullIndicatorIcon}
      />
    </View>
  );
};

const ChapterReader = ({
                         currentTheme,
                         workId,
                         workTitle,
                         chapterTitle,
                         htmlContent,
                         currentChapterIndex,
                         totalChapters,
                         hasNextChapter,
                         hasPreviousChapter,
                         onNextChapter,
                         onPreviousChapter,
                         onProgressUpdate,
                       }) => {
  const [barsVisible, setBarsVisible] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [pullDistance, setPullDistance] = useState(0);
  // State to track if WebView has finished loading and is ready for commands
  const [webViewReady, setWebViewReady] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const webViewRef = useRef(null);

  // Function to send commands to the WebView
  const sendWebViewCommand = useCallback((action, payload = {}) => {
    if (webViewRef.current && webViewReady) {
      const message = JSON.stringify({ action, payload });
      // Call a predefined function in the WebView to handle the command
      webViewRef.current.injectJavaScript(`
        if (window.onMessageFromReactNative) {
          window.onMessageFromReactNative(${message});
        }
        true;
      `);
    }
  }, [webViewReady]);

  useEffect(() => {
    // Reset state when chapter changes
    setScrollProgress(0);
    setPullDistance(0);
    setWebViewReady(false); // Reset ready state for new chapter
  }, [currentChapterIndex, workId]);

  useEffect(() => {
    // Once WebView is ready, scroll to top for the new chapter
    if (webViewReady) {
      sendWebViewCommand('scrollTo', { position: 0 });
    }
  }, [webViewReady, sendWebViewCommand]); // Depend on webViewReady and sendWebViewCommand

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: barsVisible ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [barsVisible]);

  const handleWebViewLoadEnd = useCallback(() => {
    setWebViewReady(true);
  }, []);

  const onSliderValueChange = useCallback(
    (value) => {
      setScrollProgress(value);
      sendWebViewCommand('scrollToProgress', { progress: value });
    },
    [sendWebViewCommand],
  );

  const onSliderSlidingComplete = useCallback(
    (value) => {
      onProgressUpdate?.(value);
    },
    [onProgressUpdate]
  );

  const toggleBars = useCallback(() => {
    setBarsVisible(!barsVisible);
  }, [barsVisible]);

  // Handle messages coming from the WebView
  const handleMessage = useCallback(
    (event) => {
      try {
        const data = JSON.parse(event.nativeEvent.data);

        switch (data.type) {
          case 'scroll': {
            const { progress } = data;
            setScrollProgress(progress);
            onProgressUpdate?.(progress);
            break;
          }
          case 'tap': {
            toggleBars();
            break;
          }
          case 'pull': {
            if (hasNextChapter) {
              setPullDistance(data.distance);
            }
            break;
          }
          case 'pullEnd': {
            if (hasNextChapter && data.distance > PULL_THRESHOLD) {
              onNextChapter?.();
            }
            setPullDistance(0);
            break;
          }
          case 'log': {
            console.log('WebView Log:', data.message);
            break;
          }
          default:
            console.log('RN: Unknown message type from WebView:', data.type);
        }
      } catch (error) {
        console.error('RN: Error handling message from WebView:', error);
      }
    },
    [
      onProgressUpdate,
      toggleBars,
      hasNextChapter,
      onNextChapter,
    ],
  );

  const handleForwardButton = useCallback(() => {
    if (hasNextChapter) {
      console.log('RN: Navigating to next chapter.');
      onNextChapter?.();
    }
  }, [hasNextChapter, onNextChapter]);

  const handleBackButton = useCallback(() => {
    if (hasPreviousChapter) {
      console.log('RN: Navigating to previous chapter.');
      onPreviousChapter?.();
    }
  }, [hasPreviousChapter, onPreviousChapter]);

  // JavaScript to be injected into the WebView
  const injectedJavaScript = `
    // Function to send logs from WebView to React Native
    function webViewLog(message) {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'log', message: message }));
      }
    }

    // Define a global function that React Native can call
    window.onMessageFromReactNative = (message) => {
      webViewLog('WebView: Received message from RN: ' + JSON.stringify(message));
      switch (message.action) {
        case 'scrollTo':
          // Scroll to a specific position (e.g., 0 for top)
          window.scrollTo(0, message.payload.position);
          webViewLog('WebView: Scrolled to position ' + message.payload.position);
          break;
        case 'scrollToProgress':
          // Scroll based on a progress value (0 to 1)
          const contentHeight = document.body.scrollHeight;
          const scrollViewHeight = window.innerHeight;
          const maxScroll = Math.max(0, contentHeight - scrollViewHeight);
          document.documentElement.scrollTop = message.payload.progress * maxScroll;
          webViewLog('WebView: Scrolled to progress ' + message.payload.progress);
          break;
        // Add more cases for other commands as needed
        default:
          webViewLog('WebView: Unknown command from RN: ' + message.action);
      }
    };

    // Set viewport meta tag for responsiveness
    const meta = document.createElement('meta');
    meta.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
    meta.setAttribute('name', 'viewport');
    document.getElementsByTagName('head')[0].appendChild(meta);

    // Apply theme styles
    document.body.style.backgroundColor = '${currentTheme.backgroundColor}';
    document.body.style.color = '${currentTheme.textColor}';
    document.body.style.padding = '20px';
    document.body.style.paddingBottom = '120px';
    document.body.style.webkitUserSelect = 'none';
    document.body.style.userSelect = 'none';
    document.body.style.webkitTapHighlightColor = 'transparent';
    document.querySelectorAll('a').forEach(a => a.style.color = '${currentTheme.primaryColor}');

    // Handle scroll events and send progress to RN
    let scrollTimeout;
    function handleScroll() {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        const contentHeight = document.body.scrollHeight;
        const scrollViewHeight = window.innerHeight;
        const scrollY = window.scrollY;
        const maxScroll = contentHeight - scrollViewHeight;
        const progress = maxScroll > 0 ? Math.min(scrollY / maxScroll, 1) : 0;
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'scroll', progress }));
        }
      }, 50);
    }
    window.addEventListener('scroll', handleScroll, { passive: true });

    // Handle tap events and send to RN
    document.addEventListener('click', (e) => {
      if (!['A', 'BUTTON', 'INPUT'].includes(e.target.tagName)) {
        e.preventDefault();
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'tap' }));
        }
      }
    });

    // Handle pull-to-refresh/next-chapter gesture
    const PULL_THRESHOLD = ${PULL_THRESHOLD};
    let touchStartY = 0;
    let isPulling = false;
    let currentPullDistance = 0;

    document.addEventListener('touchstart', (e) => {
      touchStartY = e.touches[0].clientY;
      isPulling = false;
      document.body.style.transition = 'none';
    }, { passive: true });

    document.addEventListener('touchmove', (e) => {
      const isAtBottom = window.scrollY + window.innerHeight >= document.body.scrollHeight - 5;
      if (!isAtBottom) return;

      const touchCurrentY = e.touches[0].clientY;
      const deltaY = touchStartY - touchCurrentY;

      if (deltaY > 0) {
        e.preventDefault();
        isPulling = true;
        currentPullDistance = deltaY;
        const elasticDistance = currentPullDistance * 0.4;
        document.body.style.transform = \`translateY(-\${elasticDistance}px)\`;
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'pull', distance: currentPullDistance }));
        }
      }
    }, { passive: false });

    document.addEventListener('touchend', (e) => {
      if (isPulling) {
        document.body.style.transition = 'transform 0.25s ease-out';
        document.body.style.transform = 'translateY(0px)';
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'pullEnd', distance: currentPullDistance }));
        }
      }
      isPulling = false;
      currentPullDistance = 0;
    });

    // Indicate that initial JavaScript has been injected and WebView is ready for commands
    webViewLog('WebView: Injected JavaScript loaded and ready.');
    true;
  `;

  const renderTopBar = () => (
    <Animated.View
      style={[
        styles.topBar,
        {
          backgroundColor: `${currentTheme.backgroundColor}E6`,
          opacity: fadeAnim,
        },
      ]}
      pointerEvents={barsVisible ? 'auto' : 'none'}
    >
      <View style={styles.titleContainer}>
        <Text
          style={[styles.workTitle, { color: currentTheme.textColor }]}
          numberOfLines={1}
        >
          {workTitle}
        </Text>
        <Text
          style={[
            styles.chapterTitle,
            { color: currentTheme.secondaryTextColor },
          ]}
          numberOfLines={1}
        >
          {chapterTitle}
        </Text>
      </View>
    </Animated.View>
  );

  const renderBottomBar = () => (
    <Animated.View
      style={[styles.bottomBar, { opacity: fadeAnim }]}
      pointerEvents={barsVisible ? 'auto' : 'none'}
    >
      {hasPreviousChapter && (
        <TouchableOpacity
          style={[
            styles.navButton,
            { backgroundColor: currentTheme.cardBackground },
          ]}
          onPress={handleBackButton}
        >
          <Icon name="chevron-left" size={24} color={currentTheme.iconColor} />
        </TouchableOpacity>
      )}

      <View
        style={[
          styles.progressContainer,
          {
            backgroundColor: currentTheme.cardBackground,
            marginLeft: hasPreviousChapter ? 15 : 0,
            marginRight: hasNextChapter ? 15 : 0,
          },
        ]}
      >
        <View style={styles.progressInfo}>
          <Text style={[styles.progressText, { color: currentTheme.textColor }]}>
            {Math.round(scrollProgress * 100)}%
          </Text>
          <Text
            style={[
              styles.chapterInfo,
              { color: currentTheme.secondaryTextColor },
            ]}
          >
            {currentChapterIndex + 1} / {totalChapters}
          </Text>
        </View>
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={1}
          value={scrollProgress}
          onValueChange={onSliderValueChange}
          onSlidingComplete={onSliderSlidingComplete}
          minimumTrackTintColor={currentTheme.primaryColor}
          maximumTrackTintColor={currentTheme.inputBackground}
          thumbTintColor={currentTheme.primaryColor}
        />
      </View>

      {hasNextChapter && (
        <TouchableOpacity
          style={[
            styles.navButton,
            { backgroundColor: currentTheme.cardBackground },
          ]}
          onPress={handleForwardButton}
        >
          <Icon name="chevron-right" size={24} color={currentTheme.iconColor} />
        </TouchableOpacity>
      )}
    </Animated.View>
  );

  const renderPullIndicator = () => {
    if (!hasNextChapter || pullDistance <= 0) return null;

    const progress = Math.min(pullDistance / PULL_THRESHOLD, 1);
    const opacity = Math.min(1, pullDistance / (PULL_THRESHOLD * 0.5));

    return (
      <View style={[styles.pullContainer, { opacity }]} pointerEvents="none">
        <PullIndicator progress={progress} theme={currentTheme} />
        <Text style={[styles.pullText, { color: currentTheme.textColor }]}>
          {progress < 1
            ? 'Pull up for next chapter'
            : 'Release for next chapter'}
        </Text>
      </View>
    );
  };

  return (
    <GestureHandlerRootView style={styles.root}>
      <View
        style={[
          styles.container,
          { backgroundColor: currentTheme.backgroundColor },
        ]}
      >
        <WebView
          ref={webViewRef}
          originWhitelist={['*']}
          source={{ html: htmlContent || '<p></p>' }}
          style={styles.webView}
          // The injectedJavaScript runs once when the WebView loads
          injectedJavaScript={injectedJavaScript}
          // onMessage handles communication from WebView to React Native
          onMessage={handleMessage}
          // onLoadEnd is called when the WebView finishes loading content
          onLoadEnd={handleWebViewLoadEnd}
          showsVerticalScrollIndicator={false}
          bounces={false}
          overScrollMode="never"
        />
        {renderPullIndicator()}
        {renderTopBar()}
        {renderBottomBar()}
      </View>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  webView: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 10,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  titleContainer: {
    alignItems: 'center',
  },
  workTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  chapterTitle: {
    fontSize: 14,
    marginTop: 2,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: Platform.OS === 'ios' ? 30 : 20,
    paddingTop: 15,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0)',
  },
  navButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  progressContainer: {
    flex: 1,
    height: 60,
    borderRadius: 30,
    paddingHorizontal: 20,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
  },
  chapterInfo: {
    fontSize: 12,
  },
  slider: {
    width: '100%',
    height: 20,
  },
  pullContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pullIndicatorContainer: {
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pullIndicatorIcon: {
    position: 'absolute',
  },
  pullText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '500',
  },
});

export default ChapterReader;
